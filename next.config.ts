import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Suppress middleware warning
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
