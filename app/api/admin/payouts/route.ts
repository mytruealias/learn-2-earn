import { z } from "zod";
import { getAdminFromRequest, requireRole } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import prisma from "@/lib/prisma";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  parseQuery,
  getClientIp,
} from "@/lib/api-helpers";

const QuerySchema = z.object({
  status: z.string().max(40).optional().default("pending"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

const PatchSchema = z.object({
  payoutId: z.string().min(1).max(120),
  action: z.enum(["review", "approve", "reject", "complete"]),
  note: z.string().max(2000).optional(),
  decisionNote: z.string().max(500).optional(),
});

export async function GET(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const url = new URL(req.url);
    const parsed = parseQuery(Object.fromEntries(url.searchParams), QuerySchema);
    if (!parsed.ok) return parsed.response;
    const { status, page } = parsed.data;

    const limit = 20;
    const skip = (page - 1) * limit;
    const where = status === "all" ? {} : { status };

    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, totalXp: true, caseNumber: true },
          },
          reviewedBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return apiOk({
      payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError("admin/payouts", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return apiError("unauthorized", "Not signed in", 401);

    const parsed = await parseJson(req, PatchSchema);
    if (!parsed.ok) return parsed.response;
    const { payoutId, action, note, decisionNote } = parsed.data;

    const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout) return apiError("not_found", "Payout not found", 404);

    const validTransitions: Record<string, string[]> = {
      pending: ["review", "reject"],
      reviewed: ["approve", "reject"],
      approved: ["complete"],
    };
    const allowed = validTransitions[payout.status] || [];
    if (!allowed.includes(action)) {
      return apiError(
        "bad_request",
        `Cannot ${action} a payout that is currently ${payout.status}`,
        400,
      );
    }

    const finalDecisionNote = decisionNote ? decisionNote.slice(0, 500) : null;
    let updateData: Record<string, unknown> = {};

    if (action === "review") {
      if (!requireRole(admin.role, ["admin", "caseworker"])) {
        return apiError("forbidden", "Insufficient permissions", 403);
      }
      updateData = {
        status: "reviewed",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "approve") {
      if (!requireRole(admin.role, ["admin", "finance"])) {
        return apiError("forbidden", "Only admin or finance can approve", 403);
      }
      updateData = {
        status: "approved",
        approvedById: admin.id,
        approvedAt: new Date(),
        note: note || payout.note,
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "reject") {
      if (!requireRole(admin.role, ["admin", "finance", "caseworker"])) {
        return apiError("forbidden", "Insufficient permissions", 403);
      }
      updateData = {
        status: "rejected",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNote: note || "Rejected",
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    } else if (action === "complete") {
      if (!requireRole(admin.role, ["admin", "finance"])) {
        return apiError("forbidden", "Only admin or finance can mark complete", 403);
      }
      updateData = {
        status: "completed",
        note: note || "Payment sent",
        ...(finalDecisionNote !== null ? { decisionNote: finalDecisionNote } : {}),
      };
    }

    const updated = await prisma.payoutRequest.update({
      where: { id: payoutId },
      data: updateData,
    });

    await logAudit({
      adminId: admin.id,
      action: `PAYOUT_${action.toUpperCase()}`,
      entity: "PayoutRequest",
      entityId: payoutId,
      details: JSON.stringify({
        previousStatus: payout.status,
        newStatus: updated.status,
        note,
        decisionNote: finalDecisionNote,
      }),
      ipAddress: getClientIp(req),
    });

    return apiOk({ payout: updated });
  } catch (error) {
    return apiServerError("admin/payouts/patch", error);
  }
}
