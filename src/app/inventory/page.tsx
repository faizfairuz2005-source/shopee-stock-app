"use client";

import { Edit, MoreHorizontal, Package, Plus, Trash2, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Data dummy untuk contoh
const dummyProducts = [
  {
    sku: "SKU-001",
    name: "Kaos Polos Premium Cotton",
    totalStock: 450,
    price: 89000,
    connectedStores: 3,
  },
  {
    sku: "SKU-002",
    name: "Celana Jeans Slim Fit",
    totalStock: 120,
    price: 249000,
    connectedStores: 1,
  },
  {
    sku: "SKU-003",
    name: "Jaket Hoodie Unisex",
    totalStock: 8,
    price: 175000,
    connectedStores: 4,
  },
  {
    sku: "SKU-004",
    name: "Sepatu Sneakers Classic",
    totalStock: 65,
    price: 399000,
    connectedStores: 0,
  },
  {
    sku: "SKU-005",
    name: "Tas Ransel Waterproof",
    totalStock: 3,
    price: 285000,
    connectedStores: 2,
  },
  {
    sku: "SKU-006",
    name: "Topi Baseball Cap",
    totalStock: 320,
    price: 55000,
    connectedStores: 4,
  },
];

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryPage() {
  const totalProducts = dummyProducts.length;
  const totalStock = dummyProducts.reduce((sum, p) => sum + p.totalStock, 0);
  const lowStockCount = dummyProducts.filter(
    (p) => p.totalStock <= LOW_STOCK_THRESHOLD
  ).length;

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stok Sentral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola dan pantau stok produk dari semua toko terhubung
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk Baru
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-3xl font-bold">{totalProducts}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Produk aktif di semua toko
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{totalStock}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unit tersedia di semua toko
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Stok Rendah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-3xl font-bold text-red-600">
                {lowStockCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Produk dengan stok ≤ {LOW_STOCK_THRESHOLD} unit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead className="text-right">Stok Total</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Toko Terhubung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyProducts.map((product) => (
                <TableRow key={product.sku}>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.totalStock <= LOW_STOCK_THRESHOLD && (
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.totalStock <= LOW_STOCK_THRESHOLD
                          ? "bg-red-100 text-red-700"
                          : product.totalStock <= 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.totalStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium ${
                        product.connectedStores > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.connectedStores} Toko
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
