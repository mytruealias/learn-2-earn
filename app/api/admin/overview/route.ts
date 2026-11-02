import { getAdminFromRequest } from "@/lib/admin-auth";
import { scopedDb } from "@/lib/program-scope";
import { apiError, apiOk, apiServerError } from "@/lib/api-helpers";
export async function GET(req: Request) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    const db = scopedDb(a),
      support = a.role !== "finance",
      now = new Date(),
      week = new Date(now.getTime() - 7 * 86400000);
    const data = await db.$transaction(
      async (tx) => {
        const [
          pending,
          reviewed,
          approved,
          unassigned,
          followUps,
          participants,
          firstCompletions,
          activity,
        ] = await Promise.all([
          tx.payoutRequest.count({ where: { status: "pending" } }),
          tx.payoutRequest.count({ where: { status: "reviewed" } }),
          tx.payoutRequest.count({ where: { status: "approved" } }),
          support
            ? tx.case.count({
                where: {
                  assignedToId: null,
                  status: { notIn: ["resolved", "closed"] },
                },
              })
            : Promise.resolve(null),
          support
            ? tx.case.count({
                where: {
                  followUpAt: { lte: now },
                  status: { notIn: ["resolved", "closed"] },
                },
              })
            : Promise.resolve(null),
          tx.user.count(),
          tx.progress.count({ where: { completedAt: { gte: week } } }),
          tx.auditLog.findMany({
            where: {
              action: {
                in: support
                  ? [
                      "CASE_NOTE",
                      "CASE_META",
                      "CASE_DISPATCH",
                      "CASE_ALLOCATE",
                      "PAYOUT_REQUESTED",
                      "PAYOUT_REVIEW",
                      "PAYOUT_APPROVE",
                      "PAYOUT_COMPLETE",
                      "USER_UPDATED_WITH_REWARD_CORRECTION",
                    ]
                  : [
                      "PAYOUT_REQUESTED",
                      "PAYOUT_REVIEW",
                      "PAYOUT_APPROVE",
                      "PAYOUT_COMPLETE",
                      "POOL_ADJUSTED",
                      "PAYOUT_CONFIG_VERSIONED",
                    ],
              },
            },
            orderBy: [{ createdAt: "desc" }, { id: "asc" }],
            take: 8,
            select: {
              id: true,
              action: true,
              entity: true,
              entityId: true,
              createdAt: true,
            },
          }),
        ]);
        return {
          queues: { pending, reviewed, approved, unassigned, followUps },
          participants,
          firstCompletions,
          activity,
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
    const unacknowledged = support
      ? await db.case.count({
          where: {
            intakeKey: { not: null },
            acknowledgedAt: null,
            status: { notIn: ["closed", "resolved"] },
          },
        })
      : null;
    return apiOk({
      ...data,
      unacknowledged,
      program: {
        id: a.programId,
        name: a.programName,
        organization: a.organizationName,
      },
      asOf: now.toISOString(),
    });
  } catch (e) {
    return apiServerError("staff/overview", e);
  }
}
