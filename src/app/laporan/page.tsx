import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, Store, TrendingUp } from "lucide-react";
import { getAppData, SalesRecord } from "@/app/actions";
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

function getTopSellingProducts(salesRecords: SalesRecord[]) {
  const totals = salesRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.nama_produk] = (acc[record.nama_produk] ?? 0) + record.quantity;
    return acc;
  }, {});

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
}

function getSellerPerformance(salesRecords: SalesRecord[]) {
  const totals = salesRecords.reduce<Record<string, { transactions: number; units: number; revenue: number }>>((acc, record) => {
    const current = acc[record.seller] ?? { transactions: 0, units: 0, revenue: 0 };
    current.transactions += 1;
    current.units += record.quantity;
    current.revenue += record.total;
    acc[record.seller] = current;
    return acc;
  }, {});

  return Object.entries(totals)
    .map(([seller, stats]) => ({ seller, ...stats }))
    .sort((a, b) => b.transactions - a.transactions || b.units - a.units || b.revenue - a.revenue);
}

export default async function LaporanPage() {
  const { inventoryProducts, salesRecords, sampleStoreCount } = await getAppData();
  
  const totalRevenue = salesRecords.reduce((sum, record) => sum + record.total, 0);
  const totalTransactions = salesRecords.length;
  const lowStockItems = inventoryProducts.filter((product) => product.totalStock > 0 && product.totalStock <= 10);
  const topSelling = getTopSellingProducts(salesRecords);
  const sellerPerformance = getSellerPerformance(salesRecords);
  const topSeller = sellerPerformance[0] ?? { seller: "-", transactions: 0, units: 0, revenue: 0 };

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
            <p className="text-2xl font-bold">{lowStockItems.length}</p>
            <p className="text-xs text-muted-foreground">Produk stok rendah</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total pendapatan penjualan</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Toko</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sampleStoreCount}</p>
            <p className="text-xs text-muted-foreground">Toko terhubung</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
              Status Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((product) => (
                  <div key={product.sku} className="rounded-lg border p-4">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Stok tersisa: {product.totalStock}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Semua produk memiliki stok aman.</p>
            )}
          </CardContent>
        </Card>
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
                  <TableHead>Tanggal</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Penjual</TableHead>
                  <TableHead className="text-right">Kuantitas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesRecords.slice().reverse().map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">{new Date(record.tanggal_penjualan).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{record.sku}</TableCell>
                    <TableCell className="font-medium">{record.nama_produk}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${record.seller === 'Faiz' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {record.seller}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{record.quantity}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatRupiah(record.total)}</TableCell>
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
