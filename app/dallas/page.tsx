import type { Metadata } from "next";
import CityDeckPage from "../components/CityDeck/CityDeckPage";
import { dallasConfig as cfg } from "../components/CityDeck/configs/dallas";

export const metadata: Metadata = {
  title: cfg.metadata.title,
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
  alternates: { canonical: "/dallas" },
};

export default function DallasPage() {
  return <CityDeckPage config={cfg} />;
}
