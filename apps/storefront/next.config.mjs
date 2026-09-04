/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@anuprerna/ui", "@anuprerna/types"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "anuprerna.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "loom-v2.anuprerna.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "blog.anuprerna.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: false,
};

export default nextConfig;
