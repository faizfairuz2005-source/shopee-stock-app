import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat Activity — MultiStore",
  description: "Log aktivitas pengguna dalam sistem",
};

export default function RiwayatActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
