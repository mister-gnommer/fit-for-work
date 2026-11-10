import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development startup from rewriting the project's agent instructions.
  agentRules: false,
};

export default nextConfig;
