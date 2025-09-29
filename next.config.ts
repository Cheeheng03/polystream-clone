import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Path to your custom service worker source file
  swSrc: "app/sw.ts",
  // Destination for the built service worker
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSerwist(nextConfig);
