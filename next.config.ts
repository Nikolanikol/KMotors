import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ci.encar.com",
        pathname: "/**",
      },
    ],
  },
//     eslint: {
//     ignoreDuringBuilds: true,
//   },
};

export default nextConfig;
