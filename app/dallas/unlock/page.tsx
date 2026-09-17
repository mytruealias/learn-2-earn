import type { Metadata } from "next";
import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { dallasConfig as cfg } from "../../components/CityDeck/configs/dallas";

export const metadata: Metadata = {
  title: "Dallas Pilot – Access Required",
  description: cfg.metadata.description,
  openGraph: {
    title: cfg.metadata.openGraphTitle ?? cfg.metadata.title,
    description: cfg.metadata.openGraphDescription ?? cfg.metadata.description,
    url: cfg.metadata.path,
    type: "website",
    siteName: "Learn 2 Earn",
    images: [
      {
        url: "/images/og/dallas-pilot.png",
        width: 1200,
        height: 630,
        alt: "Learn2Earn 90-day pilot proposal for the City of Dallas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: cfg.metadata.openGraphTitle ?? cfg.metadata.title,
    description: cfg.metadata.openGraphDescription ?? cfg.metadata.description,
    images: ["/images/og/dallas-pilot.png"],
  },
};

export default function DallasUnlockPage() {
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
