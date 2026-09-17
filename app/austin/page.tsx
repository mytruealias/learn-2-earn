import type { Metadata } from "next";
import CityDeckPage from "../components/CityDeck/CityDeckPage";
import { austinConfig } from "../components/CityDeck/configs/austin";

export const metadata: Metadata = {
  title: austinConfig.metadata.title,
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
  alternates: { canonical: "/austin" },
};

export default function AustinPage() {
  return <CityDeckPage config={austinConfig} />;
}
