"use client";

import { Edit, MoreHorizontal, Package, Plus, Search, TrendingDown, Store, X, Eye, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StockFilter = "semua" | "aman" | "rendah" | "habis";

interface Product {
  sku: string;
  name: string;
  price: number;
  totalStock: number;
  description?: string;
  connectedStores: number;
}

const initialDummyProducts: Product[] = [
  { sku: "SKU-001", name: "Kaos Polos Premium Cotton", totalStock: 450, price: 89000, description: "Kaos berkualitas tinggi dari bahan cotton 100%", connectedStores: 3 },
  { sku: "SKU-002", name: "Celana Jeans Slim Fit", totalStock: 0, price: 249000, description: "Celana jeans dengan potongan modern dan nyaman", connectedStores: 1 },
  { sku: "SKU-003", name: "Jaket Hoodie Unisex", totalStock: 5, price: 175000, description: "Hoodie hangat dengan desain minimalis", connectedStores: 4 },
  { sku: "SKU-004", name: "Sepatu Sneakers Classic", totalStock: 65, price: 399000, description: "Sneakers klasik dengan sol empuk", connectedStores: 0 },
  { sku: "SKU-005", name: "Tas Ransel Waterproof", totalStock: 0, price: 285000, description: "Tas ransel tahan air untuk outdoor", connectedStores: 2 },
  { sku: "SKU-006", name: "Topi Baseball Cap", totalStock: 320, price: 55000, description: "Topi baseball dengan desain trendy", connectedStores: 4 },
  { sku: "SKU-007", name: "Sweater Rajut Winter", totalStock: 8, price: 195000, description: "Sweater rajut hangat untuk musim dingin", connectedStores: 2 },
  { sku: "SKU-008", name: "Kemeja Flannel Kotak", totalStock: 50, price: 135000, description: "Kemeja flannel dengan motif kotak klasik", connectedStores: 3 },
];

const STOCK_FILTERS: { key: StockFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aman", label: "Stok Aman" },
  { key: "rendah", label: "Stok Rendah" },
  { key: "habis", label: "Stok Habis" },
];

function getStockStatus(stock: number): "aman" | "rendah" | "habis" {
  if (stock === 0) return "habis";
  if (stock <= 10) return "rendah";
  return "aman";
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(initialDummyProducts);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("semua");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sku: string; name: string } | null>(null);
  const [detailView, setDetailView] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(product.totalStock);
    const matchStock =
      stockFilter === "semua" ||
      (stockFilter === "aman" && status === "aman") ||
      (stockFilter === "rendah" && status === "rendah") ||
      (stockFilter === "habis" && status === "habis");
    return matchSearch && matchStock;
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.totalStock, 0);
  const lowStockCount = products.filter((p) => p.totalStock > 0 && p.totalStock <= 10).length;
  const uniqueStores = products.reduce((max, p) => Math.max(max, p.connectedStores), 0);

  // Toast notification effect
  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Handle Edit Product
  const handleEditClick = (product: Product) => {
    setEditForm(product);
    setIsEditOpen(true);
  };

  // Handle Save Changes
  const handleSaveChanges = () => {
    if (!editForm) return;

    // Update products array
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.sku === editForm.sku ? editForm : p))
    );

    // Show toast and close modal
    setToastMessage("Produk berhasil diupdate");
    setIsEditOpen(false);
    setEditForm(null);
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setIsEditOpen(false);
    setEditForm(null);
  };

  // Handle Delete Click
  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({ sku: product.sku, name: product.name });
  };

  // Handle Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    // Remove product from list
    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.sku !== deleteConfirm.sku)
    );

    // Show toast and close confirmation
    setToastMessage(`Produk "${deleteConfirm.name}" berhasil dihapus`);
    setDeleteConfirm(null);
  };

  // Handle View Detail
  const handleViewDetail = (product: Product) => {
    setDetailView(product);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stok Sentral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola dan pantau stok produk dari semua toko terhubung
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4 transition-transform duration-200 ease-out group-hover/button:scale-110" />
          Tambah Produk
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalProducts}</p>
            <p className="text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stok</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalStock.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
            <p className="text-xs text-muted-foreground">Perlu restok</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toko Terhubung</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueStores}</p>
            <p className="text-xs text-muted-foreground">Toko aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-[color,transform,opacity] duration-200 ease-out peer-focus-visible:text-primary" />
              <Input
                placeholder="Cari nama produk atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="peer border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/85 focus-visible:border-primary/70 focus-visible:ring-primary/25"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STOCK_FILTERS.map((f) => (
                <Badge
                  key={f.key}
                  variant={stockFilter === f.key ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs font-medium transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out hover:scale-105 hover:shadow-sm active:scale-[0.98]"
                  onClick={() => setStockFilter(f.key)}
                >
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Table / Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
              <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada produk yang sesuai
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Toko</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product.totalStock);
                  return (
                    <TableRow key={product.sku} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {status !== "aman" && (
                            <span className={`h-2 w-2 shrink-0 rounded-full transition-transform duration-200 ease-out group-hover:scale-125 ${status === "habis" ? "bg-destructive" : "bg-amber-500"}`} />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-transform duration-200 ease-out group-hover:scale-105 ${
                            status === "habis"
                              ? "bg-destructive/10 text-destructive"
                              : status === "rendah"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          }`}
                        >
                          {product.totalStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatRupiah(product.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.connectedStores > 0 ? (
                          <span className="text-xs font-medium">{product.connectedStores} toko</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleEditClick(product)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Produk
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleViewDetail(product)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus Produk
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed right-6 top-5 z-[70] rounded-lg border px-4 py-2 text-sm shadow-lg transition-all duration-200 ease-out border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300`}
        >
          {toastMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Hapus Produk?</h2>
                <p className="text-sm text-muted-foreground">
                  Anda yakin ingin menghapus produk <span className="font-medium">{deleteConfirm.name}</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="flex-1"
                >
                  Hapus Produk
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {detailView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold">Detail Produk</h2>
              <button
                onClick={() => setDetailView(null)}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 px-6 py-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">SKU</p>
                <p className="mt-1 text-sm font-medium">{detailView.sku}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Nama Produk</p>
                <p className="mt-1 text-sm font-medium">{detailView.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Harga</p>
                <p className="mt-1 text-sm font-medium">{formatRupiah(detailView.price)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Stok Total</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{detailView.totalStock} unit</span>
                  <Badge
                    variant={
                      getStockStatus(detailView.totalStock) === "habis"
                        ? "destructive"
                        : getStockStatus(detailView.totalStock) === "rendah"
                        ? "secondary"
                        : "default"
                    }
                  >
                    {getStockStatus(detailView.totalStock) === "habis"
                      ? "Habis"
                      : getStockStatus(detailView.totalStock) === "rendah"
                      ? "Rendah"
                      : "Aman"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Toko Terhubung</p>
                <p className="mt-1 text-sm font-medium">{detailView.connectedStores} toko</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Deskripsi</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailView.description || "-"}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDetailView(null)}
                className="flex-1"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  handleEditClick(detailView);
                  setDetailView(null);
                }}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold">Edit Produk</h2>
              <button
                onClick={handleCancelEdit}
                className="rounded-md p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Nama Produk */}
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-sm font-medium">
                  Nama Produk
                </Label>
                <Input
                  id="product-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Masukkan nama produk"
                  className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                />
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="product-sku" className="text-sm font-medium">
                  SKU
                </Label>
                <Input
                  id="product-sku"
                  value={editForm.sku}
                  onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                  placeholder="Masukkan SKU"
                  className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                />
              </div>

              {/* Harga */}
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-sm font-medium">
                  Harga
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  placeholder="Masukkan harga"
                  className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                />
              </div>

              {/* Stok Total */}
              <div className="space-y-2">
                <Label htmlFor="product-stock" className="text-sm font-medium">
                  Stok Total
                </Label>
                <Input
                  id="product-stock"
                  type="number"
                  value={editForm.totalStock}
                  onChange={(e) => setEditForm({ ...editForm, totalStock: Number(e.target.value) })}
                  placeholder="Masukkan stok total"
                  className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="product-description" className="text-sm font-medium">
                  Deskripsi
                </Label>
                <textarea
                  id="product-description"
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Masukkan deskripsi produk"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 border-t border-border px-6 py-4">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveChanges}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
