import type { CSSProperties } from "react";
import type { CitySlug } from "@/lib/city-access";
export type { CitySlug };
export interface CityDeckTheme {
  primary: string;
  secondary: string;
  themeStyle: CSSProperties;
}
export interface CityDeckConfig {
  slug: CitySlug;
  cityName: string;
  unlockBadge: string;
  unlockSub: string;
  theme: CityDeckTheme;
  metadata: { title: string; description: string; path: string };
}
