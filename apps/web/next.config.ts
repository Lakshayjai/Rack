import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up unrelated lockfiles elsewhere.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  // Allow next/image to load background-removed clothing photos from Cloudinary.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Local storage fallback (when Cloudinary is not configured).
      { protocol: "http", hostname: "localhost", port: "3005" },
    ],
  },
  // shared-types is a workspace package; transpile it so imports resolve cleanly.
  transpilePackages: ["shared-types"],
};

export default nextConfig;
