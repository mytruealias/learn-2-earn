import type { Metadata } from "next";
import { siteOrigin } from "../site-identity";
export const description =
  "Supported adult learning, program-defined incentives and clear staff oversight for cities, shelters and community partners.";
export function marketingMetadata(
  title: string,
  path: string,
  summary = description,
  gated = false,
): Metadata {
  const origin = siteOrigin();
  return {
    title,
    description: summary,
    robots: { index: !!origin && !gated, follow: !!origin && !gated },
    ...(origin
      ? {
          metadataBase: new URL(origin),
          alternates: { canonical: new URL(path, origin).toString() },
        }
      : {}),
    openGraph: {
      title,
      description: summary,
      siteName: "Learn2Earn",
      type: "website",
      ...(origin ? { url: new URL(path, origin).toString() } : {}),
      ...(origin
        ? {
            images: [
              {
                url: new URL("/opengraph-image", origin).toString(),
                width: 1200,
                height: 630,
                alt: "Learn2Earn — learning with support, progress with oversight",
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      ...(origin
        ? { images: [new URL("/opengraph-image", origin).toString()] }
        : {}),
    },
  };
}
