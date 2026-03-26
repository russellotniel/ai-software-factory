import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // Required for 'use cache' directive
  output: "standalone", // Required for Docker deployment
  reactCompiler: false, // Enable per-project after evaluation
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
