import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, Store } from "lucide-react";

export default function LaporanPage() {
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analisis dan laporan stok, penjualan, dan performa toko
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ringkasan stok per produk dan toko
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Tren penjualan dan revenue
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Performa per toko terhubung
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
            Grafik & Analisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <BarChart3 className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Laporan dalam pengembangan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fitur grafik dan analisis akan segera hadir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
