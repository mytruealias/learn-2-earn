import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  fraction,
  legacyMethods,
  type RewardMethod,
  methodDefinitions,
} from "./rewards/money";
export const DEFAULT_MIN_XP = 20;
export const DEFAULT_XP_TO_DOLLAR = 0.05;
export const DEFAULT_WEEKLY_XP_CAP = 500;
export interface PayoutRules {
  minXp: number;
  xpToDollar: number;
  rate: string;
  weeklyXpCap: number;
  methods: RewardMethod[];
  separateApprover: boolean;
  programSlug: string | null;
  programName: string | null;
  source: "program" | "default" | "fallback";
  version: string;
  window: "rolling-7-days";
  currency: "USD";
}
export function citySlug(city: string | null | undefined) {
  if (!city) return null;
  return (
    city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") || null
  );
}
export async function getPayoutRules(
  userCity: string | null | undefined,
  db: Prisma.TransactionClient = prisma,
): Promise<PayoutRules> {
  const slug = citySlug(userCity);
  const config =
    (slug
      ? await db.payoutConfig.findFirst({
          where: { programSlug: slug, isActive: true },
        })
      : null) ||
    (await db.payoutConfig.findFirst({
      where: { programSlug: "default", isActive: true },
    }));
  let methods: RewardMethod[] = legacyMethods;
  if (config?.paymentMethods) {
    const parsed: unknown = JSON.parse(config.paymentMethods);
    if (
      !Array.isArray(parsed) ||
      parsed.some((m) => typeof m !== "string" || !(m in methodDefinitions))
    )
      throw new Error("Invalid configured payment methods");
    methods = parsed as RewardMethod[];
  }
  const rate =
    config?.rateExact || String(config?.xpToDollar ?? DEFAULT_XP_TO_DOLLAR);
  if (fraction(rate).n <= 0n) throw new Error("Invalid configured rate");
  const terms = {
    minXp: config?.minimumXp ?? DEFAULT_MIN_XP,
    xpToDollar: Number(rate),
    rate,
    weeklyXpCap: config?.weeklyXpCap ?? DEFAULT_WEEKLY_XP_CAP,
    methods,
    separateApprover: config?.separateApprover ?? false,
    programSlug: config?.programSlug ?? null,
    programName: config?.programName ?? null,
    source: config
      ? config.programSlug === slug
        ? ("program" as const)
        : ("default" as const)
      : ("fallback" as const),
    window: "rolling-7-days" as const,
    currency: "USD" as const,
  };
  if (terms.minXp < 1 || terms.weeklyXpCap < terms.minXp)
    throw new Error("Invalid configured limits");
  return {
    ...terms,
    version: createHash("sha256")
      .update(JSON.stringify({ ...terms, revision: config?.version ?? 1 }))
      .digest("hex"),
  };
}
