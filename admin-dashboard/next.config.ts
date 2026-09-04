import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      // Optional wildcard to support any arbitrary user image URL
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}


export default nextConfig;
