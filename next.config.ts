import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  output: 'standalone',
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
      // Аукционы: площадки, которые отдают ОРИГИНАЛЫ по 200–900 КБ на фото.
      // Список обязан совпадать с HEAVY_IMAGE_HOSTS в src/lib/remoteImage.ts.
      { protocol: 'https', hostname: 'heydealer-api.s3.amazonaws.com', pathname: '/media/**' },
      { protocol: 'https', hostname: 'imgmk.lotteautoauction.net', pathname: '/**' },
      { protocol: 'https', hostname: 'auction.skcarrental.com', pathname: '/uploadFiles/**' },
    ],
    // Сутки, а не 60 с по умолчанию: S3 HeyDealer и площадки не шлют
    // Cache-Control, и без этого сервер пережимал бы одно и то же фото
    // раз в минуту. Фото лота не меняется; запчасти в Storage — тоже.
    minimumCacheTTL: 86400,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Заголовки безопасности перенесены из vercel.json: прод работает на
  // Coolify, который vercel.json не читает. Cache-Control из vercel.json
  // сюда НЕ переносим — Next ставит свои, чужие могут сломать кеш.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
    ];
  },
};

export default withAnalyzer(nextConfig);
