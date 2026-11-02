import { z } from "zod";
import { learnerWrite } from "@/lib/rewards/http";
import { audit, hash, payoutDto, RewardIssue } from "@/lib/rewards/accounting";
import { keySchema } from "@/lib/rewards/requests";
const schema = z
  .object({ payoutId: z.string().min(1).max(120), requestKey: keySchema })
  .strict();
// Learner cancellation is permitted only before review; later decisions need staff review.
export async function POST(req: Request) {
  return learnerWrite(req, schema, async (tx, id, data) => {
    const p = await tx.payoutRequest.findFirst({
      where: { id: data.payoutId, userId: id },
    });
    if (!p) throw new RewardIssue("not_found", "Request not found.", 404);
    const key = `cancel:${data.requestKey}`,
      fingerprint = hash(data),
      old = await tx.rewardEntry.findUnique({
        where: { userId_sourceKey: { userId: id, sourceKey: key } },
      });
    if (old) {
      if (JSON.parse(old.metadata).payloadHash !== fingerprint)
        throw new RewardIssue(
          "conflict",
          "Cancellation key used with different details.",
        );
      return { payout: payoutDto(p) };
    }
    if (p.status !== "pending")
      throw new RewardIssue(
        "invalid_transition",
        "Only a request awaiting review can be cancelled here. Contact staff for reviewed or approved requests.",
      );
    if (p.amountCents === null || !p.rulesSnapshot)
      throw new RewardIssue(
        "reconciliation_required",
        "Staff must reconcile this historical reservation first.",
      );
    const a = await tx.rewardAccount.findUnique({ where: { userId: id } });
    if (!a || a.reservedXp < p.xpAmount)
      throw new RewardIssue(
        "reconciliation_required",
        "Your reservation needs reconciliation.",
      );
    await tx.rewardAccount.update({
      where: { userId: id },
      data: {
        availableXp: { increment: p.xpAmount },
        reservedXp: { decrement: p.xpAmount },
      },
    });
    const updated = await tx.payoutRequest.update({
      where: { id: p.id },
      data: { status: "cancelled" },
    });
    await tx.rewardEntry.create({
      data: {
        userId: id,
        payoutId: p.id,
        sourceKey: key,
        kind: "cancel",
        availableDelta: p.xpAmount,
        reservedDelta: -p.xpAmount,
        amountCents: p.amountCents,
        fromStatus: p.status,
        toStatus: "cancelled",
        metadata: JSON.stringify({ payloadHash: fingerprint }),
      },
    });
    await audit(tx, "PAYOUT_CANCELLED", p.id, null, { xp: p.xpAmount });
    return { payout: payoutDto(updated) };
  });
}
