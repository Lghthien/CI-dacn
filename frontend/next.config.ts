import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000", // nếu chạy cổng 4000
      },
    ],
  },
};

export default nextConfig;
