import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.18.158.214", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cos.*.myqcloud.com",
      },
      {
        protocol: "https",
        hostname: "*.file.myqcloud.com",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
