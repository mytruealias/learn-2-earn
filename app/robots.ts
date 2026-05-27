import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://learn2earn-usa.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api",
          "/api/",
          "/app",
          "/app/",
          "/paths",
          "/paths/",
          "/lesson",
          "/lesson/",
          "/profile",
          "/profile/",
          "/lifeline",
          "/lifeline/",
          "/signup",
          "/login",
          "/access",
          "/admin",
          "/admin/",
          "/austin/unlock",
          "/dallas/unlock",
          "/houston/unlock",
          "/denver/unlock",
          "/los-angeles/unlock",
          "/san-francisco/unlock",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
