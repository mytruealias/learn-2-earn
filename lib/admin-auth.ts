import type { Prisma } from "@prisma/client";
import { readCookie } from "./request-cookie";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { ScopeError, legacyRole, type StaffScope } from "./program-scope";
import {
  staffTokenHash,
  STAFF_ABSOLUTE_MS,
  STAFF_CHALLENGE_MS,
  STAFF_IDLE_MS,
} from "./staff-security";
import { sameOriginError } from "./user-session";
export const SESSION_COOKIE = "l2e_admin_session";
export interface ScopedAdmin extends StaffScope {
  email: string;
  fullName: string;
  programName: string;
  organizationName: string;
  membershipRole: string;
}
export async function createStaffSession(
  db: Prisma.TransactionClient,
  adminId: string,
  verified = false,
  programId: string | null = null,
) {
  const token = randomBytes(48).toString("hex"),
    now = new Date();
  await db.adminSession.create({
    data: {
      token: staffTokenHash(token),
      adminId,
      activeProgramId: programId,
      mfaVerifiedAt: verified ? now : null,
      expiresAt: new Date(
        now.getTime() + (verified ? STAFF_ABSOLUTE_MS : STAFF_CHALLENGE_MS),
      ),
      lastSeenAt: now,
    },
  });
  return token;
}
export async function adminLogin(email: string, password: string) {
  return prisma.$transaction(
    async (db) => {
      const found = await db.adminUser.findUnique({ where: { email } });
      if (!found) {
        await bcrypt.compare(
          password,
          "$2b$12$4gxGGnJrHL9ZC5VvE8a7/O0SkVzPbAa2N0hQYWrQ3KRjRlTdXLfQW",
        );
        return {
          success: false as const,
          error: "Invalid credentials or temporarily unavailable account.",
        };
      }
      await db.$queryRaw`SELECT "id" FROM "AdminUser" WHERE "id"=${found.id} FOR UPDATE`;
      const admin = await db.adminUser.findUniqueOrThrow({
        where: { id: found.id },
      });
      if (
        !admin.isActive ||
        (admin.lockedUntil && admin.lockedUntil > new Date())
      )
        return {
          success: false as const,
          error: "Invalid credentials or temporarily unavailable account.",
        };
      if (!(await bcrypt.compare(password, admin.passwordHash))) {
        await db.auditLog.create({
          data: {
            adminId: admin.id,
            action: "LOGIN_FAILED",
            entity: "AdminUser",
            entityId: admin.id,
          },
        });
        const failures =
          admin.lockedUntil && admin.lockedUntil <= new Date()
            ? 1
            : admin.loginFailures + 1;
        await db.adminUser.update({
          where: { id: admin.id },
          data: {
            loginFailures: failures,
            lockedUntil:
              failures >= 5 ? new Date(Date.now() + 15 * 60_000) : null,
          },
        });
        return {
          success: false as const,
          error: "Invalid credentials or temporarily unavailable account.",
        };
      }
      await db.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date(), loginFailures: 0, lockedUntil: null },
      });
      const token = await createStaffSession(db, admin.id);
      await db.auditLog.create({
        data: {
          adminId: admin.id,
          action: "STAFF_PASSWORD_VERIFIED",
          entity: "AdminUser",
          entityId: admin.id,
        },
      });
      return {
        success: true as const,
        token,
        nextStep: admin.mustChangePassword
          ? "password"
          : admin.mfaConfirmedAt
            ? "verify"
            : "enroll",
        admin: { email: admin.email },
      };
    },
    { timeout: 15000 },
  );
}
export async function staffSession(
  token: string,
  db: Prisma.TransactionClient = prisma,
) {
  if (!token || token.length > 256) return null;
  // Old raw-token sessions deliberately require fresh password + MFA entry.
  const session = await db.adminSession.findUnique({
    where: { token: staffTokenHash(token) },
    include: { admin: true },
  });
  if (
    !session ||
    session.revokedAt ||
    !session.admin.isActive ||
    session.expiresAt <= new Date() ||
    session.lastSeenAt.getTime() <= Date.now() - STAFF_IDLE_MS
  )
    return null;
  return session;
}
export async function getAdminSessionFromToken(
  token: string,
  db: Prisma.TransactionClient = prisma,
): Promise<ScopedAdmin | null> {
  const s = await staffSession(token, db);
  if (
    !s?.mfaVerifiedAt ||
    !s.admin.mfaConfirmedAt ||
    s.admin.mustChangePassword ||
    !s.activeProgramId
  )
    return null;
  const membership = await db.staffMembership.findFirst({
    where: {
      adminId: s.adminId,
      programId: s.activeProgramId,
      isActive: true,
      revokedAt: null,
      program: { isActive: true, organization: { isActive: true } },
    },
    include: { program: { include: { organization: true } } },
  });
  if (!membership) return null;
  // Refresh idle activity sparingly. Absolute expiresAt never extends.
  if (s.lastSeenAt.getTime() < Date.now() - 60_000)
    await db.adminSession.updateMany({
      where: { id: s.id, revokedAt: null },
      data: { lastSeenAt: new Date() },
    });
  return {
    id: s.adminId,
    email: s.admin.email,
    fullName: s.admin.fullName,
    role: legacyRole(membership.role),
    membershipRole: membership.role,
    programId: membership.programId,
    programName: membership.program.name,
    organizationName: membership.program.organization.name,
    sessionId: s.id,
  };
}
export async function getAdminSession() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    return token ? getAdminSessionFromToken(token) : null;
  } catch {
    return null;
  }
}
export async function getAdminFromRequest(
  req: Request,
  db: Prisma.TransactionClient = prisma,
) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && sameOriginError(req))
    throw new ScopeError(
      403,
      "Open this staff page directly before continuing.",
    );
  const token = readCookie(req, SESSION_COOKIE);
  const admin = token ? await getAdminSessionFromToken(token, db) : null;
  if (!admin) return null;
  const path = new URL(req.url).pathname;
  if (
    path.startsWith("/api/admin/cases") &&
    !["admin", "caseworker"].includes(admin.role)
  )
    throw new ScopeError();
  if (
    path.startsWith("/api/admin/directory") &&
    !["GET", "HEAD"].includes(req.method) &&
    !["admin", "caseworker"].includes(admin.role)
  )
    throw new ScopeError();
  if (
    path !== "/api/admin/session" &&
    req.headers.get("x-l2e-program") !== admin.programId
  )
    throw new ScopeError(
      403,
      "Your active program changed. Reload this page before saving.",
    );
  return admin;
}
export async function adminLogout(token: string) {
  await prisma.adminSession.updateMany({
    where: { token: staffTokenHash(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
export function writeStaffCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: token ? STAFF_ABSOLUTE_MS / 1000 : 0,
  });
  const domain = process.env.ROOT_DOMAIN;
  if (domain && /^[a-z0-9.-]+$/i.test(domain))
    res.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; Domain=admin.${domain}; Max-Age=0; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
}
export function requireRole(role: string, roles: string[]) {
  return roles.includes(role);
}
