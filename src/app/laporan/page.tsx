import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { AlertCircle, BarChart3, Package, Store, TrendingUp } from "lucide-react";
import { getAppData, Order } from "@/app/actions";
import ProfitLossSection from "@/components/profit-loss-section";
import { LaporanExportActions } from "@/components/laporan-export-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

// Flatten order items for reporting
function getFlattenedSales(orders: Order[]) {
  return orders.flatMap((order) =>
    order.items.map((item) => ({
      orderNumber: order.nomor_order,
      date: order.tanggal_pesanan,
      nama_produk: item.nama_produk,
      sku: item.sku,
      quantity: item.quantity,
      harga: item.harga,
      subtotal: item.subtotal,
      seller: order.seller_name,
    }))
  );
}

function getTopSellingProducts(orders: Order[]) {
  const flattened = getFlattenedSales(orders);
  const totals = flattened.reduce<Record<string, number>>((acc, record) => {
    acc[record.nama_produk] = (acc[record.nama_produk] ?? 0) + record.quantity;
    return acc;
  }, {});

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
}

function getSellerPerformance(orders: Order[]) {
  const totals = orders.reduce<Record<string, { transactions: number; units: number; revenue: number }>>((acc, order) => {
    const current = acc[order.seller_name] ?? { transactions: 0, units: 0, revenue: 0 };
    current.transactions += 1;
    current.units += order.items.reduce((sum, item) => sum + item.quantity, 0);
    current.revenue += order.grand_total;
    acc[order.seller_name] = current;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([seller, stats]) => ({ seller, ...stats }))
    .sort((a, b) => b.transactions - a.transactions || b.units - a.units || b.revenue - a.revenue);
}

export default async function LaporanPage() {
  const { inventoryProducts, orders, sampleStoreCount } = await getAppData();

  const totalRevenue = orders.reduce((sum, order) => sum + order.grand_total, 0);
  const totalTransactions = orders.length;
  const lowStockItems = inventoryProducts.filter((product) => product.totalStock > 0 && product.totalStock <= 10);
  const outOfStockItems = inventoryProducts.filter((product) => product.totalStock === 0);
  const topSelling = getTopSellingProducts(orders);
  const sellerPerformance = getSellerPerformance(orders);
  const topSeller = sellerPerformance[0] ?? { seller: "-", transactions: 0, units: 0, revenue: 0 };
  const flattenedSales = getFlattenedSales(orders);

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Laporan", href: "/laporan" },
        ]}
        className="mb-2"
      />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analisis dan laporan stok, penjualan, dan performa toko
          </p>
        </div>
        <LaporanExportActions
          flattenedSales={flattenedSales}
          stockItems={inventoryProducts.map((p) => ({
            sku: p.sku,
            name: p.name,
            totalStock: p.totalStock,
            status: p.totalStock === 0 ? "Habis" : p.totalStock <= 10 ? "Rendah" : "Aman",
          }))}
          lowStockItems={lowStockItems.map((p) => ({
            sku: p.sku,
            name: p.name,
            totalStock: p.totalStock,
            status: "Rendah",
          }))}
          outOfStockItems={outOfStockItems.map((p) => ({
            sku: p.sku,
            name: p.name,
            totalStock: p.totalStock,
            status: "Habis",
          }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={"card-hover " + (outOfStockItems.length > 0 ? "border-destructive/30 bg-destructive/5" : lowStockItems.length > 0 ? "border-amber-300 dark:border-amber-800" : "")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Stok</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {outOfStockItems.length + lowStockItems.length}
              </p>
              {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Butuh perhatian
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {outOfStockItems.length > 0 && `${outOfStockItems.length} habis`}
              {outOfStockItems.length > 0 && lowStockItems.length > 0 && " • "}
              {lowStockItems.length > 0 && `${lowStockItems.length} rendah`}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total pendapatan penjualan</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sampleStoreCount}</p>
            <p className="text-xs text-muted-foreground">Toko terhubung</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status Stok Card */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
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
                  <Badge variant="destructive" className="text-xs">{outOfStockItems.length} produk</Badge>
                </div>
                {outOfStockItems.length > 0 && (
                  <Link href="/inventory?filter=habis" className="text-xs font-medium text-destructive hover:underline">
                    Lihat di Inventory →
                  </Link>
                )}
              </div>
              {outOfStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada produk yang stoknya habis.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-destructive/20">
                  {outOfStockItems.slice(0, 5).map(product => (
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
                  <Badge variant="secondary" className="text-xs text-amber-700 dark:text-amber-400">{lowStockItems.length} produk</Badge>
                </div>
                {lowStockItems.length > 0 && (
                  <Link href="/inventory?filter=rendah" className="text-xs font-medium text-amber-500 hover:underline">
                    Lihat di Inventory →
                  </Link>
                )}
              </div>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Semua produk memiliki stok aman.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-amber-200 dark:border-amber-800/30">
                  {lowStockItems.slice(0, 5).map(product => (
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ringkasan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Transaksi</p>
                <p className="mt-2 text-2xl font-semibold">{totalTransactions}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Penjual Unggul</p>
                <p className="mt-2 text-lg font-medium">{topSeller.seller}</p>
                <p className="text-sm text-muted-foreground">{topSeller.transactions} transaksi | {topSeller.units} unit</p>
                <p className="text-sm text-muted-foreground">{formatRupiah(topSeller.revenue)} pendapatan</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Produk Terlaris</p>
                {topSelling.length > 0 ? (
                  <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm">
                    {topSelling.map(([name, qty]) => (
                      <li key={name}>{name} - {qty} unit</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Tidak ada data penjualan</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Transaksi Per Seller</p>
                <div className="mt-2 space-y-2">
                  {sellerPerformance.map((seller) => (
                    <div key={seller.seller} className="flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium">{seller.seller}</p>
                        <p className="text-muted-foreground">{seller.units} unit | {formatRupiah(seller.revenue)}</p>
                      </div>
                      <p className="whitespace-nowrap text-muted-foreground">{seller.transactions} transaksi</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border pt-6">
        <ProfitLossSection orders={orders} />
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
            Laporan Lengkap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead>No. Order</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Penjual</TableHead>
                  <TableHead className="text-right">Kuantitas</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flattenedSales.slice().reverse().map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{record.orderNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{record.sku}</TableCell>
                    <TableCell className="font-medium">{record.nama_produk}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                        {record.seller}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{record.quantity}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatRupiah(record.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
