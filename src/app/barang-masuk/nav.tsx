"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageOpen, History } from "lucide-react";

const tabs = [
  { href: "/barang-masuk", label: "Barang Masuk", icon: PackageOpen },
  { href: "/barang-masuk/riwayat", label: "Riwayat Barang Masuk", icon: History },
];

export function BarangMasukNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
