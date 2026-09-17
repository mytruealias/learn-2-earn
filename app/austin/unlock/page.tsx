import type { Metadata } from "next";
import CityDeckUnlock from "../../components/CityDeck/CityDeckUnlock";
import { austinConfig } from "../../components/CityDeck/configs/austin";

export const metadata: Metadata = {
  title: "Austin Pilot – Access Required",
  description: austinConfig.metadata.description,
  openGraph: {
    title: austinConfig.metadata.openGraphTitle ?? austinConfig.metadata.title,
    description: austinConfig.metadata.openGraphDescription ?? austinConfig.metadata.description,
    url: austinConfig.metadata.path,
    type: "website",
    siteName: "Learn 2 Earn",
    images: [
      {
        url: "/images/og/austin-pilot.png",
        width: 1200,
        height: 630,
        alt: "Learn2Earn 90-day pilot proposal for the City of Austin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: austinConfig.metadata.openGraphTitle ?? austinConfig.metadata.title,
    description: austinConfig.metadata.openGraphDescription ?? austinConfig.metadata.description,
    images: ["/images/og/austin-pilot.png"],
  },
};

export default function AustinUnlockPage() {
  return (
    <CityDeckUnlock
      slug={austinConfig.slug}
      basePath={austinConfig.metadata.path}
      badge={austinConfig.unlockBadge}
      sub={austinConfig.unlockSub}
      theme={austinConfig.theme}
    />
  );
}
