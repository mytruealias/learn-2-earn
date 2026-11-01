import { z } from "zod";
import { staffList } from "@/lib/staff/lists";
import { staffWrite } from "@/lib/rewards/http";
import { hash, RewardIssue } from "@/lib/rewards/accounting";
export const GET = (req: Request) => staffList(req, "cases");
const schema = z
  .object({
    userId: z.string().min(1).max(120),
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    requestKey: z.string().uuid(),
  })
  .strict();
export async function POST(req: Request) {
  return staffWrite(req, schema, ["admin", "caseworker"], async (tx, a, d) => {
    const fingerprint = hash(d),
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
        throw new RewardIssue("conflict", "This action key was already used.");
      return { case: { id: prior.entityId }, replayed: true };
    }
    const c = await tx.case.create({
      data: {
        userId: d.userId,
        title: d.title,
        message: d.message,
        priority: d.priority,
        status: "new",
      },
    });
    await tx.staffActionReceipt.create({
      data: {
        adminId: a.id,
        programId: a.programId,
        requestKey: d.requestKey,
        payloadHash: fingerprint,
        entity: "Case",
        entityId: c.id,
        action: "create",
        version: 0,
      },
    });
    await tx.auditLog.create({
      data: {
        adminId: a.id,
        action: "CASE_CREATE",
        entity: "Case",
        entityId: c.id,
      },
    });
    return { case: c, replayed: false };
  });
}
