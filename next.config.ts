import type { NextConfig } from "next";

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
        pathname: '/storage/v1/object/public/**',
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
    return [];
  },
};

export default nextConfig;
