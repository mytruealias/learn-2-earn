import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { getAdminFromRequest } from "../admin-auth";
import { scopedDb, legacyRole } from "../program-scope";
import { apiError, apiOk, apiServerError, parseQuery } from "../api-helpers";
import { payoutDto } from "../rewards/accounting";
import { csvText } from "./csv";
export type Collection =
  | "users"
  | "cases"
  | "payouts"
  | "directory"
  | "staff"
  | "audit";
const schema = z.object({
  search: z.string().max(200).default(""),
  status: z.string().max(60).default("all"),
  priority: z.enum(["all", "high", "medium", "low"]).default("all"),
  category: z.string().max(60).default("all"),
  entity: z.string().max(120).default(""),
  action: z.string().max(120).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  sort: z
    .enum(["createdAt", "name", "status", "updatedAt"])
    .default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  format: z.enum(["json", "csv"]).default("json"),
});
export async function staffList(req: Request, kind: Collection) {
  try {
    const a = await getAdminFromRequest(req);
    if (!a) return apiError("unauthorized", "Sign in as staff.", 401);
    if (["staff", "audit"].includes(kind) && a.role !== "admin")
      return apiError("forbidden", "Program administrator required.", 403);
    const parsed = parseQuery(
      Object.fromEntries(new URL(req.url).searchParams),
      schema,
    );
    if (!parsed.ok) return parsed.response;
    const q = parsed.data,
      db = scopedDb(a),
      exporting = q.format === "csv",
      take = exporting ? 5000 : 20,
      skip = exporting ? 0 : (q.page - 1) * 20;
    const result = await db.$transaction(
      async (tx) => {
        let total: number, rows: Record<string, unknown>[], csv: unknown[][];
        const term = q.search
          ? { contains: q.search, mode: "insensitive" as const }
          : undefined;
        switch (kind) {
          case "users": {
            const where: Prisma.UserWhereInput = {
              ...(term
                ? {
                    OR: [
                      { fullName: term },
                      { email: term },
                      { caseNumber: term },
                    ],
                  }
                : {}),
              ...(q.status === "active"
                ? { isActive: true }
                : q.status === "inactive"
                  ? { isActive: false }
                  : {}),
            };
            total = await tx.user.count({ where });
            if (exporting && total > 5000) return null;
            const orderBy: Prisma.UserOrderByWithRelationInput =
              q.sort === "name"
                ? { fullName: q.direction }
                : { createdAt: q.direction };
            rows = await tx.user.findMany({
              where,
              orderBy: [orderBy, { id: "asc" }],
              take,
              skip,
              select: {
                id: true,
                fullName: true,
                email: true,
                caseNumber: a.role !== "finance",
                totalXp: true,
                isActive: true,
                staffVersion: true,
                consentGiven: a.role !== "finance",
                createdAt: true,
                lastActiveAt: true,
                _count: { select: { progress: true, payoutRequests: true } },
              },
            });
            csv = [
              [
                "Participant ID",
                "Name",
                "Account active",
                "Lifetime XP record",
                "First completions",
              ],
              ...rows.map((r) => [
                r.id,
                r.fullName,
                r.isActive,
                r.totalXp,
                (r._count as { progress: number }).progress,
              ]),
            ];
            break;
          }
          case "cases": {
            const where: Prisma.CaseWhereInput = {
              ...(term
                ? { OR: [{ title: term }, { user: { fullName: term } }] }
                : {}),
              ...(q.status === "unacknowledged"
                ? {
                    intakeKey: { not: null },
                    acknowledgedAt: null,
                    status: { notIn: ["closed", "resolved"] },
                  }
                : q.status === "unassigned"
                  ? {
                      assignedToId: null,
                      status: { notIn: ["resolved", "closed"] },
                    }
                  : q.status === "follow-up"
                    ? {
                        followUpAt: { lte: new Date() },
                        status: { notIn: ["resolved", "closed"] },
                      }
                    : q.status !== "all"
                      ? { status: q.status }
                      : {}),
              ...(q.priority !== "all" ? { priority: q.priority } : {}),
            };
            total = await tx.case.count({ where });
            if (exporting && total > 5000) return null;
            const orderBy: Prisma.CaseOrderByWithRelationInput =
              q.sort === "name"
                ? { title: q.direction }
                : q.sort === "status"
                  ? { status: q.direction }
                  : q.sort === "updatedAt"
                    ? { updatedAt: q.direction }
                    : { createdAt: q.direction };
            rows = await tx.case.findMany({
              where,
              orderBy: [orderBy, { id: "asc" }],
              take,
              skip,
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                version: true,
                createdAt: true,
                updatedAt: true,
                followUpAt: true,
                user: { select: { id: true, fullName: true } },
                assignedTo: { select: { id: true, fullName: true } },
                _count: { select: { notes: true, allocations: true } },
              },
            });
            csv = [
              [
                "Case ID",
                "Title",
                "Status",
                "Priority",
                "Assigned staff ID",
                "Follow-up UTC",
              ],
              ...rows.map((r) => [
                r.id,
                r.title,
                r.status,
                r.priority,
                (r.assignedTo as { id: string } | null)?.id,
                r.followUpAt instanceof Date ? r.followUpAt.toISOString() : "",
              ]),
            ];
            break;
          }
          case "payouts": {
            const where: Prisma.PayoutRequestWhereInput = {
              ...(q.status !== "all" ? { status: q.status } : {}),
              ...(term
                ? { OR: [{ id: term }, { user: { fullName: term } }] }
                : {}),
            };
            total = await tx.payoutRequest.count({ where });
            if (exporting && total > 5000) return null;
            const orderBy: Prisma.PayoutRequestOrderByWithRelationInput =
              q.sort === "status"
                ? { status: q.direction }
                : q.sort === "updatedAt"
                  ? { updatedAt: q.direction }
                  : { createdAt: q.direction };
            const requests = await tx.payoutRequest.findMany({
              where,
              orderBy: [orderBy, { id: "asc" }],
              take,
              skip,
              include: {
                user: { select: { fullName: true } },
                rewardEntries: {
                  orderBy: { createdAt: "asc" },
                  select: { kind: true, toStatus: true, createdAt: true },
                },
              },
            });
            rows = requests.map((p) => ({
              ...payoutDto(p, p.rewardEntries),
              user: p.user,
            }));
            csv = [
              ["Request ID", "Exact cents", "Status", "Method", "Paid UTC"],
              ...requests.map((p) => [
                p.id,
                p.amountCents,
                p.status,
                p.paymentMethod,
                p.paidAt?.toISOString(),
              ]),
            ];
            break;
          }
          case "directory": {
            const where: Prisma.ServiceDirectoryWhereInput = {
              isActive: true,
              ...(q.category !== "all" && q.category
                ? { category: q.category }
                : {}),
              ...(term
                ? { OR: [{ name: term }, { address: term }, { notes: term }] }
                : {}),
            };
            total = await tx.serviceDirectory.count({ where });
            if (exporting && total > 5000) return null;
            const orderBy: Prisma.ServiceDirectoryOrderByWithRelationInput =
              q.sort === "name"
                ? { name: q.direction }
                : q.sort === "updatedAt"
                  ? { updatedAt: q.direction }
                  : { createdAt: q.direction };
            rows = await tx.serviceDirectory.findMany({
              where,
              orderBy: [orderBy, { id: "asc" }],
              take,
              skip,
            });
            csv = [
              ["Service ID", "Name", "Category", "Phone", "Website"],
              ...rows.map((r) => [
                r.id,
                r.name,
                r.category,
                r.phone,
                r.website,
              ]),
            ];
            break;
          }
          case "staff": {
            const where: Prisma.StaffMembershipWhereInput = {
              ...(q.status === "active"
                ? { isActive: true, revokedAt: null }
                : q.status === "inactive"
                  ? { OR: [{ isActive: false }, { revokedAt: { not: null } }] }
                  : {}),
              ...(term
                ? { admin: { OR: [{ email: term }, { fullName: term }] } }
                : {}),
            };
            total = await tx.staffMembership.count({ where });
            if (exporting && total > 5000) return null;
            const members = await tx.staffMembership.findMany({
              where,
              orderBy:
                q.sort === "name"
                  ? [{ admin: { fullName: q.direction } }, { id: "asc" }]
                  : [{ createdAt: q.direction }, { id: "asc" }],
              take,
              skip,
              include: {
                admin: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    isActive: true,
                    createdAt: true,
                    lastLoginAt: true,
                  },
                },
              },
            });
            rows = members.map((m) => ({
              ...m.admin,
              role: legacyRole(m.role),
              version: m.version,
              isActive: m.isActive && !m.revokedAt && m.admin.isActive,
            }));
            csv = [
              ["Staff ID", "Name", "Program role", "Membership active"],
              ...rows.map((r) => [r.id, r.fullName, r.role, r.isActive]),
            ];
            break;
          }
          case "audit": {
            const where: Prisma.AuditLogWhereInput = {
              ...(q.entity ? { entity: q.entity } : {}),
              ...(q.action ? { action: { contains: q.action } } : {}),
              ...(term ? { OR: [{ action: term }, { entityId: term }] } : {}),
            };
            total = await tx.auditLog.count({ where });
            if (exporting && total > 5000) return null;
            rows = await tx.auditLog.findMany({
              where,
              orderBy: [{ createdAt: q.direction }, { id: "asc" }],
              take,
              skip,
              select: {
                id: true,
                action: true,
                entity: true,
                entityId: true,
                createdAt: true,
                admin: { select: { fullName: true } },
              },
            });
            csv = [
              ["Audit ID", "UTC", "Action", "Entity", "Entity ID"],
              ...rows.map((r) => [
                r.id,
                (r.createdAt as Date).toISOString(),
                r.action,
                r.entity,
                r.entityId,
              ]),
            ];
            break;
          }
        }
        return { total, rows, csv };
      },
      { isolationLevel: "RepeatableRead", timeout: 20000 },
    );
    if (!result)
      return apiError(
        "export_limit",
        "More than 5,000 records match. Narrow your filters before exporting.",
        422,
      );
    if (exporting) {
      await db.auditLog.create({
        data: {
          adminId: a.id,
          action: "PROGRAM_SCOPED_EXPORT",
          entity: kind,
          details: JSON.stringify({ count: result.total, filters: q }),
        },
      });
      return new Response(csvText(result.csv), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${kind}-program-records.csv"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const alias =
      kind === "directory" ? "entries" : kind === "audit" ? "logs" : kind;
    return apiOk(
      {
        [alias]: result.rows,
        rows: result.rows,
        pagination: {
          page: q.page,
          limit: 20,
          total: result.total,
          totalPages: Math.ceil(result.total / 20),
        },
        scope: { programId: a.programId, programName: a.programName },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiServerError(`staff/${kind}`, e);
  }
}
