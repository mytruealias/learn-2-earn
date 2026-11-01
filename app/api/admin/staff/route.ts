import { lockStaffScope } from "@/lib/program-scope";
import { staffList } from "@/lib/staff/lists";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { membershipRole } from "@/lib/program-scope";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson } from "@/lib/api-helpers";
const schema = z
  .object({
    requestKey: z.string().uuid(),
    email: z.string().trim().toLowerCase().email().max(255),
    fullName: z.string().trim().min(1).max(120),
    role: z.enum(["admin", "caseworker", "finance"]),
  })
  .strict();
export const GET = (req: Request) => staffList(req, "staff");

export async function POST(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    const p = await parseJson(req, schema);
    if (!p.ok) return p.response;
    const tempPassword = randomBytes(16).toString("base64url");
    const hash = await bcrypt.hash(tempPassword, 12);
    const fingerprint = (await import("@/lib/rewards/accounting")).hash(p.data);
    let replayed = false;
    const staff = await prisma.$transaction(async (tx) => {
      await lockStaffScope(tx, a);
      const current = await getAdminFromRequest(req, tx);
      if (!current || current.role !== "admin") return null;
      const receipt = await tx.staffActionReceipt.findUnique({
        where: {
          programId_requestKey: {
            programId: a.programId,
            requestKey: p.data.requestKey,
          },
        },
      });
      if (receipt) {
        if (receipt.payloadHash !== fingerprint || receipt.adminId !== a.id)
          return null;
        replayed = true;
        const prior = await tx.adminUser.findUnique({
          where: { id: receipt.entityId },
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        });
        return prior ? { ...prior, role: p.data.role } : null;
      }
      // Never overwrite/recover an identity belonging to another program.
      if (await tx.adminUser.findUnique({ where: { email: p.data.email } }))
        return null;
      const user = await tx.adminUser.create({
        data: {
          email: p.data.email,
          fullName: p.data.fullName,
          role: p.data.role,
          passwordHash: hash,
          mustChangePassword: true,
          memberships: {
            create: {
              programId: a.programId,
              role: membershipRole(p.data.role)!,
            },
          },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
      await tx.auditLog.create({
        data: {
          programId: a.programId,
          adminId: a.id,
          action: "PROGRAM_STAFF_PROVISIONED",
          entity: "AdminUser",
          entityId: user.id,
          details: JSON.stringify({
            role: p.data.role,
            credentialDelivery: "verified-manual-required",
          }),
        },
      });
      await tx.staffActionReceipt.create({
        data: {
          programId: a.programId,
          adminId: a.id,
          requestKey: p.data.requestKey,
          payloadHash: fingerprint,
          entity: "AdminUser",
          entityId: user.id,
          action: "provision",
          version: 0,
        },
      });
      return { ...user, role: p.data.role };
    });
    if (!staff)
      return apiError(
        "conflict",
        "Staff provisioning was not available. Ask your verified operator to review this identity or your permissions.",
        409,
      );
    return apiOk(
      { staff, tempPassword: replayed ? null : tempPassword, replayed },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiServerError("staff/create", e);
  }
}
