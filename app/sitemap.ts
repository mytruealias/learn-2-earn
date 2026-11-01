import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-identity";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return origin
    ? ["/", "/demo", "/privacy", "/terms"].map((path) => ({
        url: new URL(path, origin).toString(),
      }))
    : [];
}
