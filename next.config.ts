import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // proxy.ts runs on every request and buffers the body up to this limit
    // before route handlers see it — silently truncating anything larger,
    // with no error surfaced (see Next.js docs). Default is 10MB, which is
    // exactly our own screenshot cap (MAX_IMAGE_BYTES in
    // app/api/generate/route.ts), so real uploads near that size would get
    // silently corrupted. Raised with headroom for multipart overhead.
    proxyClientMaxBodySize: "15mb",
  },
};

export default nextConfig;
