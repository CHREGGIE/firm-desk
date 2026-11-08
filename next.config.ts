import type { NextConfig } from "next";

// Only the firm's site and the Squarespace editor may frame /embed. Set
// EMBED_ANCESTORS (space separated) to change the list before a build.
const embedAncestors =
  process.env.EMBED_ANCESTORS?.trim() ||
  "'self' https://ainsworthgorkin.com https://www.ainsworthgorkin.com https://*.squarespace.com";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@electric-sql/pglite"],
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/((?!embed).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/embed",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${embedAncestors}` },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
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
