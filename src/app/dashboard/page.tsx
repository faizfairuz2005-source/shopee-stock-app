import { getAppData } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AlertCircle, ArrowRight, Package, ShoppingCart, Store, TrendingUp } from "lucide-react";
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
  const { inventoryProducts, orders, sampleStoreCount } = await getAppData();

  const totalProducts = inventoryProducts.length;
  const totalStock = inventoryProducts.reduce((sum, product) => sum + product.totalStock, 0);
  const totalSold = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const lowStockCount = inventoryProducts.filter((product) => product.totalStock > 0 && product.totalStock <= 10).length;

  const outOfStockProducts = inventoryProducts.filter((p) => p.totalStock === 0);
  const outOfStockCount = outOfStockProducts.length;

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[{ name: "Dashboard", href: "/dashboard" }]}
        className="mb-2"
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan stok dan aktivitas toko Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalProducts)}</p>
            <p className="text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalStock)}</p>
            <p className="text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalSold)}</p>
            <p className="text-xs text-muted-foreground">Total unit terjual</p>
          </CardContent>
        </Card>
        <Card className={"card-hover " + (outOfStockCount > 0 ? "border-destructive/30" : "")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
            <AlertCircle className={`h-4 w-4 ${outOfStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${outOfStockCount > 0 ? "text-destructive" : ""}`}>{formatNumber(outOfStockCount)}</p>
              {outOfStockCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  Perlu restok!
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Produk kosong</p>
          </CardContent>
        </Card>
        <Card className={"card-hover " + (lowStockCount > 0 ? "border-amber-300 dark:border-amber-800" : "")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <Package className={`h-4 w-4 ${lowStockCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-500" : ""}`}>{formatNumber(lowStockCount)}</p>
              {lowStockCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Perlu restok
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">≤ 10 unit tersisa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Status Stok Card */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status Stok
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stok Habis */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <h4 className="text-sm font-semibold text-destructive">Stok Habis</h4>
                  <Badge variant="destructive" className="text-xs">{outOfStockCount} produk</Badge>
                </div>
                {outOfStockCount > 0 && (
                  <Link href="/inventory?filter=habis" className="text-xs font-medium text-destructive hover:underline">
                    Lihat semua →
                  </Link>
                )}
              </div>
              {outOfStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada produk yang stoknya habis.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-destructive/20">
                  {outOfStockProducts.slice(0, 5).map(product => (
                    <div key={product.sku} className="flex items-center justify-between px-3 py-2.5 hover:bg-destructive/5 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.sku} • {product.connectedStores} toko</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Habis</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stok Rendah */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-amber-500">Stok Rendah</h4>
                  <Badge variant="secondary" className="text-xs text-amber-700 dark:text-amber-400">{lowStockCount} produk</Badge>
                </div>
                {lowStockCount > 0 && (
                  <Link href="/inventory?filter=rendah" className="text-xs font-medium text-amber-500 hover:underline">
                    Lihat semua →
                  </Link>
                )}
              </div>
              {lowStockCount === 0 ? (
                <p className="text-sm text-muted-foreground">Semua produk memiliki stok aman.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-amber-200 dark:border-amber-800/30">
                  {inventoryProducts
                    .filter(p => p.totalStock > 0 && p.totalStock <= 10)
                    .slice(0, 5)
                    .map(product => (
                      <div key={product.sku} className="flex items-center justify-between px-3 py-2.5 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                        <span className="text-sm font-medium text-amber-500">{product.totalStock} unit</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Aksi Cepat & Toko */}
        <div className="col-span-full lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30"
                  >
                    <div className={`shrink-0 rounded-lg bg-primary/10 p-2 ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4" />
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
