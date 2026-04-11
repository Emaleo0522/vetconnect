import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable transpiling the shared package in the monorepo
  transpilePackages: ["@vetconnect/shared"],
};

export default nextConfig;
