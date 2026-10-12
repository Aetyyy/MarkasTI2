import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  // webpack config dihapus — biarkan tsconfig paths yang mengatur alias
};

export default nextConfig;
