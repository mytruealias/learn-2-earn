import { z } from "zod";
import { staffWrite } from "@/lib/rewards/http";
import { audit, RewardIssue } from "@/lib/rewards/accounting";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ payoutId: string }> },
) {
  const { payoutId } = await params;
  return staffWrite(
    req,
    z.object({}).strict(),
    ["admin", "finance"],
    async (tx, admin) => {
      const p = await tx.payoutRequest.findUnique({ where: { id: payoutId } });
      if (!p || p.status !== "approved")
        throw new RewardIssue(
          "not_found",
          "Payment details are available only for an approved request.",
          404,
        );
      await audit(tx, "PAYOUT_PAYMENT_DETAILS_VIEWED", p.id, admin.id, {});
      return {
        paymentHandle: p.paymentHandle,
        paymentMethod: p.paymentMethod,
        amountCents: p.amountCents,
      };
    },
  );
}
