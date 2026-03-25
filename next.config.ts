import type { NextConfig } from "next";

const devOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim())
  : [];

const nextConfig: NextConfig = {
  ...(devOrigins.length > 0 && { allowedDevOrigins: devOrigins }),
  experimental: {
    serverActions: {
      ...(devOrigins.length > 0 && { allowedOrigins: devOrigins }),
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
