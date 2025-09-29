import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Path to your custom service worker source file
  swSrc: "app/sw.ts",
  // Destination for the built service worker
  swDest: "public/sw.js",
});

const API_PROXY_TARGET = process.env.API_PROXY_TARGET || "https://app.polystream.xyz";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
