import type { MetadataRoute } from "next";
import { austinConfig } from "./components/CityDeck/configs/austin";
import { dallasConfig } from "./components/CityDeck/configs/dallas";
import { houstonConfig } from "./components/CityDeck/configs/houston";
import { denverConfig } from "./components/CityDeck/configs/denver";
import { losAngelesConfig } from "./components/CityDeck/configs/los-angeles";
import { sanFranciscoConfig } from "./components/CityDeck/configs/san-francisco";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://learn2earn-usa.com";

const CITY_CONFIGS = [
  austinConfig,
  dallasConfig,
  houstonConfig,
  denverConfig,
  losAngelesConfig,
  sanFranciscoConfig,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const cityEntries: MetadataRoute.Sitemap = CITY_CONFIGS.map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...cityEntries,
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
