"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart, Clock, CheckCircle, DollarSign, Plus } from "lucide-react";
import { InventoryProduct, SalesRecord, addSalesRecord } from "@/app/actions";

interface OrdersClientProps {
  initialOrders: SalesRecord[];
  products: InventoryProduct[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function OrdersClient({ initialOrders, products }: OrdersClientProps) {
  const [orders, setOrders] = useState<SalesRecord[]>(initialOrders);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [seller, setSeller] = useState("");

  const totalRevenue = orders.reduce((sum, record) => sum + record.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const product = products.find((p) => p.sku === selectedSku);
    if (!product) {
      alert("Produk tidak ditemukan");
      setIsSubmitting(false);
      return;
    }

    const newOrder: Omit<SalesRecord, "id"> = {
      tanggal_penjualan: new Date().toISOString().split("T")[0],
      nama_produk: product.name,
      sku: product.sku,
      harga: product.price,
      quantity: quantity,
      total: product.price * quantity,
      seller: seller || "Manual Entry",
      email: "manual@entry.com",
    };

    const result = await addSalesRecord(newOrder);

    if (result.success && result.record) {
      setOrders([...orders, result.record]);
      setIsAddDialogOpen(false);
      
      // Reset form
      setSelectedSku("");
      setQuantity(1);
      setSeller("");
    } else {
      alert("Gagal menambahkan pesanan");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pesanan dari semua toko Shopee terhubung
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pesanan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pesanan Baru</DialogTitle>
              <DialogDescription>
                Masukkan detail pesanan secara manual ke dalam sistem.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produk</Label>
                <select
                  id="product"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Pilih Produk
                  </option>
                  {products.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} - {formatRupiah(p.price)} (Stok: {p.totalStock})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Kuantitas</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller">Penjual</Label>
                  <Input
                    id="seller"
                    placeholder="Nama Penjual"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {selectedSku && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium">Total Harga</p>
                  <p className="text-2xl font-bold">
                    {formatRupiah((products.find(p => p.sku === selectedSku)?.price || 0) * quantity)}
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Pesanan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Semua pesanan</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Berhasil dikirim</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Terjual</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {orders.reduce((sum, order) => sum + order.quantity, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Produk</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada pesanan
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik tombol Tambah Pesanan untuk mulai memasukkan data
              </p>
            </div>
          ) : (
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Penjual</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice().reverse().map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(record.tanggal_penjualan).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {record.sku}
                      </TableCell>
                      <TableCell className="font-medium">{record.nama_produk}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {record.seller}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{record.quantity}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatRupiah(record.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
