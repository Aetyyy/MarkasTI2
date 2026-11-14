import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // 👇 DUA KUNCI UTAMA UNTUK BUG ALIAS TURBOPACK
  turbopack: {
    root: path.join(__dirname), // Arahkan root ke folder proyek secara eksplisit
    resolveAlias: {
      "@/*": "./src/*", // Gunakan wildcard, bukan hanya "@"
    },
  },
};

export default nextConfig;
