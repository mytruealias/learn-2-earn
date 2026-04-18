import { z } from "zod";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const PatchSchema = z.object({
  caseNumber: z.string().max(60).optional(),
  xpAdjustment: z.number().int().min(-100000).max(100000).optional(),
  xpReason: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: {
              select: {
                title: true,
                xpReward: true,
                module: { select: { title: true, path: { select: { title: true } } } },
              },
            },
          },
          orderBy: { completedAt: "desc" },
        },
        payoutRequests: { orderBy: { createdAt: "desc" } },
        consents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!user) return apiError("not_found", "User not found", 404);

    await logAudit({
      adminId: admin.id,
      action: "VIEW_USER_DETAIL",
      entity: "User",
      entityId: userId,
      ipAddress: getClientIp(req),
    });

    const { passwordHash: _passwordHash, ...safeUser } = user;
    void _passwordHash;
    return apiOk({ user: safeUser });
  } catch (error) {
    return apiServerError("admin/users/get", error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const { userId } = await params;
    const parsed = await parseJson(req, PatchSchema);
    if (!parsed.ok) return parsed.response;
    const { caseNumber, xpAdjustment, xpReason, isActive } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiError("not_found", "User not found", 404);

    const updateData: Record<string, unknown> = {};
    const auditDetails: Record<string, unknown> = {};

    if (typeof caseNumber === "string") {
      updateData.caseNumber = caseNumber || null;
      auditDetails.caseNumber = { from: user.caseNumber, to: caseNumber };
    }
    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
      auditDetails.isActive = { to: isActive };
    }
    if (typeof xpAdjustment === "number" && xpAdjustment !== 0) {
      if (!xpReason) {
        return apiError("bad_request", "XP adjustment requires a reason", 400);
      }
      updateData.totalXp = Math.max(0, user.totalXp + xpAdjustment);
      auditDetails.xpAdjustment = {
        amount: xpAdjustment,
        reason: xpReason,
        from: user.totalXp,
        to: updateData.totalXp,
      };
    }

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });

    await logAudit({
      adminId: admin.id,
      action: "USER_EDIT",
      entity: "User",
      entityId: userId,
      details: JSON.stringify(auditDetails),
      ipAddress: getClientIp(req),
    });

    const { passwordHash: _passwordHash, ...safeUser } = updatedUser;
    void _passwordHash;
    return apiOk({ user: safeUser });
  } catch (error) {
    return apiServerError("admin/users/patch", error);
  }
}
