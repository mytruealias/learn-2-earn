import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SESSION_COOKIE = "l2e_admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return { success: false, error: "Invalid credentials" };

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    return { success: false, error: `Account locked. Try again in ${minutesLeft} minute(s).` };
  }

  const currentFailures = admin.lockedUntil && admin.lockedUntil <= new Date() ? 0 : admin.loginFailures;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const newFailures = currentFailures + 1;
    const locked = newFailures >= MAX_LOGIN_FAILURES;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        loginFailures: newFailures,
        lockedUntil: locked ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
    if (locked) {
      return { success: false, error: `Too many failed attempts. Account locked for 15 minutes.` };
    }
    return { success: false, error: "Invalid credentials" };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), loginFailures: 0, lockedUntil: null },
  });

  const token = generateSessionToken();
  await prisma.adminSession.create({
    data: {
      token,
      adminId: admin.id,
      expiresAt: new Date(Date.now() + SESSION_DURATION),
    },
  });

  return {
    success: true,
    token,
    admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
  };
}

export async function getAdminSessionFromToken(token: string) {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: {
      admin: {
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (!session.admin.isActive) return null;

  return session.admin;
}

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return getAdminSessionFromToken(token);
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(_req: Request) {
  const admin = await getAdminSession();
  return admin;
}

export async function adminLogout(token: string) {
  await prisma.adminSession.deleteMany({ where: { token } }).catch(() => {});
}

export async function unlockAdminAccount(adminId: string) {
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { loginFailures: 0, lockedUntil: null },
  });
}

export function requireRole(adminRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(adminRole);
}

export { SESSION_COOKIE };
