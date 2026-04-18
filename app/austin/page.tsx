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
  },
  twitter: {
    card: "summary_large_image",
    title: austinConfig.metadata.openGraphTitle ?? austinConfig.metadata.title,
    description: austinConfig.metadata.openGraphDescription ?? austinConfig.metadata.description,
  },
};

export default function AustinPage() {
  return <CityDeckPage config={austinConfig} />;
}
