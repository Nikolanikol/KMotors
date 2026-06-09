import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Автокаталог (encar.com)
        protocol: 'https',
        hostname: 'ci.encar.com',
        pathname: '/**',
      },
      {
        // Запчасти: Supabase Storage
        protocol: 'https',
        hostname: 'dyadajdrxnvzkrmuoaku.supabase.co',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
    ];
  },
};

export default withAnalyzer(nextConfig);
