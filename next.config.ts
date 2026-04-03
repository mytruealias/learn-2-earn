import type { NextConfig } from "next";

const devOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
  : [];

// When ROOT_DOMAIN is set, include all three subdomain origins so that
// Server Actions and cross-subdomain requests are accepted.
const rootDomain = process.env.ROOT_DOMAIN;
const subdomainOrigins = rootDomain
  ? [
      `https://${rootDomain}`,
      `https://www.${rootDomain}`,
      `https://app.${rootDomain}`,
      `https://admin.${rootDomain}`,
    ]
  : [];

const allAllowedOrigins = [...new Set([...devOrigins, ...subdomainOrigins])];

const nextConfig: NextConfig = {
  ...(allAllowedOrigins.length > 0 && { allowedDevOrigins: allAllowedOrigins }),
  experimental: {
    serverActions: {
      ...(allAllowedOrigins.length > 0 && { allowedOrigins: allAllowedOrigins }),
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Only HTML pages — not static JS/CSS/image assets
        source: "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot)$).*)",
        headers: [
          {
            key: "Vary",
            value: "Host",
          },
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
          {
            // Remove includeSubDomains from HSTS — www.learn2earn.tech has no SSL cert
            // which causes Chrome to block all subdomains when includeSubDomains is set
            key: "Strict-Transport-Security",
            value: "max-age=63072000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
