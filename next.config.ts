import type { NextConfig } from "next";

const path = require("path");

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
  // Adding TypeScript typing for webpack configuration
  webpack: (config) => {
    // Resolve path alias for '@' to the src directory
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
