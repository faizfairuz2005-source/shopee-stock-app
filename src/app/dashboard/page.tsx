import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, AlertCircle, ShoppingCart } from "lucide-react";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-1 text-sm font-normal text-muted-foreground">
          Ringkasan stok dan aktivitas toko Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-blue-100 p-1.5">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              Total Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">0</div>
            <p className="mt-1 text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-indigo-100 p-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              Stok Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">0</div>
            <p className="mt-1 text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-purple-100 p-1.5">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
              Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">0</div>
            <p className="mt-1 text-xs text-muted-foreground">Total terjual</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-amber-100 p-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">0</div>
            <p className="mt-1 text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-blue-200/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-100/50 cursor-pointer">
              <Package className="mx-auto mb-2 h-8 w-8 text-blue-500" />
              <p className="font-medium text-blue-900">Kelola Stok</p>
              <p className="text-xs text-blue-600">Update inventory</p>
            </div>
            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center transition-all hover:border-indigo-400 hover:bg-indigo-100/50 cursor-pointer">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-indigo-500" />
              <p className="font-medium text-indigo-900">Lihat Laporan</p>
              <p className="text-xs text-indigo-600">Analisis penjualan</p>
            </div>
            <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/50 p-6 text-center transition-all hover:border-purple-400 hover:bg-purple-100/50 cursor-pointer">
              <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-purple-500" />
              <p className="font-medium text-purple-900">Pesanan Baru</p>
              <p className="text-xs text-purple-600">Lihat orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
