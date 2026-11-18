import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/tab-sessions.js", headers: [
      { key: "Cache-Control", value: "no-store" },
      { key: "Service-Worker-Allowed", value: "/" },
    ] }];
  },
  experimental: {
    agentFeedback: true,

    serverActions: {
      bodySizeLimit: "52mb",
    },
  },

  cacheComponents: true,
  partialPrefetching: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kgpcthbzkkvedvgbbteo.supabase.co",
      },
    ],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
