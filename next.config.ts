import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ci.encar.com',
        port: '',
        pathname: '/**',
      },
      {
        // Запчасти: изображения из Supabase Storage и внешних CDN (Mobis и др.)
        protocol: 'https',
        hostname: '**',
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
