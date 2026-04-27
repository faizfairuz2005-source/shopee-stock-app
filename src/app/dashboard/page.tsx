import { getAppData } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, ArrowRight, Package, ShoppingCart, Store, TrendingUp } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { href: "/inventory", icon: Package, title: "Kelola Stok", desc: "Update inventory", color: "text-primary" },
  { href: "/orders", icon: ShoppingCart, title: "Lihat Pesanan", desc: "Manage orders", color: "text-primary" },
  { href: "/laporan", icon: TrendingUp, title: "Lihat Laporan", desc: "Analisis penjualan", color: "text-primary" },
];

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

export default async function DashboardPage() {
  const { inventoryProducts, salesRecords, sampleStoreCount } = await getAppData();
  
  const totalProducts = inventoryProducts.length;
  const totalStock = inventoryProducts.reduce((sum, product) => sum + product.totalStock, 0);
  const totalSold = salesRecords.reduce((sum, record) => sum + record.quantity, 0);
  const lowStockCount = inventoryProducts.filter((product) => product.totalStock > 0 && product.totalStock <= 10).length;

  const outOfStockProducts = inventoryProducts.filter((p) => p.totalStock === 0);
  const outOfStockCount = outOfStockProducts.length;
  const outOfStockPercentage = totalProducts > 0 ? ((outOfStockCount / totalProducts) * 100).toFixed(1) : "0";
  const recentOutOfStock = outOfStockProducts.slice(0, 5);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan stok dan aktivitas toko Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalProducts)}</p>
            <p className="text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalStock)}</p>
            <p className="text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalSold)}</p>
            <p className="text-xs text-muted-foreground">Total unit terjual</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatNumber(lowStockCount)}</p>
            <p className="text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Stok Habis Detailed Card */}
        <Card className="col-span-full lg:col-span-4 border-destructive/40 bg-destructive/5 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between pb-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-destructive font-semibold text-lg">
                <AlertTriangle className="h-5 w-5" />
                Stok Habis
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-foreground text-base">{formatNumber(outOfStockCount)} Produk</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-destructive/80 font-medium">{outOfStockPercentage}% dari total produk</span>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Link href="/inventory?filter=habis">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="rounded-lg border border-destructive/20 bg-background/50 p-1">
              {recentOutOfStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Tidak ada produk yang kehabisan stok.</p>
                </div>
              ) : (
                <div className="divide-y divide-destructive/10">
                  {recentOutOfStock.map(product => (
                    <div key={product.sku} className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50 rounded-md">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium leading-none">{product.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
                      </div>
                      <Badge variant="destructive" className="shadow-sm">Habis</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Aksi Cepat & Toko */}
        <div className="col-span-full lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-lg border p-3 transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className={`shrink-0 rounded-lg bg-primary/10 p-2 transition-transform duration-200 ease-out group-hover:scale-110 ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 ease-out group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
                Toko Terhubung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="rounded-full bg-muted p-2">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {sampleStoreCount} toko aktif
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Terhubung untuk sinkronisasi stok
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
