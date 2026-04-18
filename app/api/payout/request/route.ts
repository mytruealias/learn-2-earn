import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getUserIdFromRequest } from "@/lib/user-session";
import { getPayoutRules } from "@/lib/payout-rules";
import {
  apiError,
  apiOk,
  apiServerError,
  parseJson,
  getClientIp,
  createRateLimiter,
  rateLimitResponse,
} from "@/lib/api-helpers";

const VALID_PAYMENT_METHODS = ["venmo", "paypal", "cashapp", "check"] as const;
const MAX_HANDLE_LENGTH = 255;

// 5 payout requests per IP per 10 minutes — enough for legitimate retries,
// throttles attempts to spam the approval queue.
const limiter = createRateLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

const Schema = z.object({
  userId: z.string().min(1).max(120).optional(),
  xpAmount: z.number().int().min(1).max(1_000_000),
  paymentMethod: z.enum(VALID_PAYMENT_METHODS),
  paymentHandle: z.string().min(1, "Please provide your payment handle or address.").max(MAX_HANDLE_LENGTH),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = limiter.check(`payout:${ip}`);
    if (!gate.allowed) {
      return rateLimitResponse(
        gate.retryAfterSec,
        "You've sent several payout requests very quickly. Please wait a moment.",
      );
    }

    const sessionUserId = getUserIdFromRequest(req);

    const parsed = await parseJson(req, Schema);
    if (!parsed.ok) return parsed.response;
    const { xpAmount, paymentMethod, paymentHandle } = parsed.data;

    const userId = sessionUserId ?? parsed.data.userId;
    if (!userId) return apiError("unauthorized", "Not signed in.", 401);
    if (sessionUserId && parsed.data.userId && sessionUserId !== parsed.data.userId) {
      return apiError("forbidden", "Not authorized.", 403);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return apiError("not_found", "User not found.", 404);

    const { minXp, xpToDollar, weeklyXpCap } = await getPayoutRules(user.city);

    if (xpAmount < minXp) {
      return apiError("bad_request", `You need at least ${minXp} XP to request a payout`, 400);
    }

    const handle = paymentHandle.trim();
    if (!handle) {
      return apiError("bad_request", "Please provide your payment handle or address.", 400);
    }

    if (!user.email || !user.fullName) {
      return apiError("bad_request", "Please complete your profile before requesting a payout.", 400);
    }

    const { _sum } = await prisma.payoutRequest.aggregate({
      where: { userId, status: { not: "rejected" } },
      _sum: { xpAmount: true },
    });
    const totalPayoutXp = _sum.xpAmount ?? 0;
    const availableXp = user.totalXp - totalPayoutXp;

    if (availableXp < minXp) {
      const needed = minXp - availableXp;
      return apiError("bad_request", `You need ${needed} more XP to request a payout.`, 400);
    }
    if (xpAmount > availableXp) {
      return apiError("bad_request", "Insufficient XP balance.", 400);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { _sum: weeklySum } = await prisma.payoutRequest.aggregate({
      where: { userId, status: { not: "rejected" }, createdAt: { gte: sevenDaysAgo } },
      _sum: { xpAmount: true },
    });
    const weeklyXpRequested = weeklySum.xpAmount ?? 0;
    if (weeklyXpRequested + xpAmount > weeklyXpCap) {
      const remaining = Math.max(0, weeklyXpCap - weeklyXpRequested);
      return apiError(
        "bad_request",
        `Weekly payout limit reached. You can request up to ${remaining} more XP this week.`,
        400,
      );
    }

    limiter.record(`payout:${ip}`);

    const dollarAmount = Math.round(xpAmount * xpToDollar * 100) / 100;
    const methodLabels: Record<string, string> = {
      venmo: "Venmo",
      paypal: "PayPal",
      cashapp: "Cash App",
      check: "Check",
    };
    const methodLabel = methodLabels[paymentMethod] ?? paymentMethod;
    const note =
      paymentMethod === "check"
        ? `Pay via Check to: ${handle}`
        : `Pay via ${methodLabel}: ${handle}`;

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        xpAmount,
        dollarAmount,
        status: "pending",
        note,
        paymentMethod: paymentMethod as PaymentMethod,
        paymentHandle: handle,
      },
    });

    await logAudit({
      action: "PAYOUT_REQUESTED",
      entity: "PayoutRequest",
      entityId: payout.id,
      details: JSON.stringify({ userId, xpAmount, dollarAmount, paymentMethod, xpToDollar, weeklyXpCap, minXp }),
      ipAddress: ip,
    });

    return apiOk({ payout });
  } catch (error) {
    return apiServerError("payout/request", error);
  }
}
