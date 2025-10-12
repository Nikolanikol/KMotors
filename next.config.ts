import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["ci.encar.com",        "dyadajdrxnvzkrmuoaku.supabase.co",
],
  },
    eslint: {
    ignoreDuringBuilds: true,
  },
   typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
