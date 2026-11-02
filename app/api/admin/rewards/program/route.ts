import { z } from "zod";
import { staffWrite } from "@/lib/rewards/http";
import {
  audit,
  financialLock,
  hash,
  RewardIssue,
  userLock,
} from "@/lib/rewards/accounting";
import { keySchema } from "@/lib/rewards/requests";
const schema = z
  .object({
    userId: z.string().min(1).max(120),
    programSlug: z
      .string()
      .regex(/^[a-z0-9-]{1,60}$/)
      .nullable(),
    requestKey: keySchema,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();
export async function POST(req: Request) {
  return staffWrite(req, schema, ["admin", "finance"], async (tx, a, d) => {
    await financialLock(tx);
    await userLock(tx, d.userId);
    const account = await tx.rewardAccount.findUnique({
      where: { userId: d.userId },
    });
    if (!account)
      throw new RewardIssue(
        "reconciliation_required",
        "Reconcile this account before assigning a financial program.",
      );
    const key = `program:${d.requestKey}`,
      fingerprint = hash(d);
    const prior = await tx.rewardEntry.findUnique({
      where: { userId_sourceKey: { userId: d.userId, sourceKey: key } },
    });
    if (prior) {
      if (prior.metadata !== JSON.stringify({ payloadHash: fingerprint }))
        throw new RewardIssue("conflict", "Assignment key already used.");
      return { programSlug: account.programSlug };
    }
    if (
      d.programSlug &&
      !(await tx.payoutConfig.findUnique({
        where: { programSlug: d.programSlug },
      }))
    )
      throw new RewardIssue("not_found", "Configured program not found.", 404);
    await tx.rewardAccount.update({
      where: { userId: d.userId },
      data: { programSlug: d.programSlug },
    });
    await tx.rewardEntry.create({
      data: {
        userId: d.userId,
        adminId: a.id,
        sourceKey: key,
        kind: "program-assignment",
        metadata: JSON.stringify({ payloadHash: fingerprint }),
      },
    });
    await audit(tx, "REWARD_PROGRAM_ASSIGNED", d.userId, a.id, {
      from: account.programSlug,
      to: d.programSlug,
      reason: d.reason,
    });
    return { programSlug: d.programSlug };
  });
}
