import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up unrelated lockfiles elsewhere.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  // Serve images as-is: Next 16's optimizer rejects http://localhost upstreams
  // (used by the local-storage fallback), and Cloudinary URLs are already
  // transformed/sized at the CDN — so optimization adds nothing here.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost", port: "3005" },
    ],
  },
  // shared-types is a workspace package; transpile it so imports resolve cleanly.
  transpilePackages: ["shared-types"],
};

export default nextConfig;
