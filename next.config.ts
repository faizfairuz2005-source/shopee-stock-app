import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf-8",
}).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/login", revision }],
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // Security: Disable X-Powered-By header
  poweredByHeader: false,

  // Security: Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Security: Enable strict mode for better development warnings
  reactStrictMode: true,

  // Compression for production (helps prevent response splitting)
  compress: true,
};

export default withSerwist(nextConfig);
