import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  AlertCircle,
  BarChart3,
  Package,
  Store,
  TrendingUp,
  ArrowUpDown,
  Minus,
  Plus,
  History,
  DollarSign,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { getAppData, getReturns, type Order } from "@/app/actions";
import ProfitLossSection from "@/components/profit-loss-section";
import LaporanPenjualan from "@/components/laporan-penjualan";
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
  const { inventoryProducts, orders, sampleStoreCount, stockAdjustments, expenses } = await getAppData();
  const goodsReturns = await getReturns();

  const totalRevenue = orders.reduce((sum, order) => sum + order.grand_total, 0);
  const totalTransactions = orders.length;
  const lowStockItems = inventoryProducts.filter((product) => product.totalStock > 0 && product.totalStock <= (product.minStok ?? 10));
  const outOfStockItems = inventoryProducts.filter((product) => product.totalStock === 0);
  const topSelling = getTopSellingProducts(orders);
  const sellerPerformance = getSellerPerformance(orders);
  const topSeller = sellerPerformance[0] ?? { seller: "-", transactions: 0, units: 0, revenue: 0 };
  const flattenedSales = getFlattenedSales(orders);

  // ── Stock Adjustment Stats ────────────────────────────────────────
  const adjustments = stockAdjustments || [];
  const totalAdjustedTambah = adjustments.filter((a) => a.jenis === "tambah").reduce((s, a) => s + a.jumlah, 0);
  const totalAdjustedKurang = adjustments.filter((a) => a.jenis === "kurangi").reduce((s, a) => s + a.jumlah, 0);
  const totalKerugian = adjustments.reduce((s, a) => s + (a.nilai_kerugian || 0), 0);
  const recentAdjustments = [...adjustments].slice(0, 10);

  // ── Return Stats ───────────────────────────────────────────────────
  const totalRetur = goodsReturns.reduce((s, r) => s + r.total_refund, 0);
  const totalReturItems = goodsReturns.reduce((s, r) => s + r.total_item, 0);

  // ── Expense Stats ───────────────────────────────────────────────────
  const allExpenses = expenses || [];
  const totalExpenses = allExpenses.reduce((s, e) => s + e.jumlah, 0);
  const expenseCategories = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.kategori] = (acc[e.kategori] || 0) + e.jumlah;
    return acc;
  }, {});
  const topExpenseCategory = Object.entries(expenseCategories).sort(([, a], [, b]) => b - a)[0];

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
            status: p.totalStock === 0 ? "Habis" : p.totalStock <= (p.minStok ?? 10) ? "Rendah" : "Aman",
          }))}
          stockAdjustments={adjustments}
        />
      </div>

      {/* ── Expense Summary Cards ── */}
      {allExpenses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-hover border-violet-200 dark:border-violet-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
              <Wallet className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{formatRupiah(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">{allExpenses.length} transaksi pengeluaran</p>
            </CardContent>
          </Card>
          {topExpenseCategory && (
            <Card className="card-hover border-indigo-200 dark:border-indigo-900/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kategori Terbesar</CardTitle>
                <BarChart3 className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{topExpenseCategory[0]}</p>
                <p className="text-xs text-muted-foreground">{formatRupiah(topExpenseCategory[1])} total</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Retur Summary Cards ── */}
      {goodsReturns.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="card-hover border-orange-200 dark:border-orange-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Retur Barang</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{goodsReturns.length}</p>
              <p className="text-xs text-muted-foreground">{totalReturItems} item diretur</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-red-200 dark:border-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nilai Retur</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatRupiah(totalRetur)}</p>
              <p className="text-xs text-muted-foreground">Total refund ke pelanggan</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Stock Adjustment Summary Cards ── */}
      {adjustments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-hover border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penyesuaian Stok</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{adjustments.length}</p>
              <p className="text-xs text-muted-foreground">Total transaksi penyesuaian</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-emerald-200 dark:border-emerald-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Ditambah</CardTitle>
              <Plus className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalAdjustedTambah.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">Unit stok ditambahkan</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-red-200 dark:border-red-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Dikurangi</CardTitle>
              <Minus className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalAdjustedKurang.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">Unit stok dikurangi</p>
            </CardContent>
          </Card>
          <Card className="card-hover border-amber-200 dark:border-amber-900/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kerugian</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatRupiah(totalKerugian)}</p>
              <p className="text-xs text-muted-foreground">Dari barang rusak/hilang</p>
            </CardContent>
          </Card>
        </div>
      )}

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Laporan Lengkap */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
              Laporan Penjualan Lengkap
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

        {/* Riwayat Penyesuaian Stok */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Penyesuaian Stok
              {adjustments.length > 0 && (
                <Badge variant="outline" className="text-xs font-mono ml-1">
                  {adjustments.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Belum ada penyesuaian stok.
              </p>
            ) : (
              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Jenis</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Alasan</TableHead>
                      {totalKerugian > 0 && <TableHead className="text-right">Kerugian</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAdjustments.map((adj) => (
                      <TableRow key={adj.id} className={
                        adj.jenis === "tambah"
                          ? ""
                          : ""
                      }>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(adj.created_at).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{adj.nama_produk}</p>
                          <p className="text-xs text-muted-foreground font-mono">{adj.sku}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          {adj.jenis === "tambah" ? (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                              <Plus className="h-3 w-3 mr-0.5" />
                              Tambah
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-300 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 text-xs">
                              <Minus className="h-3 w-3 mr-0.5" />
                              Kurang
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">{adj.jumlah}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={adj.alasan}>
                          {adj.alasan}
                        </TableCell>
                        {totalKerugian > 0 && (
                          <TableCell className="text-right text-xs tabular-nums text-amber-600 dark:text-amber-400">
                            {adj.nilai_kerugian ? formatRupiah(adj.nilai_kerugian) : "—"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {adjustments.length > 10 && (
              <div className="mt-3 text-center">
                <Link
                  href="/adjust-stok"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lihat semua penyesuaian ({adjustments.length}) →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Riwayat Retur Barang ── */}
      {goodsReturns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Riwayat Retur Barang
              <Badge variant="outline" className="text-xs font-mono ml-1">
                {goodsReturns.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>No. Retur</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pesanan Asal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-center">Item</TableHead>
                    <TableHead className="text-right">Total Refund</TableHead>
                    <TableHead>Alasan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goodsReturns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium text-orange-600 dark:text-orange-400">
                          {ret.nomor_retur}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ret.tanggal).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{ret.nomor_order}</TableCell>
                      <TableCell className="text-sm">{ret.customer_name}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">
                        {ret.total_item}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-destructive">
                        {formatRupiah(ret.total_refund)}
                      </TableCell>
                      <TableCell className="text-xs max-w-[140px] truncate" title={ret.alasan}>
                        {ret.alasan}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Laporan Penjualan Harian/Bulanan ── */}
      <div className="border-t border-border pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Laporan Penjualan
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis penjualan harian dan bulanan dengan filter tanggal
          </p>
        </div>
        <LaporanPenjualan orders={orders} />
      </div>

      <div className="border-t border-border pt-6">
        <ProfitLossSection orders={orders} stockAdjustments={adjustments} goodsReturns={goodsReturns} expenses={allExpenses} />
      </div>
    </div>
  );
}
