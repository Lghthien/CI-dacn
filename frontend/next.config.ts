import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [process.env.HOST || "localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: process.env.HOST || "localhost",
        port: "4000",
      },
    ],
  },
};

export default nextConfig;
