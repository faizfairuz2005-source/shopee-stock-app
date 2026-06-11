"use client";

import { Edit, MoreHorizontal, Package, Plus, Search, TrendingDown, Store, X, Eye, Trash2, AlertCircle, Warehouse, Layers, Palette, ArrowRight, Check, History, ShoppingCart, PackageOpen, RotateCcw, ArrowRightLeft, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Can } from "@/components/can";
import { usePermission } from "@/lib/use-permission";
import { ExportButton } from "@/components/export-button";
import { INVENTORY_EXPORT_COLUMNS } from "@/lib/export-utils";

import { getAppData, updateInventory, getCategories, addCategory, updateCategory, deleteCategory, getRacks, addRack, updateRack, deleteRack, getProductHistory, getItemKits, addItemKit, updateItemKit, deleteItemKit, type ProductHistoryEntry, type KitComponent, type ItemKit, InventoryProduct as Product, ProductCategory, ProductRack } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
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



const STOCK_FILTERS: { key: StockFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aman", label: "Stok Aman" },
  { key: "rendah", label: "Stok Rendah" },
  { key: "habis", label: "Stok Habis" },
];

function getStockStatus(stock: number, minStok?: number): "aman" | "rendah" | "habis" {
  if (stock === 0) return "habis";
  if (stock <= (minStok ?? 10)) return "rendah";
  return "aman";
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function InventoryPage() {
  usePermission();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("semua");
  const [rakFilter, setRakFilter] = useState<string | null>(null);
  const [groupByRak, setGroupByRak] = useState(false);

  // Rak state
  const [racks, setRacks] = useState<ProductRack[]>([]);
  const [showRakModal, setShowRakModal] = useState(false);

  // Pindah Rak dialog
  const [pindahRakProduct, setPindahRakProduct] = useState<Product | null>(null);
  const [pindahRakTarget, setPindahRakTarget] = useState("");
  const [showBulkMoveDialog, setShowBulkMoveDialog] = useState(false);
  const [bulkMoveTarget, setBulkMoveTarget] = useState("");

  // Checkbox selection for bulk operations
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  // Kategori state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [kategoriFilter, setKategoriFilter] = useState<string | null>(null);
  const [groupByKategori, setGroupByKategori] = useState(false);
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Read filter from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const filterParam = params.get("filter");
      if (filterParam && ["semua", "aman", "rendah", "habis"].includes(filterParam)) {
        setStockFilter(filterParam as StockFilter);
      }
    }
  }, []);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sku: string; name: string } | null>(null);
  const [detailView, setDetailView] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "riwayat">("info");
  const [productHistory, setProductHistory] = useState<ProductHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Tab state
  const [tab, setTab] = useState<"products" | "kits">("products");
  const [kits, setKits] = useState<ItemKit[]>([]);
  const [isLoadingKits, setIsLoadingKits] = useState(false);
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ItemKit | null>(null);

  // Load products from data.json on mount
  useEffect(() => {
    getAppData().then((data) => {
      setProducts(data.inventoryProducts || []);
      setIsLoading(false);
    });
    getCategories().then((cats) => {
      setCategories(cats);
    });
    getRacks().then((r) => setRacks(r));
    getItemKits().then((k) => setKits(k));
  }, []);

  // Extract unique rak locations
  const uniqueRakLocations = useMemo(() => {
    const raks = new Set<string>();
    products.forEach(p => { if (p.lokasiRak) raks.add(p.lokasiRak); });
    return Array.from(raks).sort();
  }, [products]);

  // Extract unique categories from both products and master data
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.kategori) cats.add(p.kategori); });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      (product.barcode || "").toLowerCase().includes(search.toLowerCase()) ||
      (product.lokasiRak || "").toLowerCase().includes(search.toLowerCase()) ||
      (product.kategori || "").toLowerCase().includes(search.toLowerCase());
    const status = getStockStatus(product.totalStock, product.minStok);
    const matchStock =
      stockFilter === "semua" ||
      (stockFilter === "aman" && status === "aman") ||
      (stockFilter === "rendah" && status === "rendah") ||
      (stockFilter === "habis" && status === "habis");
    const matchRak = !rakFilter || product.lokasiRak === rakFilter;
    const matchKategori = !kategoriFilter || product.kategori === kategoriFilter;
    return matchSearch && matchStock && matchRak && matchKategori;
  }).sort((a, b) => {
    if (a.totalStock === 0 && b.totalStock !== 0) return -1;
    if (a.totalStock !== 0 && b.totalStock === 0) return 1;
    return 0;
  });

  // Group products by kategori if groupByKategori is enabled
  const groupedByKategori = useMemo(() => {
    if (!groupByKategori) return null;
    const groups: Record<string, Product[]> = {
      "Tanpa Kategori": [],
    };
    for (const p of filteredProducts) {
      const key = p.kategori || "Tanpa Kategori";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Tanpa Kategori") return 1;
      if (b === "Tanpa Kategori") return -1;
      return a.localeCompare(b);
    });
  }, [filteredProducts, groupByKategori]);

  // Group products by lokasi rak if groupByRak is enabled
  const groupedProducts = useMemo(() => {
    if (!groupByRak) return null;
    const groups: Record<string, Product[]> = {
      "Tanpa Rak": [],
    };
    for (const p of filteredProducts) {
      const key = p.lokasiRak || "Tanpa Rak";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === "Tanpa Rak") return 1;
      if (b === "Tanpa Rak") return -1;
      return a.localeCompare(b);
    });
  }, [filteredProducts, groupByRak]);

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + p.totalStock, 0);
  const lowStockCount = products.filter((p) => p.totalStock > 0 && p.totalStock <= (p.minStok ?? 10)).length;
  const outOfStockCount = products.filter((p) => p.totalStock === 0).length;
  const uniqueStores = products.reduce((max, p) => Math.max(max, p.connectedStores), 0);

  // Handle Edit Product
  const handleEditClick = (product: Product) => {
    setEditForm(product);
    setIsEditOpen(true);
  };

  // Handle Save Changes
  const handleSaveChanges = async () => {
    if (!editForm) return;

    // Update products array locally first for fast feedback
    const updated = products.map((p) => (p.sku === editForm.sku ? editForm : p));
    setProducts(updated);

    // Save to server
    const res = await updateInventory(updated);
    if (res.success) {
      toast.success("Produk berhasil diupdate");
    } else {
      toast.error("Gagal menyimpan perubahan");
    }

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
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    // Remove product from list locally
    const updated = products.filter((p) => p.sku !== deleteConfirm.sku);
    setProducts(updated);

    // Save to server
    const res = await updateInventory(updated);
      if (res.success) {
        toast.success(`Produk "${deleteConfirm.name}" berhasil dihapus`);
      } else {
        toast.error("Gagal menghapus produk");
      }
      
      setDeleteConfirm(null);
  };

  // Handle View Detail
  const handleViewDetail = (product: Product) => {
    setDetailView(product);
    setDetailTab("info");
    setProductHistory([]);
  };

  // Handle Load History
  const handleLoadHistory = async (product: Product) => {
    setDetailTab("riwayat");
    if (productHistory.length > 0) return;
    setIsLoadingHistory(true);
    const history = await getProductHistory(product.sku);
    setProductHistory(history);
    setIsLoadingHistory(false);
  };

  // Handle Pindah Rak (single product)
  const handlePindahRak = async (targetRak: string) => {
    if (!pindahRakProduct || !targetRak.trim()) return;
    const target = targetRak.trim();
    const updated = products.map((p) =>
      p.sku === pindahRakProduct.sku ? { ...p, lokasiRak: target } : p
    );
    setProducts(updated);
    const res = await updateInventory(updated);
    if (res.success) {
      toast.success(`Produk dipindahkan ke ${target}`);
    } else {
      toast.error("Gagal memindahkan produk");
    }
    setPindahRakProduct(null);
  };

  // Handle Pindah Rak Massal
  const handleBulkMoveRak = async (targetRak: string) => {
    if (selectedSkus.size === 0 || !targetRak.trim()) return;
    const target = targetRak.trim();
    const updated = products.map((p) =>
      selectedSkus.has(p.sku) ? { ...p, lokasiRak: target } : p
    );
    setProducts(updated);
    const res = await updateInventory(updated);
    if (res.success) {
      toast.success(`${selectedSkus.size} produk dipindahkan ke ${bulkMoveTarget.trim()}`);
      setSelectedSkus(new Set());
    } else {
      toast.error("Gagal memindahkan produk");
    }
    setShowBulkMoveDialog(false);
    setBulkMoveTarget("");
  };

  // Clear selected products
  const clearSelection = () => setSelectedSkus(new Set());

    return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Inventory", href: "/inventory" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-primary/[0.04] via-background to-background shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Stok Sentral</h1>
                  <p className="text-sm text-muted-foreground">
                    Kelola dan pantau stok produk dari semua toko terhubung
                  </p>
                </div>
              </div>
              {/* Quick stats chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium shadow-sm">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Produk:</span>
                  <span>{totalProducts}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-medium shadow-sm">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Stok:</span>
                  <span>{totalStock.toLocaleString("id-ID")}</span>
                </div>
                {lowStockCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-1 text-xs font-medium shadow-sm">
                    <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">{lowStockCount} rendah</span>
                  </div>
                )}
                {outOfStockCount > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-3 py-1 text-xs font-medium shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">{outOfStockCount} habis</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ExportButton
                data={products as unknown as Record<string, unknown>[]}
                columns={INVENTORY_EXPORT_COLUMNS}
                filenamePrefix="Inventory"
                label="Export"
              />
              <Can permission="inventory.edit" fallback={null}>
                <Button className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </Button>
              </Can>
            </div>
          </div>
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setTab("products")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
            tab === "products"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="mr-1.5 h-4 w-4 inline-block" />
          Produk
          {tab === "products" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setTab("kits")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
            tab === "kits"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="mr-1.5 h-4 w-4 inline-block" />
          Paket Barang
          {tab === "kits" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} cols={6} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content (shown when not loading) */}
      {!isLoading && (
        <>
      {tab === "products" && (
        <>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Total Produk</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{totalProducts}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk aktif dalam inventori</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Total Stok</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{totalStock.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-xs text-muted-foreground">Unit tersedia di semua rak</p>
        </div>
        <div className={"rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 " + (lowStockCount > 0 ? 1 : 2)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stok Rendah</span>
            <div className={"flex h-8 w-8 items-center justify-center rounded-lg " + (lowStockCount > 0 ? 1 : 2)}>
              <TrendingDown className={"h-4 w-4 " + (lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
            </div>
          </div>
          <p className={"text-3xl font-bold tracking-tight " + (lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "")}>{lowStockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk perlu restok segera</p>
        </div>
        <div className={"rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 " + (outOfStockCount > 0 ? 1 : 2)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Stok Habis</span>
            <div className={"flex h-8 w-8 items-center justify-center rounded-lg " + (outOfStockCount > 0 ? 1 : 2)}>
              <AlertCircle className={"h-4 w-4 " + (outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")} />
            </div>
          </div>
          <p className={"text-3xl font-bold tracking-tight " + (outOfStockCount > 0 ? "text-red-600 dark:text-red-400" : "")}>{outOfStockCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Produk kosong tanpa stok</p>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
                    <div className="flex items-center justify-between">
            <CardTitle>Daftar Produk</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredProducts.length} dari {totalProducts} produk
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama produk, SKU, atau lokasi rak..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Stock filter badges */}
              {STOCK_FILTERS.map((f) => (
                <Badge
                  key={f.key}
                  variant={stockFilter === f.key ? "default" : "outline"}
                  className="cursor-pointer px-3 py-1 text-xs font-medium"
                  onClick={() => setStockFilter(f.key)}
                >
                  {f.label}
                </Badge>
              ))}
              {/* Rak filter badges */}
              {uniqueRakLocations.length > 0 && (
                <>
                  <span className="mx-1 h-4 w-px bg-border" />
                  {uniqueRakLocations.map((rak) => (
                    <Badge
                      key={rak}
                      variant={rakFilter === rak ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1 text-xs font-medium ${
                        rakFilter === rak ? "" : "border-primary/30 text-primary/70"
                      }`}
                      onClick={() => setRakFilter(rakFilter === rak ? null : rak)}
                    >
                      <Warehouse className="mr-1 h-3 w-3" />
                      {rak}
                    </Badge>
                  ))}
                  {(rakFilter || groupByRak) && (
                    <button
                      onClick={() => { setRakFilter(null); setGroupByRak(false); }}
                      className="ml-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Reset rak filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {/* Kelola Rak button */}
                  <button
                    onClick={() => setShowRakModal(true)}
                    className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Kelola Rak"
                  >
                    <Warehouse className="h-3 w-3" />
                    Kelola
                  </button>
                </>
              )}
            </div>
          </div>              {/* Category filter badges */}
              {uniqueCategories.length > 0 && categories.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mx-1 h-4 w-px bg-border" />
                  {uniqueCategories.slice(0, 8).map((cat) => {
                    const catColor = categories.find(c => c.name === cat)?.color || '#6B7280';
                    const isActive = kategoriFilter === cat;
                    return (
                      <Badge
                        key={cat}
                        variant={isActive ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1 text-xs font-medium transition-all ${
                          isActive ? "ring-1 ring-offset-1" : "border-primary/30 text-primary/70 hover:border-primary/60"
                        }`}
                        style={isActive ? { backgroundColor: catColor, borderColor: catColor } : {}}
                        onClick={() => setKategoriFilter(kategoriFilter === cat ? null : cat)}
                      >
                        <span className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: catColor }} />
                        {cat}
                      </Badge>
                    );
                  })}
                  {uniqueCategories.length > 8 && (
                    <Badge variant="outline" className="px-2 py-1 text-xs text-muted-foreground border-dashed">
                      +{uniqueCategories.length - 8} lainnya
                    </Badge>
                  )}
                  {/* Kelola Kategori button */}
                  <button
                    onClick={() => setShowKategoriModal(true)}
                    className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Kelola Kategori"
                  >
                    <Palette className="h-3 w-3" />
                    Kelola
                  </button>
                </div>
              )}

          <div className="border-t border-border/50 pt-3 mt-1">
          {/* Group toggles */}
          <div className="flex items-center justify-end gap-2">
            {uniqueCategories.length > 0 && (
              <button
                onClick={() => setGroupByKategori(!groupByKategori)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  groupByKategori
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Palette className="h-3.5 w-3.5" />
                {groupByKategori ? "Grouped by Kategori" : "Group by Kategori"}
              </button>
            )}
            <button
              onClick={() => setGroupByRak(!groupByRak)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                groupByRak
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              {groupByRak ? "Grouped by Rak" : "Group by Rak"}
            </button>
          </div>
          </div>

          {/* Table / Empty State */}
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Tidak ada produk ditemukan"
              description={
                search
                  ? `Tidak ada produk yang cocok dengan "${search}". Coba kata kunci lain.`
                  : stockFilter !== "semua"
                  ? `Tidak ada produk dengan status "${stockFilter}". Coba filter lain.`
                  : "Belum ada produk yang ditambahkan ke dalam inventori."
              }
              action={
                (search || stockFilter !== "semua") ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSearch("");
                      setStockFilter("semua");
                    }}
                  >
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="table-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {filteredProducts.length > 0 && (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                        checked={selectedSkus.size === filteredProducts.length}
                        onChange={() => {
                          if (selectedSkus.size === filteredProducts.length) {
                            setSelectedSkus(new Set());
                          } else {
                            setSelectedSkus(new Set(filteredProducts.map(p => p.sku)));
                          }
                        }}
                      />
                    )}
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Lokasi Rak</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Toko</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {groupedByKategori ? (
                    // ── Grouped by Kategori ──
                    groupedByKategori.map(([kategori, items]) => (
                      <>
                        <TableRow className="bg-muted/40 dark:bg-muted/10">
                          <TableCell colSpan={9} className="py-2">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{kategori}</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {items.length} produk
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      {items.map((product) => {
                        const status = getStockStatus(product.totalStock, product.minStok);
                        const isSelected = selectedSkus.has(product.sku);
                        return (
                          <TableRow 
                            key={product.sku} 
                            className={`${status === "habis" ? "bg-destructive/5 dark:bg-destructive/10" : status === "rendah" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                          >
                            <TableCell className="w-10 py-3.5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedSkus);
                                  if (next.has(product.sku)) {
                                    next.delete(product.sku);
                                  } else {
                                    next.add(product.sku);
                                  }
                                  setSelectedSkus(next);
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                              {product.sku}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                              {product.barcode || <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Nama Produk">
                              <div className="flex items-center gap-2">
                                {status !== "aman" && (
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${status === "habis" ? "bg-destructive" : "bg-warning"}`} />
                                )}
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Kategori">
                              <KategoriBadge kategori={product.kategori} categories={categories} />
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Lokasi Rak">
                              <LokasiRakBadge rak={product.lokasiRak} />
                            </TableCell>
                            <TableCell className="py-3.5 text-right" data-label="Stok">
                              {status === "habis" ? (
                                <Badge variant="destructive" className="text-xs">
                                  Habis
                                </Badge>
                              ) : (
                                <span className={`text-sm font-medium ${
                                  status === "rendah" ? "text-warning" : ""
                                }`}>
                                  {product.totalStock}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 text-right font-medium tabular-nums text-sm" data-label="Harga">
                              {formatRupiah(product.price)}
                            </TableCell>
                            <TableCell className="py-3.5 text-right text-sm" data-label="Toko">
                              {product.connectedStores > 0 ? (
                                <span className="text-muted-foreground">{product.connectedStores} toko</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 text-right" data-label="Aksi">
                              <DropdownMenu>
                                <DropdownMenuTrigger 
                                  render={
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={() => handleEditClick(product)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Produk
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setPindahRakProduct(product);
                                      setPindahRakTarget(product.lokasiRak || "");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Pindah Rak
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetail(product)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Detail
                                  </DropdownMenuItem>

                                  <Can permission="inventory.delete" fallback={null}>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(product)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus Produk
                                    </DropdownMenuItem>
                                  </Can>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ))
                ) : groupedProducts ? (
                  // ── Grouped by Rak ──
                  groupedProducts.map(([rak, items]) => (
                    <>
                      <TableRow className="bg-muted/40 dark:bg-muted/10">
                        <TableCell colSpan={10} className="py-2">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{rak}</span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {items.length} produk
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                      {items.map((product) => {
                        const status = getStockStatus(product.totalStock, product.minStok);
                        const isSelected = selectedSkus.has(product.sku);
                        return (
                          <TableRow 
                            key={product.sku} 
                            className={`${status === "habis" ? "bg-destructive/5 dark:bg-destructive/10" : status === "rendah" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                          >
                            <TableCell className="w-10 py-3.5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedSkus);
                                  if (next.has(product.sku)) {
                                    next.delete(product.sku);
                                  } else {
                                    next.add(product.sku);
                                  }
                                  setSelectedSkus(next);
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                              {product.sku}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                              {product.barcode || <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Nama Produk">
                              <div className="flex items-center gap-2">
                                {status !== "aman" && (
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${status === "habis" ? "bg-destructive" : "bg-warning"}`} />
                                )}
                                <span className="font-medium">{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Kategori">
                              <KategoriBadge kategori={product.kategori} categories={categories} />
                            </TableCell>
                            <TableCell className="py-3.5" data-label="Lokasi Rak">
                              <LokasiRakBadge rak={product.lokasiRak} />
                            </TableCell>
                            <TableCell className="py-3.5 text-right" data-label="Stok">
                              {status === "habis" ? (
                                <Badge variant="destructive" className="text-xs">
                                  Habis
                                </Badge>
                              ) : (
                                <span className={`text-sm font-medium ${
                                  status === "rendah" ? "text-warning" : ""
                                }`}>
                                  {product.totalStock}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 text-right font-medium tabular-nums text-sm" data-label="Harga">
                              {formatRupiah(product.price)}
                            </TableCell>
                            <TableCell className="py-3.5 text-right text-sm" data-label="Toko">
                              {product.connectedStores > 0 ? (
                                <span className="text-muted-foreground">{product.connectedStores} toko</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 text-right" data-label="Aksi">
                              <DropdownMenu>
                                <DropdownMenuTrigger 
                                  render={
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={() => handleEditClick(product)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Produk
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setPindahRakProduct(product);
                                      setPindahRakTarget(product.lokasiRak || "");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Pindah Rak
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetail(product)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Detail
                                  </DropdownMenuItem>

                                  <Can permission="inventory.delete" fallback={null}>
                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteClick(product)}
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Hapus Produk
                                    </DropdownMenuItem>
                                  </Can>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ))
                ) : (
                  // ── Normal Flat List ──
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product.totalStock, product.minStok);
                    const isSelected = selectedSkus.has(product.sku);
                    return (
                      <TableRow 
                        key={product.sku} 
                        className={`${status === "habis" ? "bg-destructive/5 dark:bg-destructive/10" : status === "rendah" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                      >
                        <TableCell className="w-10 py-3.5" data-label="Pilih">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                            checked={isSelected}
                            onChange={() => {
                              const next = new Set(selectedSkus);
                              if (next.has(product.sku)) {
                                next.delete(product.sku);
                              } else {
                                next.add(product.sku);
                              }
                              setSelectedSkus(next);
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-3.5 font-mono text-xs text-muted-foreground" data-label="SKU">
                          {product.sku}
                        </TableCell>
                        <TableCell className="py-3.5 font-mono text-xs text-muted-foreground" data-label="Barcode">
                          {product.barcode || <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-2">
                            {status !== "aman" && (
                              <span className={`h-2 w-2 shrink-0 rounded-full ${status === "habis" ? "bg-destructive" : "bg-warning"}`} />
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <KategoriBadge kategori={product.kategori} categories={categories} />
                        </TableCell>
                        <TableCell className="py-3.5">
                          <LokasiRakBadge rak={product.lokasiRak} />
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          {status === "habis" ? (
                            <Badge variant="destructive" className="text-xs">
                              Habis
                            </Badge>
                          ) : (
                            <span className={`text-sm font-medium ${
                              status === "rendah" ? "text-warning" : ""
                            }`}>
                              {product.totalStock}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 text-right font-medium tabular-nums text-sm">
                          {formatRupiah(product.price)}
                        </TableCell>
                        <TableCell className="py-3.5 text-right text-sm">
                          {product.connectedStores > 0 ? (
                            <span className="text-muted-foreground">{product.connectedStores} toko</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger 
                              render={
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              }
                            />
                            
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

                              <Can permission="inventory.delete" fallback={null}>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(product)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus Produk
                                </DropdownMenuItem>
                              </Can>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Move Bar */}
      {selectedSkus.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg animate-in slide-in-from-bottom">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium">
                {selectedSkus.size} produk dipilih
              </p>
              <button
                onClick={clearSelection}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Batal pilih
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setBulkMoveTarget("");
                  setShowBulkMoveDialog(true);
                }}
              >
                <Warehouse className="h-4 w-4" />
                Pindah Rak
              </Button>
            </div>
          </div>
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
          <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
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

            {/* Tab Navigation */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => setDetailTab("info")}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  detailTab === "info"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Info Produk
                </div>
                {detailTab === "info" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => handleLoadHistory(detailView)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  detailTab === "riwayat"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat Transaksi
                </div>
                {detailTab === "riwayat" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            {detailTab === "info" ? (
              /* Info Tab */
              <div className="space-y-4 px-6 py-4 max-h-[50vh] overflow-y-auto">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">SKU</p>
                    <p className="mt-1 text-sm font-medium">{detailView.sku}</p>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Barcode</p>
                    <p className="mt-1 text-sm font-mono">{detailView.barcode || <span className="text-muted-foreground/60">—</span>}</p>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Nama Produk</p>
                  <p className="mt-1 text-sm font-medium">{detailView.name}</p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Kategori</p>
                  <div className="mt-1">
                    <KategoriBadge kategori={detailView.kategori} categories={categories} />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Lokasi Rak</p>
                  <div className="mt-1">
                    <LokasiRakBadge rak={detailView.lokasiRak} />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Harga</p>
                  <p className="mt-1 text-sm font-medium">{formatRupiah(detailView.price)}</p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">HPP</p>
                  <p className="mt-1 text-sm font-medium">{detailView.hpp ? formatRupiah(detailView.hpp) : "-"}</p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Stok Total</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{detailView.totalStock} unit</span>
                    <Badge
                      variant={
                        getStockStatus(detailView.totalStock, detailView.minStok) === "habis"
                          ? "destructive"
                          : getStockStatus(detailView.totalStock, detailView.minStok) === "rendah"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {getStockStatus(detailView.totalStock, detailView.minStok) === "habis"
                        ? "Habis"
                        : getStockStatus(detailView.totalStock, detailView.minStok) === "rendah"
                        ? "Rendah"
                        : "Aman"}
                    </Badge>
                  </div>
                  {detailView.minStok !== undefined && detailView.minStok !== 10 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Batas peringatan: ≤ {detailView.minStok} unit
                    </p>
                  )}
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Toko Terhubung</p>
                  <p className="mt-1 text-sm font-medium">{detailView.connectedStores} toko</p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Penjualan</p>
                  <p className="mt-1 text-sm font-medium">{detailView.sales || 0} terjual</p>
                </div>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Deskripsi</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {detailView.description || "-"}
                  </p>
                </div>
              </div>
            ) : (
              /* Riwayat Tab */
              <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="space-y-4 py-4">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="flex items-start gap-3 animate-pulse">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productHistory.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada riwayat transaksi untuk produk ini.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-border">
                    {productHistory.map((entry, idx) => (
                      <div key={entry.id || idx} className="relative pb-5 last:pb-0">
                        {/* Timeline dot */}
                        <span
                          className={`absolute -left-[19px] top-1 h-[14px] w-[14px] rounded-full border-2 ${
                            entry.tipe === "penjualan"
                              ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40"
                              : entry.tipe === "barang_masuk"
                              ? "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40"
                              : entry.tipe === "penyesuaian_stok"
                              ? "border-amber-500 bg-amber-100 dark:bg-amber-900/40"
                              : entry.tipe === "transfer_rak"
                              ? "border-purple-500 bg-purple-100 dark:bg-purple-900/40"
                              : "border-rose-500 bg-rose-100 dark:bg-rose-900/40"
                          }`}
                        />
                        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {entry.tipe === "penjualan" && <ShoppingCart className="h-4 w-4 text-blue-500" />}
                              {entry.tipe === "barang_masuk" && <PackageOpen className="h-4 w-4 text-emerald-500" />}
                              {entry.tipe === "penyesuaian_stok" && <TrendingUp className="h-4 w-4 text-amber-500" />}
                              {entry.tipe === "transfer_rak" && <ArrowRightLeft className="h-4 w-4 text-purple-500" />}
                              {entry.tipe === "retur" && <RotateCcw className="h-4 w-4 text-rose-500" />}
                              <span className="text-sm font-medium">
                                {entry.tipe === "penjualan" && "Penjualan"}
                                {entry.tipe === "barang_masuk" && "Barang Masuk"}
                                {entry.tipe === "penyesuaian_stok" && "Penyesuaian Stok"}
                                {entry.tipe === "transfer_rak" && "Transfer Rak"}
                                {entry.tipe === "retur" && "Retur"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{entry.tanggal}</span>
                          </div>
                          <div className="space-y-0.5">
                            {entry.kuantitas !== 0 && (
                              <p className="text-xs text-muted-foreground">
                                Kuantitas: <span className={entry.kuantitas > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                                  {entry.kuantitas > 0 ? `+${entry.kuantitas}` : entry.kuantitas}
                                </span>
                                {entry.stok_setelah !== undefined && (
                                  <> → Stok akhir: <span className="font-medium">{entry.stok_setelah}</span></>
                                )}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">{entry.referensi}</span>
                              {entry.detail && <> — {entry.detail}</>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="product-barcode" className="text-sm font-medium">
                  Barcode
                </Label>
                <Input
                  id="product-barcode"
                  value={editForm.barcode || ""}
                  onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value || undefined })}
                  placeholder="Contoh: 8992809100012"
                  className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Barcode produk (EAN-13 atau kode lain). Akan terdeteksi otomatis saat scan di POS.
                </p>
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

              {/* Kategori */}
              <div className="space-y-2">
                <Label htmlFor="product-kategori" className="text-sm font-medium">
                  Kategori
                </Label>
                <div className="relative">
                  <Palette className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="product-kategori"
                    value={editForm.kategori || ""}
                    onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value || undefined })}
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25 appearance-none"
                  >
                    <option value="">— Pilih Kategori —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lokasi Rak */}
              <div className="space-y-2">
                <Label htmlFor="product-rak" className="text-sm font-medium">
                  Lokasi Rak
                </Label>
                <div className="relative">
                  <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="product-rak"
                    list="rak-suggestions"
                    value={editForm.lokasiRak || ""}
                    onChange={(e) => setEditForm({ ...editForm, lokasiRak: e.target.value })}
                    placeholder="Contoh: Rak-A-01"
                    className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                  />
                  <datalist id="rak-suggestions">
                    {uniqueRakLocations.map((rak) => (
                      <option key={rak} value={rak} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gunakan format: Rak-{`{Zona}`}-{`{Nomor}`} (contoh: Rak-A-01)
                </p>
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

       )}</>
        )}
        {tab === "kits" && (
          <>
      {/* Kits Grid */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Paket Barang (Item Kits)</h2>
          <p className="text-sm text-muted-foreground">Gabungkan beberapa produk menjadi satu paket</p>
        </div>
        <Can permission="inventory.edit" fallback={null}>
          <Button onClick={() => { setEditingKit(null); setKitModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Paket Baru
          </Button>
        </Can>
      </div>
      {isLoadingKits ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="py-12 text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Belum ada paket barang.</p>
          <Can permission="inventory.edit" fallback={null}>
            <Button variant="outline" className="mt-3 gap-2" onClick={() => { setEditingKit(null); setKitModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              Buat Paket Barang
            </Button>
          </Can>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => {
            const minStok = (() => {
              if (!kit.components || kit.components.length === 0) return Infinity;
              let min = Infinity;
              for (const comp of kit.components) {
                const product = products.find(p => p.sku === comp.sku);
                const stock = product ? product.totalStock : 0;
                const available = comp.quantity > 0 ? Math.floor(stock / comp.quantity) : Infinity;
                if (available < min) min = available;
              }
              return min;
            })();
            const totalModal = kit.components.reduce((sum, c) => {
              const p = products.find(pr => pr.sku === c.sku);
              return sum + (p ? p.hpp || 0 : 0) * c.quantity;
            }, 0);
            const marginPercent = totalModal > 0 ? ((kit.price - totalModal) / totalModal * 100) : 0;
            return (
              <Card key={kit.id} className="card-hover overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{kit.name}</CardTitle>
                      <p className="text-lg font-bold text-primary mt-1">{formatRupiah(kit.price)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => { setEditingKit(kit); setKitModalOpen(true); }} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={async () => {
                          if (!confirm(`Hapus paket "${kit.name}"?`)) return;
                          const res = await deleteItemKit(kit.id);
                          if (res.success) {
                            setKits(prev => prev.filter(k => k.id !== kit.id));
                            toast.success(`Paket "${kit.name}" dihapus`);
                          } else {
                            toast.error(res.error || "Gagal menghapus paket");
                          }
                        }} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Komponen</p>
                    {kit.components.map((comp) => {
                      const product = products.find(p => p.sku === comp.sku);
                      const stock = product ? product.totalStock : 0;
                      return (
                        <div key={comp.sku} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{comp.quantity}x</span> {comp.name}
                          </span>
                          <Badge variant={stock === 0 ? "destructive" : stock > 0 && stock <= (product?.minStok ?? 10) ? "secondary" : "outline"} className="text-xs font-mono">
                            {stock}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Stok tersedia</span>
                    <Badge variant={minStok === Infinity ? "outline" : minStok <= 0 ? "destructive" : minStok <= 10 ? "secondary" : "default"}>
                      {minStok === Infinity ? "—" : minStok + " paket"}
                    </Badge>
                  </div>
                  {totalModal > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Margin</span>
                      <span className={"text-xs font-medium " + (marginPercent >= 30 ? "text-emerald-600" : marginPercent >= 15 ? "text-amber-600" : "text-red-600")}>
                        {marginPercent.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
          </>
        )}
      </>
    )}

    {/* Pindah Rak Dialog (single product) */}
    {pindahRakProduct && (
      <PindahRakDialog
        product={pindahRakProduct}
        racks={racks}
        currentRak={pindahRakProduct.lokasiRak || ""}
        onClose={() => { setPindahRakProduct(null); setPindahRakTarget(""); }}
        onConfirm={(target) => {
          handlePindahRak(target);
        }}
      />
    )}

    {/* Bulk Move Dialog */}
    {showBulkMoveDialog && (
      <BulkMoveDialog
        count={selectedSkus.size}
        racks={racks}
        onClose={() => { setShowBulkMoveDialog(false); setBulkMoveTarget(""); }}
        onConfirm={(target) => {
          handleBulkMoveRak(target);
        }}
      />
    )}

    {/* Rak Manager Modal */}
    <RackManagerModal
      isOpen={showRakModal}
      onClose={() => setShowRakModal(false)}
      racks={racks}
      onSave={() => getRacks().then((r) => setRacks(r))}
    />

    <KategoriManagerModal
      isOpen={showKategoriModal}
      onClose={() => setShowKategoriModal(false)}
      categories={categories}
      onSave={() => getCategories().then((cats) => setCategories(cats))}
    />

    <KitManagerModal
      isOpen={kitModalOpen}
      onClose={() => { setKitModalOpen(false); setEditingKit(null); }}
      products={products}
      editingKit={editingKit}
      onSave={() => getItemKits().then((k) => setKits(k))}
    />
    </div>
  );
}

// ─── Pindah Rak Dialog ─────────────────────────────────────────────────

function PindahRakDialog({
  product,
  racks,
  currentRak,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  racks: ProductRack[];
  currentRak: string;
  onClose: () => void;
  onConfirm: (targetRak: string) => void;
}) {
  const [target, setTarget] = useState(currentRak);

  useEffect(() => {
    setTarget(currentRak);
  }, [currentRak]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Pindah Rak</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Rak Saat Ini</p>
            <LokasiRakBadge rak={currentRak || "-"} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Pindah ke Rak</Label>
            <div className="relative">
              <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                list="pindah-rak-suggestions"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Cari atau ketik nama rak..."
                className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
              />
              <datalist id="pindah-rak-suggestions">
                {racks.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
            </div>
            <p className="text-xs text-muted-foreground">
              {racks.length > 0
                ? `Rak tersedia: ${racks.map(r => r.name).join(", ")}`
                : "Belum ada rak terdaftar. Ketik nama rak baru atau kelola rak dari tombol Kelola Rak."}
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button
            onClick={() => onConfirm(target)}
            disabled={!target.trim() || target === currentRak}
            className="flex-1 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Pindahkan
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Move Dialog ──────────────────────────────────────────────────

function BulkMoveDialog({
  count,
  racks,
  onClose,
  onConfirm,
}: {
  count: number;
  racks: ProductRack[];
  onClose: () => void;
  onConfirm: (targetRak: string) => void;
}) {
  const [target, setTarget] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Warehouse className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Pindah Rak Massal</h3>
              <p className="text-xs text-muted-foreground">{count} produk akan dipindahkan</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pindahkan ke Rak</Label>
            <div className="relative">
              <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                list="bulk-rak-suggestions"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Cari atau ketik nama rak..."
                className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
              />
              <datalist id="bulk-rak-suggestions">
                {racks.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              Semua produk yang dipilih akan dipindahkan ke rak yang sama.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button
            onClick={() => onConfirm(target)}
            disabled={!target.trim()}
            className="flex-1 gap-2"
          >
            <Warehouse className="h-4 w-4" />
            Pindahkan {count} Produk
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── RackManagerModal Component ─────────────────────────────────────────

function RackManagerModal({
  isOpen,
  onClose,
  racks,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  racks: ProductRack[];
  onSave: () => void;
}) {
  const [items, setItems] = useState<ProductRack[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newName, setNewName] = useState("");
  const [newZone, setNewZone] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems([...racks]);
    }
  }, [isOpen, racks]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    const res = await addRack({ name: newName.trim(), zone: newZone.trim() || "A", description: newDesc.trim() || undefined });
    if (res.success) {
      setItems(prev => [...prev, res.rack!]);
      setNewName("");
      setNewZone("");
      setNewDesc("");
      onSave();
      toast.success(`Rak "${newName.trim()}" ditambahkan`);
    } else {
      toast.error(res.error || "Gagal menambahkan rak");
    }
    setIsSaving(false);
  };

  const handleUpdate = async (rack: ProductRack) => {
    setIsSaving(true);
    const res = await updateRack(rack);
    if (res.success) {
      setItems(prev => prev.map(r => r.id === rack.id ? rack : r));
      setEditingId(null);
      onSave();
      toast.success(`Rak "${rack.name}" diupdate`);
    } else {
      toast.error(res.error || "Gagal mengupdate rak");
    }
    setIsSaving(false);
  };

  const handleDelete = async (rack: ProductRack) => {
    if (!confirm(`Hapus rak "${rack.name}"? Produk di rak ini akan dihapus lokasi raknya.`)) return;
    setIsSaving(true);
    const res = await deleteRack(rack.id);
    if (res.success) {
      setItems(prev => prev.filter(r => r.id !== rack.id));
      onSave();
      toast.success(`Rak "${rack.name}" dihapus`);
    } else {
      toast.error(res.error || "Gagal menghapus rak");
    }
    setIsSaving(false);
  };

  const zonePresets = ["A", "B", "C", "D", "E"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Warehouse className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Kelola Rak</h3>
              <p className="text-xs text-muted-foreground">{items.length} rak</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Add New Rack */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground">Tambah Rak Baru</p>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama rak (contoh: Rak-F-01)"
                className="flex-1 h-9 text-sm border-border/60"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || isSaving} className="h-9 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Zona</p>
                <div className="flex gap-1">
                  {zonePresets.map(z => (
                    <button
                      key={z}
                      className={`h-7 w-7 rounded-md text-xs font-bold border transition-all ${newZone === z ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                      onClick={() => setNewZone(z)}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-[2]">
                <p className="text-xs text-muted-foreground mb-1">Deskripsi (opsional)</p>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Misal: Rak depan dekat kasir"
                  className="flex h-7 w-full rounded-md border border-border/60 bg-background px-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70"
                />
              </div>
            </div>
          </div>

          {/* Rack List */}
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <Warehouse className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada rak. Buat rak pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((rack) => {
                const zone = rack.zone || "";
                const zoneColors: Record<string, string> = {
                  A: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  B: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  C: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  D: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                  E: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                };
                const zoneColor = zoneColors[zone] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

                return (
                  <div
                    key={rack.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                  >
                    {editingId === rack.id ? (
                      <>
                        <div className="flex-1 space-y-1.5">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdate({ ...rack, name: editName, zone: editZone, description: editDesc || undefined });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <div className="flex gap-2">
                            <div className="flex gap-1">
                              {zonePresets.map(z => (
                                <button
                                  key={z}
                                  className={`h-5 w-5 rounded text-[10px] font-bold border ${editZone === z ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                                  onClick={() => setEditZone(z)}
                                >
                                  {z}
                                </button>
                              ))}
                            </div>
                            <input
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Deskripsi"
                              className="flex-1 h-5 rounded border border-border/60 bg-background px-1.5 text-[10px] placeholder:text-muted-foreground focus-visible:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="xs" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2">
                            Batal
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleUpdate({ ...rack, name: editName, zone: editZone, description: editDesc || undefined })}
                            disabled={!editName.trim() || isSaving}
                            className="h-7 px-2"
                          >
                            Simpan
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-[10px] font-bold ${zoneColor}`}>
                          {rack.zone || "-"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{rack.name}</p>
                          {rack.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{rack.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            className="text-muted-foreground hover:text-foreground p-1"
                            onClick={() => {
                              setEditingId(rack.id);
                              setEditName(rack.name);
                              setEditZone(rack.zone);
                              setEditDesc(rack.description || "");
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-red-500 p-1"
                            onClick={() => handleDelete(rack)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── LokasiRakBadge Component ────────────────────────────────────────────

function LokasiRakBadge({ rak }: { rak?: string }) {
  if (!rak) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // Extract zone letter from rak location (e.g., "Rak-A-01" → "A")
  const zone = rak.match(/[A-Z]/)?.[0] || "";

  const zoneColors: Record<string, string> = {
    A: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    B: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    C: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    D: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    E: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  const colorClass = zoneColors[zone] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      <Warehouse className="h-3 w-3" />
      {rak}
    </span>
  );
}

// ─── KategoriBadge Component ─────────────────────────────────────────────

function KategoriBadge({ kategori, categories }: { kategori?: string; categories: ProductCategory[] }) {
  if (!kategori) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const cat = categories.find(c => c.name === kategori);
  const color = cat?.color || '#6B7280';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {kategori}
    </span>
  );
}

// ─── Kelola Kategori Modal ─────────────────────────────────────────────

function KategoriManagerModal({
  isOpen,
  onClose,
  categories,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onSave: () => void;
}) {
  const [items, setItems] = useState<ProductCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3B82F6");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems([...categories]);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setIsSaving(true);
    const res = await addCategory({ name: newName.trim(), color: newColor });
    if (res.success) {
      setItems(prev => [...prev, res.category!]);
      setNewName("");
      setNewColor("#3B82F6");
      onSave();
      toast.success(`Kategori "${newName.trim()}" ditambahkan`);
    } else {
      toast.error(res.error || "Gagal menambahkan kategori");
    }
    setIsSaving(false);
  };

  const handleUpdate = async (cat: ProductCategory) => {
    setIsSaving(true);
    const res = await updateCategory(cat);
    if (res.success) {
      setItems(prev => prev.map(c => c.id === cat.id ? cat : c));
      setEditingId(null);
      onSave();
      toast.success(`Kategori "${cat.name}" diupdate`);
    } else {
      toast.error(res.error || "Gagal mengupdate kategori");
    }
    setIsSaving(false);
  };

  const handleDelete = async (cat: ProductCategory) => {
    if (!confirm(`Hapus kategori "${cat.name}"? Kategori akan dihapus dari semua produk.`)) return;
    setIsSaving(true);
    const res = await deleteCategory(cat.id);
    if (res.success) {
      setItems(prev => prev.filter(c => c.id !== cat.id));
      onSave();
      toast.success(`Kategori "${cat.name}" dihapus`);
    } else {
      toast.error(res.error || "Gagal menghapus kategori");
    }
    setIsSaving(false);
  };

  const presetColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Kelola Kategori</h3>
              <p className="text-xs text-muted-foreground">{items.length} kategori</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Add New Category */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground">Tambah Kategori Baru</p>
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama kategori"
                className="flex-1 h-9 text-sm border-border/60"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || isSaving} className="h-9 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presetColors.map(c => (
                <button
                  key={c}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${newColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Category List */}
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Belum ada kategori. Buat kategori pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors group"
                >
                  {editingId === cat.id ? (
                    <>
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate({ ...cat, name: editName, color: editColor });
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {presetColors.map(c => (
                            <button
                              key={c}
                              className={`h-4 w-4 rounded-full border ${editColor === c ? 'border-foreground ring-1 ring-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="xs" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2">
                          Batal
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => handleUpdate({ ...cat, name: editName, color: editColor })}
                          disabled={!editName.trim() || isSaving}
                          className="h-7 px-2"
                        >
                          Simpan
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          className="text-muted-foreground hover:text-foreground p-1"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                            setEditColor(cat.color);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-red-500 p-1"
                          onClick={() => handleDelete(cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}



// ─── KitManagerModal Component ──────────────────────────────────────────

function KitManagerModal({
  isOpen,
  onClose,
  products,
  editingKit,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  kits: ItemKit[];
  editingKit: ItemKit | null;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<KitComponent[]>([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingKit) {
        setName(editingKit.name);
        setPrice(editingKit.price);
        setDescription(editingKit.description || "");
        setComponents(editingKit.components || []);
      } else {
        setName("");
        setPrice(0);
        setDescription("");
        setComponents([]);
      }
      setSelectedSku("");
      setSelectedQty(1);
    }
  }, [isOpen, editingKit]);

  if (!isOpen) return null;

  const handleAddComponent = () => {
    if (!selectedSku) return;
    const product = products.find(p => p.sku === selectedSku);
    if (!product) return;
    if (components.some(c => c.sku === selectedSku)) {
      toast.error("Produk sudah ada di komponen paket");
      return;
    }
    setComponents(prev => [...prev, { sku: selectedSku, name: product.name, quantity: selectedQty }]);
    setSelectedSku("");
    setSelectedQty(1);
  };

  const handleRemoveComponent = (sku: string) => {
    setComponents(prev => prev.filter(c => c.sku !== sku));
    if (selectedSku === sku) setSelectedSku("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama paket harus diisi");
      return;
    }
    if (components.length === 0) {
      toast.error("Tambahkan minimal 1 produk ke paket");
      return;
    }
    setIsSaving(true);
    if (editingKit) {
      const res = await updateItemKit({
        id: editingKit.id,
        name: name.trim(),
        price,
        description: description || "",
        components,
        created_at: editingKit.created_at,
        updated_at: editingKit.updated_at,
      });
      if (res.success) {
        toast.success("Paket berhasil diupdate");
        onSave();
        onClose();
      } else {
        toast.error(res.error || "Gagal mengupdate paket");
      }
    } else {
      const res = await addItemKit({
        name: name.trim(),
        price,
        description: description || "",
        components,
      });
      if (res.success) {
        toast.success("Paket berhasil ditambahkan");
        onSave();
        onClose();
      } else {
        toast.error(res.error || "Gagal menambahkan paket");
      }
    }
    setIsSaving(false);
  };

  const availableProducts = products.filter(
    p => !components.some(c => c.sku === p.sku)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">{editingKit ? "Edit Paket Barang" : "Tambah Paket Barang"}</h3>
              <p className="text-xs text-muted-foreground">{editingKit ? "Ubah komponen dan harga paket" : "Gabungkan beberapa produk menjadi satu paket"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto space-y-4">
          {/* Nama Paket */}
          <div className="space-y-2">
            <Label htmlFor="kit-name" className="text-sm font-medium">Nama Paket</Label>
            <Input
              id="kit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Paket Seragam Lengkap"
              className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
            />
          </div>

          {/* Harga Paket */}
          <div className="space-y-2">
            <Label htmlFor="kit-price" className="text-sm font-medium">Harga Paket</Label>
            <Input
              id="kit-price"
              type="number"
              value={price || ""}
              onChange={e => setPrice(Number(e.target.value))}
              placeholder="Masukkan harga paket"
              className="border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="kit-desc" className="text-sm font-medium">Deskripsi (opsional)</Label>
            <textarea
              id="kit-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Deskripsi paket..."
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
            />
          </div>

          {/* Add Component */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/20">
            <p className="text-xs font-medium text-muted-foreground">Tambah Produk ke Paket</p>
            <div className="flex gap-2">
              <select
                value={selectedSku}
                onChange={e => setSelectedSku(e.target.value)}
                className="flex-1 h-9 rounded-md border border-border/60 bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70"
              >
                <option value="">— Pilih Produk —</option>
                {availableProducts.map(p => (
                  <option key={p.sku} value={p.sku}>{p.name} (Stok: {p.totalStock})</option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                value={selectedQty}
                onChange={e => setSelectedQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 h-9 text-center"
              />
              <Button size="sm" onClick={handleAddComponent} disabled={!selectedSku} className="h-9 shrink-0 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </Button>
            </div>
            {availableProducts.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Semua produk sudah ditambahkan ke paket.</p>
            )}
          </div>

          {/* Component List */}
          {components.length === 0 ? (
            <div className="py-4 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada produk. Pilih produk di atas.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Komponen Paket</p>
                <span className="text-xs text-muted-foreground">{components.length} produk</span>
              </div>
              {components.map((comp) => {
                const product = products.find(p => p.sku === comp.sku);
                const stock = product ? product.totalStock : 0;
                const canMake = comp.quantity > 0 ? Math.floor(stock / comp.quantity) : 0;
                return (
                  <div key={comp.sku} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{comp.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">x{comp.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">Stok: {stock}</span>
                        {stock === 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Habis</Badge>
                        ) : canMake <= 3 ? (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Sisa {canMake}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveComponent(comp.sku)}
                      className="text-muted-foreground hover:text-red-500 p-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {components.length > 0 && (
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Kuantitas</span>
                <span className="font-medium">{components.reduce((sum, c) => sum + c.quantity, 0)} unit</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Komponen Unik</span>
                <span className="font-medium">{components.length} produk</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border px-5 py-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button onClick={handleSave} disabled={!name.trim() || components.length === 0 || isSaving} className="flex-1 gap-2">
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Menyimpan...
              </>
            ) : editingKit ? (
              <>Simpan Perubahan</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Tambah Paket
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
