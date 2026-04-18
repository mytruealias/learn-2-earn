import type { CSSProperties, ReactNode } from "react";
import type { CitySlug } from "@/lib/city-access";

export type { CitySlug };

export interface CityDeckTheme {
  primary: string;
  secondary: string;
  themeStyle: CSSProperties;
}

export interface CityStat {
  value: string;
  label: string;
  cite?: number;
}

export interface CityDeckConfig {
  slug: CitySlug;
  cityName: string;
  partnerLine: string;
  heroSub: string;
  problemIntro: string;
  customPathsCopy: string;
  customExamples: string[];
  ctaTitle: ReactNode;
  ctaSub: string;
  emailSubjectPilotPlan: string;
  emailSubjectDemo: string;
  unlockBadge: string;
  unlockSub: string;
  stats: {
    homeless: CityStat;
    employed: CityStat;
  };
  sources: ReactNode[];
  theme: CityDeckTheme;
  metadata: {
    title: string;
    description: string;
    openGraphTitle?: string;
    openGraphDescription?: string;
    path: string;
  };
}
