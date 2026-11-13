import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  pageExtensions: ["next.ts", "next.tsx"],
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
