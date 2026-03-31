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
};

export default nextConfig;
