import type { NextConfig } from "next";

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
      {
        protocol: "https",
        hostname: "**.shopee.co.id",
      },
      {
        protocol: "https",
        hostname: "**.shopee.com",
      },
    ],
  },

  // Security: Enable strict mode for better development warnings
  reactStrictMode: true,

  // Compression for production (helps prevent response splitting)
  compress: true,
};

export default nextConfig;
