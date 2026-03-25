import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.replit.dev", "*.replit.com", "*.riker.replit.dev"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.replit.dev", "*.replit.com", "*.riker.replit.dev"],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
