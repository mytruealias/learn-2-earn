import type { Metadata } from "next";
import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { denverConfig as cfg } from "../../components/CityDeck/configs/denver";

export const metadata: Metadata = {
  title: "Denver Pilot – Access Required",
  description: cfg.metadata.description,
  openGraph: {
    title: cfg.metadata.openGraphTitle ?? cfg.metadata.title,
    description: cfg.metadata.openGraphDescription ?? cfg.metadata.description,
    url: cfg.metadata.path,
    type: "website",
    siteName: "Learn 2 Earn",
    images: [
      {
        url: "/images/og/denver-pilot.png",
        width: 1200,
        height: 630,
        alt: "Learn2Earn 90-day pilot proposal for the City and County of Denver",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: cfg.metadata.openGraphTitle ?? cfg.metadata.title,
    description: cfg.metadata.openGraphDescription ?? cfg.metadata.description,
    images: ["/images/og/denver-pilot.png"],
  },
};

export default function DenverUnlockPage() {
  return (
    <CityDeckUnlock
      slug={cfg.slug}
      basePath={cfg.metadata.path}
      badge={cfg.unlockBadge}
      sub={cfg.unlockSub}
      theme={cfg.theme}
    />
  );
}
