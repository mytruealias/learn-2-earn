import { z } from "zod";
import { staffWrite } from "../rewards/http";
import { hash, RewardIssue } from "../rewards/accounting";
export const caseStatuses = [
  "new",
  "open",
  "dispatched",
  "resolved",
  "closed",
] as const;
const base = {
  requestKey: z.string().uuid(),
  expectedVersion: z.number().int().nonnegative(),
};
export const caseMetaSchema = z
  .object({
    ...base,
    status: z.enum(caseStatuses).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    assignedToId: z.string().min(1).max(120).nullable().optional(),
    followUpAt: z.string().datetime().nullable().optional(),
  })
  .strict();
export const caseNoteSchema = z
  .object({
    ...base,
    text: z.string().trim().min(1).max(5000),
    type: z.literal("note").default("note"),
  })
  .strict();
export const caseDispatchSchema = z
  .object({
    ...base,
    staffId: z.string().min(1).max(120),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export const caseAllocationSchema = z
  .object({
    ...base,
    resourceType: z.enum([
      "shelter",
      "food",
      "bus_pass",
      "hygiene",
      "clothing",
      "mental_health",
    ]),
    quantity: z.number().int().min(1).max(1000),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export function caseMutation(
  req: Request,
  id: string,
  action: "meta" | "note" | "dispatch" | "allocate" | "acknowledge",
) {
  const schema =
    action === "acknowledge"
      ? z.object(base).strict()
      : action === "meta"
        ? caseMetaSchema
        : action === "note"
          ? caseNoteSchema
          : action === "dispatch"
            ? caseDispatchSchema
            : caseAllocationSchema;
  return staffWrite(req, schema, ["admin", "caseworker"], async (tx, a, d) => {
    const fingerprint = hash({ id, action, ...d }),
      prior = await tx.staffActionReceipt.findUnique({
        where: {
          programId_requestKey: {
            programId: a.programId,
            requestKey: d.requestKey,
          },
        },
      });
    if (prior) {
      if (prior.payloadHash !== fingerprint || prior.adminId !== a.id)
        throw new RewardIssue(
          "conflict",
          "This action key was used with different details.",
        );
      return { replayed: true, version: prior.version };
    }
    const original = await tx.case.findUnique({ where: { id } });
    if (!original)
      throw new RewardIssue(
        "not_found",
        "Case not found in this program.",
        404,
      );
    await tx.$queryRaw`SELECT "id" FROM "Case" WHERE "id"=${id} FOR UPDATE`;
    const c = await tx.case.findUniqueOrThrow({ where: { id } });
    if (c.version !== d.expectedVersion)
      throw new RewardIssue(
        "conflict",
        "Another staff member changed this case. Reload the case, review their change, then confirm your action again.",
      );
    const staffId =
      "staffId" in d ? d.staffId : "assignedToId" in d ? d.assignedToId : null;
    if (
      staffId &&
      !(await tx.staffMembership.findFirst({
        where: {
          adminId: staffId,
          isActive: true,
          revokedAt: null,
          role: { in: ["program_admin", "caseworker"] },
          admin: { isActive: true },
        },
      }))
    )
      throw new RewardIssue(
        "not_found",
        "Choose an active caseworker or program administrator in this program.",
        404,
      );
    let data: Record<string, unknown> = { version: { increment: 1 } },
      note = "",
      type = "status_change";
    if (action === "acknowledge") {
      if (!c.intakeKey)
        throw new RewardIssue(
          "invalid_transition",
          "Only an explicit participant support request can be acknowledged here.",
          400,
        );
      if (c.acknowledgedAt)
        throw new RewardIssue(
          "conflict",
          "Staff acknowledgment is already recorded. Reload its status.",
        );
      data = { ...data, acknowledgedAt: new Date(), acknowledgedById: a.id };
      note =
        "Staff recorded reading this support request. No external notification, follow-up or emergency dispatch is implied.";
      type = "acknowledgment";
    } else if (action === "meta") {
      const meta = caseMetaSchema.parse(d);
      const next = meta.status ?? c.status;
      const transitions: Record<string, string[]> = {
        new: ["new", "open", "dispatched", "resolved", "closed"],
        open: ["open", "dispatched", "resolved", "closed"],
        dispatched: ["dispatched", "open", "resolved", "closed"],
        resolved: ["resolved", "open", "closed"],
        closed: ["closed", "open"],
      };
      if (!transitions[c.status]?.includes(next))
        throw new RewardIssue(
          "invalid_transition",
          "That case status change is unavailable.",
          400,
        );
      if (next === "dispatched" && !staffId && !c.assignedToId)
        throw new RewardIssue(
          "validation_error",
          "Assign a staff member before marking dispatched.",
          400,
        );
      data = {
        ...data,
        ...(meta.status ? { status: meta.status } : {}),
        ...(meta.priority ? { priority: meta.priority } : {}),
        ...(meta.assignedToId !== undefined
          ? { assignedToId: meta.assignedToId }
          : {}),
        ...(meta.followUpAt !== undefined
          ? { followUpAt: meta.followUpAt ? new Date(meta.followUpAt) : null }
          : {}),
        ...(["resolved", "closed"].includes(next) ? { followUpAt: null } : {}),
        ...(next === "resolved" && c.status !== "resolved"
          ? { resolvedAt: new Date() }
          : next === "open"
            ? { resolvedAt: null }
            : {}),
      };
      note = `Case updated: ${c.status} → ${next}; priority ${"priority" in meta ? meta.priority || c.priority : c.priority}. Assignment and follow-up changes are recorded in the audit trail.`;
    } else if (action === "note" && "text" in d) {
      note = caseNoteSchema.parse(d).text;
      type = "note";
    } else if (action === "dispatch") {
      const dispatch = caseDispatchSchema.parse(d);
      if (["closed", "resolved"].includes(c.status))
        throw new RewardIssue(
          "conflict",
          "Reopen this case before dispatching staff.",
        );
      data = { ...data, status: "dispatched", assignedToId: dispatch.staffId };
      note = `Staff dispatch recorded. This does not contact emergency services.${dispatch.notes ? ` ${dispatch.notes}` : ""}`;
      type = "dispatch";
    } else if (action === "allocate") {
      const allocation = caseAllocationSchema.parse(d);
      if (["closed", "resolved"].includes(c.status))
        throw new RewardIssue(
          "conflict",
          "Reopen this case before allocating resources.",
        );
      await tx.resourceAllocation.create({
        data: {
          caseId: id,
          adminId: a.id,
          resourceType: allocation.resourceType,
          quantity: allocation.quantity,
          notes: allocation.notes,
        },
      });
      note = `Service allocation recorded: ${allocation.resourceType}, quantity ${allocation.quantity}. This is service activity, not a confirmed participant outcome.${allocation.notes ? ` ${allocation.notes}` : ""}`;
      type = "resource";
    }
    if (!note)
      throw new RewardIssue(
        "validation_error",
        "No valid case change was provided.",
        400,
      );
    const updated = await tx.case.update({
      where: { id, version: d.expectedVersion },
      data,
    });
    await tx.caseNote.create({
      data: { caseId: id, adminId: a.id, text: note, type },
    });
    await tx.staffActionReceipt.create({
      data: {
        programId: a.programId,
        adminId: a.id,
        requestKey: d.requestKey,
        payloadHash: fingerprint,
        entity: "Case",
        entityId: id,
        action,
        version: updated.version,
      },
    });
    await tx.auditLog.create({
      data: {
        adminId: a.id,
        action: `CASE_${action.toUpperCase()}`,
        entity: "Case",
        entityId: id,
        details: JSON.stringify({
          previousVersion: c.version,
          version: updated.version,
          fromStatus: c.status,
          toStatus: updated.status,
          fromAssignee: c.assignedToId,
          toAssignee: updated.assignedToId,
          followUpAt: updated.followUpAt,
        }),
      },
    });
    return { case: updated, replayed: false };
  });
}
