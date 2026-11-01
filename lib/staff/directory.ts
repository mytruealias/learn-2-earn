import { z } from "zod";
import { staffWrite } from "../rewards/http";
import { hash, RewardIssue } from "../rewards/accounting";
const optional = z.string().trim().max(2000).nullable();
const fields = {
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(60),
  address: optional,
  phone: z.string().trim().max(60).nullable(),
  hours: z.string().trim().max(200).nullable(),
  notes: optional,
  website: z
    .string()
    .url()
    .max(500)
    .refine((s) => /^https?:\/\//i.test(s), "Use an http or https website.")
    .nullable(),
};
export function directoryMutation(req: Request, id?: string, remove = false) {
  const identity = {
    requestKey: z.string().uuid(),
    ...(id ? { expectedVersion: z.number().int().nonnegative() } : {}),
  };
  const schema = remove
    ? z.object(identity).strict()
    : z.object({ ...identity, ...fields }).strict();
  return staffWrite(req, schema, ["admin", "caseworker"], async (tx, a, d) => {
    const fingerprint = hash({ id, remove, ...d }),
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
          "Action key was used with different details.",
        );
      return { replayed: true };
    }
    const old = id
      ? await tx.serviceDirectory.findUnique({ where: { id } })
      : null;
    if (id && (!old || !old.isActive))
      throw new RewardIssue("not_found", "Active service not found.", 404);
    if (old && old.version !== d.expectedVersion)
      throw new RewardIssue(
        "conflict",
        "Another staff member updated this service. Reload and review before saving.",
      );
    const parsed = remove ? null : z.object(fields).parse(d);
    const entry = old
      ? await tx.serviceDirectory.update({
          where: { id: old.id, version: d.expectedVersion as number },
          data: remove
            ? { isActive: false, version: { increment: 1 } }
            : { ...parsed!, version: { increment: 1 } },
        })
      : await tx.serviceDirectory.create({ data: parsed! });
    await tx.staffActionReceipt.create({
      data: {
        programId: a.programId,
        adminId: a.id,
        requestKey: d.requestKey,
        payloadHash: fingerprint,
        entity: "ServiceDirectory",
        entityId: entry.id,
        action: remove ? "remove" : old ? "update" : "create",
        version: entry.version,
      },
    });
    await tx.auditLog.create({
      data: {
        adminId: a.id,
        action: remove
          ? "DIRECTORY_REMOVED"
          : old
            ? "DIRECTORY_UPDATED"
            : "DIRECTORY_CREATED",
        entity: "ServiceDirectory",
        entityId: entry.id,
        details: JSON.stringify({ version: entry.version }),
      },
    });
    return { entry, replayed: false };
  });
}
