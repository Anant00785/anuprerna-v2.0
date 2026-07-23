/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@anuprerna/ui", "@anuprerna/types"],
  images: {
    // Product/artisan photos are served from the S3 bucket (see docs/adr/0003).
    remotePatterns: [{ protocol: "https", hostname: "anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com" }],
  },
  experimental: { typedRoutes: true },
};
export default nextConfig;
