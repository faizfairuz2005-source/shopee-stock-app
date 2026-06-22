import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MultiStore — Manajemen Stok & POS",
    short_name: "MultiStore",
    description: "Aplikasi manajemen inventory dan POS kasir untuk UMKM",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a1a",
    theme_color: "#2563eb",
    categories: ["business", "productivity", "shopping"],
    lang: "id",
    dir: "ltr",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "POS Kasir",
        short_name: "Kasir",
        description: "Buka POS Kasir",
        url: "/pos",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
      {
        name: "Inventory",
        short_name: "Stok",
        description: "Lihat daftar stok produk",
        url: "/inventory",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
    ],
    screenshots: [],
  };
}
