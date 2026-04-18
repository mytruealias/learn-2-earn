import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const PostSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  fullName: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "caseworker", "finance"]),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ["admin"])) return apiError("forbidden", "Admin role required", 403);

    const staff = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        loginFailures: true,
        lockedUntil: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiOk({ staff });
  } catch (error) {
    return apiServerError("admin/staff/list", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ["admin"])) return apiError("forbidden", "Admin role required", 403);

    const parsed = await parseJson(req, PostSchema);
    if (!parsed.ok) return parsed.response;
    const { email, fullName, role } = parsed.data;

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) return apiError("conflict", "Email already in use", 409);

    const tempPassword = crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newAdmin = await prisma.adminUser.create({
      data: { email, fullName, role, passwordHash, isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "STAFF_CREATE",
      entity: "AdminUser",
      entityId: newAdmin.id,
      details: JSON.stringify({ email, fullName, role }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ staff: newAdmin, tempPassword });
  } catch (error) {
    return apiServerError("admin/staff/create", error);
  }
}
