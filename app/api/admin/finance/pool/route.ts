import { z } from "zod";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { apiError, apiOk, apiServerError, parseJson, getClientIp } from "@/lib/api-helpers";

const ALLOWED_ROLES = ["admin", "finance"];
const POOL_SINGLETON_ID = "singleton";

async function ensurePool() {
  return prisma.poolBalance.upsert({
    where: { id: POOL_SINGLETON_ID },
    update: {},
    create: { id: POOL_SINGLETON_ID, balanceCents: 0 },
  });
}

const PostSchema = z.object({
  amountCents: z.coerce.number().int().refine((n) => n !== 0, "amountCents must be a non-zero integer"),
  reason: z.string().trim().min(1, "reason is required").max(500),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return apiError("forbidden", "Admin or finance role required", 403);
    }

    const [poolBalance, adjustments] = await Promise.all([
      ensurePool(),
      prisma.poolAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { fullName: true } } },
      }),
    ]);

    return apiOk({
      pool: { balanceCents: poolBalance.balanceCents, updatedAt: poolBalance.updatedAt },
      adjustments: adjustments.map((a) => ({
        id: a.id,
        amountCents: a.amountCents,
        reason: a.reason,
        createdAt: a.createdAt,
        adminName: a.admin.fullName,
      })),
    });
  } catch (error) {
    return apiServerError("admin/finance/pool/get", error);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);
    if (!requireRole(admin.role, ALLOWED_ROLES)) {
      return apiError("forbidden", "Admin or finance role required", 403);
    }

    const parsed = await parseJson(req, PostSchema);
    if (!parsed.ok) return parsed.response;
    const { amountCents, reason } = parsed.data;

    await ensurePool();

    const [updatedPool, adjustment] = await prisma.$transaction([
      prisma.poolBalance.update({
        where: { id: POOL_SINGLETON_ID },
        data: { balanceCents: { increment: amountCents }, updatedById: admin.id },
      }),
      prisma.poolAdjustment.create({
        data: { adminId: admin.id, amountCents, reason },
      }),
    ]);

    await logAudit({
      adminId: admin.id,
      action: amountCents > 0 ? "POOL_DEPOSIT" : "POOL_WITHDRAWAL",
      entity: "PoolBalance",
      entityId: updatedPool.id,
      details: JSON.stringify({ amountCents, reason, newBalanceCents: updatedPool.balanceCents }),
      ipAddress: getClientIp(req),
    });

    return apiOk({
      pool: { balanceCents: updatedPool.balanceCents, updatedAt: updatedPool.updatedAt },
      adjustment: { id: adjustment.id, amountCents, reason: adjustment.reason, createdAt: adjustment.createdAt },
    });
  } catch (error) {
    return apiServerError("admin/finance/pool/post", error);
  }
}
