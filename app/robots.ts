import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-identity";
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return origin
    ? {
        rules: {
          userAgent: "*",
          allow: ["/", "/demo", "/privacy", "/terms"],
          disallow: [
            "/api/",
            "/admin",
            "/app",
            "/practice",
            "/paths/",
            "/lesson/",
            "/profile",
            "/access",
            "/login",
            "/signup",
            "/onboarding",
            "/recover",
            "/lifeline",
            "/dev/",
            "/austin",
            "/dallas",
            "/houston",
            "/denver",
            "/los-angeles",
            "/san-francisco",
          ],
        },
        sitemap: `${origin}/sitemap.xml`,
        host: origin,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
