"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Store, Plus } from "lucide-react";

export default function ConnectShopeePage() {
  const handleConnectShopee = () => {
    alert("Fitur sambung ke Shopee sedang dalam pengembangan");
  };

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Hubungkan Shopee", href: "/connect-shopee" },
        ]}
        className="mb-2"
      />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hubungkan Toko Shopee
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sambungkan toko Shopee Anda untuk sinkronisasi otomatis data stok, pesanan, dan meningkatkan efisiensi bisnis Anda.
        </p>
      </div>

      {/* Connect Button Card */}
      <Card className="border-2 border-border shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Mulai Integrase</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <Button
            onClick={handleConnectShopee}
            className="h-12 w-full sm:w-64 gap-2 text-base font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Sambungkan Toko Shopee Baru
          </Button>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Anda akan diarahkan ke halaman login Shopee untuk memberikan akses
          </p>
        </CardContent>
      </Card>

      {/* Connected Shops Section */}
      <Card className="border-border shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              Toko yang Sudah Terhubung
            </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Store}
            title="Belum ada toko terhubung"
            description="Klik tombol di atas untuk menghubungkan toko Shopee Anda."
          />
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="border-border bg-primary/5 dark:bg-primary/10">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Keuntungan Integrasi:</h4>
             <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Sinkronisasi otomatis stok produk ke semua platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Kelola pesanan dari satu dashboard terpusat</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Laporan penjualan real-time dan analytics mendalam</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
