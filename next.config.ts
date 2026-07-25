import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native binding - must run via Node's require, not get bundled.
  serverExternalPackages: ["@napi-rs/canvas"],
  experimental: {
    // Default is 10MB - proxy.ts buffers the whole request body to that
    // limit before the route handler ever sees it, silently truncating
    // anything larger (no error from Next.js itself - the corrupted
    // multipart body just fails to parse downstream). Match the app's
    // own 100MB video cap (see MAX_VIDEO_BYTES in app/api/videos/route.ts).
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
