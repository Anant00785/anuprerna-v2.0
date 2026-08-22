import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@anuprerna/ui", "@anuprerna/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

