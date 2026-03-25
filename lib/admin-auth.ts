import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "l2e_admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;

function generateSessionToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const token = generateSessionToken();
  await prisma.adminSession.create({
    data: {
      token,
      adminId: admin.id,
      expiresAt: new Date(Date.now() + SESSION_DURATION),
    },
  });

  return { token, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role } };
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

export async function getAdminFromRequest(req: Request) {
  let admin = await getAdminSession();
  if (!admin) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      admin = await getAdminSessionFromToken(authHeader.slice(7));
    }
  }
  return admin;
}

export async function adminLogout(token: string) {
  await prisma.adminSession.deleteMany({ where: { token } }).catch(() => {});
}

export function requireRole(adminRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(adminRole);
}

export { SESSION_COOKIE };
