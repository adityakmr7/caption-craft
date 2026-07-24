import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native binding - must run via Node's require, not get bundled.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
