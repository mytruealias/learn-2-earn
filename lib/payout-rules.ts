import prisma from "@/lib/prisma";

export const DEFAULT_MIN_XP = 20;
export const DEFAULT_XP_TO_DOLLAR = 0.05;
export const DEFAULT_WEEKLY_XP_CAP = 500;

export interface PayoutRules {
  minXp: number;
  xpToDollar: number;
  weeklyXpCap: number;
  programSlug: string | null;
  programName: string | null;
  source: "program" | "default" | "fallback";
}

export function citySlug(city: string | null | undefined): string | null {
  if (!city) return null;
  const slug = city.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return slug || null;
}

export async function getPayoutRules(userCity: string | null | undefined): Promise<PayoutRules> {
  const slug = citySlug(userCity);
  if (slug) {
    const config = await prisma.payoutConfig.findFirst({
      where: { programSlug: slug, isActive: true },
    });
    if (config) {
      return {
        minXp: config.minimumXp,
        xpToDollar: config.xpToDollar,
        weeklyXpCap: config.weeklyXpCap,
        programSlug: config.programSlug,
        programName: config.programName,
        source: "program",
      };
    }
  }

  const defaultConfig = await prisma.payoutConfig.findFirst({
    where: { programSlug: "default", isActive: true },
  });
  if (defaultConfig) {
    return {
      minXp: defaultConfig.minimumXp,
      xpToDollar: defaultConfig.xpToDollar,
      weeklyXpCap: defaultConfig.weeklyXpCap,
      programSlug: defaultConfig.programSlug,
      programName: defaultConfig.programName,
      source: "default",
    };
  }

  return {
    minXp: DEFAULT_MIN_XP,
    xpToDollar: DEFAULT_XP_TO_DOLLAR,
    weeklyXpCap: DEFAULT_WEEKLY_XP_CAP,
    programSlug: null,
    programName: null,
    source: "fallback",
  };
}
