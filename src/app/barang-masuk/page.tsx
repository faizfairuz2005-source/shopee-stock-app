"use client";

import {
  PackageOpen,
  Plus,
  Search,
  X,
  Trash2,
  Calendar,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  Receipt,
  ArrowDownToLine,
  Warehouse,
  Palette,
} from "lucide-react";
import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";

import {
  getAppData,
  saveGoodsReceipt,
  updateInventory,
  getCategories,
  getSuppliers,
  addSupplier,
  type InventoryProduct,
  type GoodsReceipt,
  type ProductCategory,
  type Supplier,
} from "@/app/actions";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/toast";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────

let idCounter = 0;
function nextId(): string {
  return `ri_${++idCounter}_${Date.now()}`;
}

// ─── Row Item Type ─────────────────────────────────────────────────────────

interface ReceiptFormItem {
  id: string; // temporary client-side id
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_beli: number;
  lokasiRak: string;
  catatan: string;
}

function formatReceiptNumber(id: number): string {
  return `GR-${String(id).padStart(6, "0")}`;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function BarangMasukPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formSupplier, setFormSupplier] = useState("");
  const [formFaktur, setFormFaktur] = useState("");
  const [formItems, setFormItems] = useState<ReceiptFormItem[]>([
    { id: nextId(), sku: "", nama_produk: "", quantity: 1, harga_beli: 0, lokasiRak: "", catatan: "" },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // New product modal state
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductDefaults, setNewProductDefaults] = useState({ name: "", sku: "" });
  const [pendingSelectRowId, setPendingSelectRowId] = useState<string | null>(null);

  // Search & dropdown state per row
  const [globalSearch, setGlobalSearch] = useState("");

  // Expanded receipt detail
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const [categories, setCategories] = useState<ProductCategory[]>([]);

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load data using getAppData() — same data source as Inventory page
  useEffect(() => {
    setIsLoading(true);
    getAppData().then((data) => {
      setProducts(data.inventoryProducts || []);
      setReceipts(data.goodsReceipts || []);
      setIsLoading(false);
    });
    getCategories().then((cats) => {
      setCategories(cats);
    });
    getSuppliers().then((suppliersData) => {
      setSuppliers(suppliersData);
    });
  }, []);

  // Handler to add a new product via JSON data.json
  const handleAddNewProduct = async (product: {
    name: string;
    sku: string;
    price: number;
    hpp?: number;
    description: string;
    kategori?: string;
  }) => {
    try {
      const data = await getAppData();
      const newProduct: InventoryProduct = {
        sku: product.sku,
        name: product.name,
        price: product.price,
        hpp: product.hpp,
        totalStock: 0,
        description: product.description,
        connectedStores: 0,
        sales: 0,
        kategori: product.kategori || undefined,
      };
      data.inventoryProducts.push(newProduct);
      const res = await updateInventory(data.inventoryProducts);
      if (res.success) {
        // Refresh products
        const fresh = await getAppData();
        setProducts(fresh.inventoryProducts || []);
        toast.success(`Produk "${product.name}" berhasil ditambahkan!`);
        // Auto-select this new product in the pending row
        if (pendingSelectRowId) {
          handleRowChange(pendingSelectRowId, "sku", product.sku);
          setPendingSelectRowId(null);
        }
        return true;
      } else {
        toast.error("Gagal menambahkan produk");
        return false;
      }
    } catch (err) {
      toast.error("Gagal menambahkan produk: " + (err instanceof Error ? err.message : "unknown error"));
      return false;
    }
  };

  // ─── Form handlers ─────────────────────────────────────────────────────

  const handleAddRow = () => {
    setFormItems((prev) => [
      ...prev,
      { id: nextId(), sku: "", nama_produk: "", quantity: 1, harga_beli: 0, lokasiRak: "", catatan: "" },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setFormItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRowChange = (id: string, field: keyof ReceiptFormItem, value: string | number) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If sku changes, auto-fill nama_produk, harga_beli, and lokasiRak from product catalog
        if (field === "sku") {
          const found = products.find((p) => p.sku === value);
          if (found) {
            updated.nama_produk = found.name;
            // Auto-fill lokasiRak if the product already has one
            if (found.lokasiRak) {
              updated.lokasiRak = found.lokasiRak;
            }
            // Default harga_beli: use hpp if available, otherwise 60% of selling price
            if (updated.harga_beli === 0) {
              updated.harga_beli = found.hpp || Math.round(found.price * 0.6);
            }
          } else {
            updated.nama_produk = "";
          }
        }
        return updated;
      })
    );
  };

  // Reset form
  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormSupplier("");
    setFormFaktur("");
    setFormItems([
      { id: nextId(), sku: "", nama_produk: "", quantity: 1, harga_beli: 0, lokasiRak: "", catatan: "" },
    ]);
  };

  // Handle save — uses JSON-based saveGoodsReceipt which updates stock in data.json
  const handleSave = async () => {
    // Validate
    if (!formSupplier.trim()) {
      toast.error("Nama supplier harus diisi");
      return;
    }
    const validItems = formItems.filter((i) => i.sku && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Minimal satu produk harus diisi dengan SKU dan jumlah");
      return;
    }

    setIsSaving(true);
    const result = await saveGoodsReceipt({
      tanggal: formDate,
      supplier: formSupplier.trim(),
      nomor_faktur: formFaktur.trim(),
      items: validItems.map((i) => ({
        sku: i.sku,
        nama_produk: i.nama_produk,
        quantity: i.quantity,
        harga_beli: i.harga_beli,
        lokasiRak: i.lokasiRak,
        catatan: i.catatan,
      })),
    });

    if (result.success) {
      toast.success(`Barang masuk dari ${formSupplier.trim()} berhasil disimpan!`);
      // Refresh data from same JSON source
      const fresh = await getAppData();
      setProducts(fresh.inventoryProducts || []);
      setReceipts(fresh.goodsReceipts || []);
      setShowForm(false);
      resetForm();
    } else {
      toast.error(result.error || "Gagal menyimpan barang masuk");
    }
    setIsSaving(false);
  };

  // ─── Compute stats ─────────────────────────────────────────────────────

  const totalReceipts = receipts.length;
  const totalItemsIn = receipts.reduce((s, r) => s + r.total_item, 0);
  const totalBiaya = receipts.reduce((s, r) => s + r.total_biaya, 0);

  // Filtered receipts for history
  const filteredReceipts = useMemo(() => {
    if (!globalSearch.trim()) return [...receipts].reverse();
    const q = globalSearch.toLowerCase();
    return receipts
      .filter(
        (r) =>
          r.supplier.toLowerCase().includes(q) ||
          r.nomor_faktur.toLowerCase().includes(q) ||
          r.items.some((i) => i.nama_produk.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      )
      .reverse();
  }, [receipts, globalSearch]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Barang Masuk", href: "/barang-masuk" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Barang Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat penerimaan barang dari supplier dan update stok otomatis
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Barang Masuk Baru
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={4} cols={5} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penerimaan</CardTitle>
                <PackageOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalReceipts}</p>
                <p className="text-xs text-muted-foreground">Transaksi barang masuk</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Item Masuk</CardTitle>
                <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalItemsIn.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Unit diterima dari supplier</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
                <Receipt className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(totalBiaya)}</p>
                <p className="text-xs text-muted-foreground">Total pembelian dari supplier</p>
              </CardContent>
            </Card>
          </div>

          {/* History Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riwayat Barang Masuk</CardTitle>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari supplier, faktur, atau produk..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredReceipts.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title="Belum ada barang masuk"
                  description={
                    globalSearch
                      ? `Tidak ada hasil untuk "${globalSearch}"`
                      : "Catat penerimaan barang dari supplier dengan klik tombol \"Barang Masuk Baru\""
                  }
                  action={
                    globalSearch ? (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setGlobalSearch("")}
                      >
                        <X className="h-4 w-4" />
                        Reset Filter
                      </Button>
                    ) : (
                      <Button className="gap-2" onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4" />
                        Barang Masuk Baru
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>No. Faktur</TableHead>
                        <TableHead className="text-right">Item</TableHead>
                        <TableHead className="text-right">Total Biaya</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => (
                        <React.Fragment key={receipt.id}>
                          <TableRow
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() =>
                              setExpandedReceiptId(
                                expandedReceiptId === String(receipt.id) ? null : String(receipt.id)
                              )
                            }
                          >
                            <TableCell className="text-muted-foreground">
                              {expandedReceiptId === String(receipt.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {formatReceiptNumber(receipt.id)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateShort(receipt.tanggal)}
                            </TableCell>
                            <TableCell className="font-medium">{receipt.supplier}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {receipt.nomor_faktur || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="text-xs font-medium">
                                {receipt.total_item} item
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-sm">
                              {formatRupiah(receipt.total_biaya)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedReceiptId(
                                    expandedReceiptId === String(receipt.id)
                                      ? null
                                      : String(receipt.id)
                                  );
                                }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                          {/* Expanded detail rows */}
                          {expandedReceiptId === String(receipt.id) &&
                            receipt.items.map((item, idx) => (
                              <TableRow key={`${receipt.id}-${idx}`} className="bg-muted/30">
                                <TableCell></TableCell>
                                <TableCell colSpan={2} className="py-2">
                                  <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                    {item.sku}
                                  </code>
                                </TableCell>
                                <TableCell colSpan={2} className="py-2">
                                  <span className="text-sm font-medium">{item.nama_produk}</span>
                                  {item.catatan && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      — {item.catatan}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                  <span className="text-sm font-medium tabular-nums">
                                    {item.quantity}x
                                  </span>
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                  <span className="text-sm tabular-nums">
                                    {formatRupiah(item.harga_beli * item.quantity)}
                                  </span>
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Form Modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-8 sm:pt-12 animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto rounded-2xl bg-card shadow-2xl ring-1 ring-border animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 backdrop-blur px-6 py-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <PackageOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Barang Masuk Baru</h2>
                  <p className="text-xs text-muted-foreground">
                    Catat penerimaan barang dari supplier
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-date" className="text-sm font-medium">
                    Tanggal <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="receipt-date"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="pl-9 border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-supplier" className="text-sm font-medium">
                    Supplier <span className="text-destructive">*</span>
                  </Label>
                  <SupplierCombobox
                    suppliers={suppliers}
                    selectedName={formSupplier}
                    onSelect={(name) => setFormSupplier(name)}
                    onAddNewSupplier={async (name) => {
                      const result = await addSupplier({ name });
                      if (result.success && result.supplier) {
                        setSuppliers((prev) => [result.supplier!, ...prev]);
                        setFormSupplier(result.supplier.name);
                        toast.success(`Supplier "${name}" berhasil ditambahkan!`);
                      } else {
                        toast.error(result.error || "Gagal menambahkan supplier");
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-faktur" className="text-sm font-medium">
                    No. Faktur
                  </Label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="receipt-faktur"
                      placeholder="Opsional"
                      value={formFaktur}
                      onChange={(e) => setFormFaktur(e.target.value)}
                      className="pl-9 border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                    />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Products Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Daftar Produk</h3>
                    <p className="text-xs text-muted-foreground">
                      Pilih produk dan masukkan jumlah & harga beli
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddRow}>
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Baris
                  </Button>
                </div>

                {/* Items Table */}
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Produk</TableHead>
                        <TableHead className="text-right min-w-[100px]">Jumlah</TableHead>
                        <TableHead className="text-right min-w-[130px]">Harga Beli/Unit</TableHead>
                        <TableHead className="min-w-[120px]">Lokasi Rak</TableHead>
                        <TableHead className="min-w-[100px]">Catatan</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formItems.map((item) => (
                        <TableRow key={item.id}>
                          {/* Product Select (combobox) */}
                          <TableCell className="py-2 min-w-[250px]">
                            <ProductCombobox
                              products={products}
                              selectedSku={item.sku}
                              selectedName={item.nama_produk}
                              onSelect={(sku, name) => {
                                handleRowChange(item.id, "sku", sku);
                                handleRowChange(item.id, "nama_produk", name);
                              }}
                              onAddNewProduct={(nameHint, skuHint) => {
                                setNewProductDefaults({ name: nameHint, sku: skuHint });
                                setPendingSelectRowId(item.id);
                                setShowNewProduct(true);
                              }}
                            />
                          </TableCell>
                          {/* Quantity */}
                          <TableCell className="py-2">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity || ""}
                              onChange={(e) =>
                                handleRowChange(item.id, "quantity", Math.max(1, Number(e.target.value)))
                              }
                              className="h-9 text-right tabular-nums border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                            />
                          </TableCell>
                          {/* Harga Beli */}
                          <TableCell className="py-2">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                Rp
                              </span>
                              <Input
                                type="number"
                                min={0}
                                value={item.harga_beli || ""}
                                onChange={(e) =>
                                  handleRowChange(item.id, "harga_beli", Number(e.target.value))
                                }
                                className="h-9 pl-8 text-right tabular-nums border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                              />
                            </div>
                          </TableCell>
                          {/* Lokasi Rak */}
                          <TableCell className="py-2">
                            <div className="relative">
                              <Warehouse className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={item.lokasiRak}
                                onChange={(e) => handleRowChange(item.id, "lokasiRak", e.target.value)}
                                placeholder="Contoh: Rak-A-01"
                                className="h-9 pl-8 text-xs border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                              />
                            </div>
                          </TableCell>
                          {/* Catatan */}
                          <TableCell className="py-2">
                            <Input
                              value={item.catatan}
                              onChange={(e) => handleRowChange(item.id, "catatan", e.target.value)}
                              placeholder="Opsional"
                              className="h-9 border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25"
                            />
                          </TableCell>
                          {/* Remove */}
                          <TableCell className="py-2">
                            <button
                              onClick={() => handleRemoveRow(item.id)}
                              disabled={formItems.length === 1}
                              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Row */}
                {formItems.some((i) => i.sku && i.quantity > 0) && (
                  <div className="mt-3 flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Total item:{" "}
                      <strong className="text-foreground">
                        {formItems.reduce((s, i) => s + (i.sku ? i.quantity : 0), 0)}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      Total biaya:{" "}
                      <strong className="text-foreground">
                        {formatRupiah(
                          formItems.reduce(
                            (s, i) => s + (i.sku ? i.harga_beli * i.quantity : 0),
                            0
                          )
                        )}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-muted-foreground"
              >
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[180px]">
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Barang Masuk
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── New Product Modal ─────────────────────────────────────── */}
      {showNewProduct && (
        <NewProductModal
          defaultName={newProductDefaults.name}
          defaultSku={newProductDefaults.sku}
          categories={categories}
          onSave={async (product) => {
            const ok = await handleAddNewProduct(product);
            if (ok) {
              setShowNewProduct(false);
            }
            return ok;
          }}
          onClose={() => {
            setShowNewProduct(false);
            setPendingSelectRowId(null);
          }}
        />
      )}
    </div>
  );
}

// ─── New Product Modal ────────────────────────────────────────────────────

function NewProductModal({
  defaultName,
  defaultSku,
  categories,
  onSave,
  onClose,
}: {
  defaultName: string;
  defaultSku: string;
  categories: ProductCategory[];
  onSave: (product: { name: string; sku: string; price: number; hpp?: number; description: string; kategori?: string }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const [sku, setSku] = useState(defaultSku || generateSkuHint(defaultName));
  const [price, setPrice] = useState(0);
  const [hpp, setHpp] = useState(0);
  const [description, setDescription] = useState("");
  const [kategori, setKategori] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!sku.trim()) return;
    if (price <= 0) return;

    setIsSaving(true);
    await onSave({
      name: name.trim(),
      sku: sku.trim().toUpperCase().replace(/\s+/g, "-"),
      price,
      hpp: hpp > 0 ? hpp : undefined,
      description: description.trim(),
      kategori: kategori || undefined,
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <PackageOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Tambah Barang Baru</h3>
              <p className="text-xs text-muted-foreground">
                Produk akan langsung tersedia di inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-name" className="text-sm font-medium">
              Nama Produk <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!defaultSku && !e.target.value.includes(sku)) {
                  setSku(generateSkuHint(e.target.value));
                }
              }}
              placeholder="Masukkan nama produk"
              autoFocus
              className="border-border/60 focus-visible:border-primary/70"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-sku" className="text-sm font-medium">
                SKU <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
                className="font-mono text-xs border-border/60 focus-visible:border-primary/70"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-price" className="text-sm font-medium">
                Harga Jual <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="new-price"
                  type="number"
                  min={0}
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0"
                  className="pl-8 text-right tabular-nums border-border/60 focus-visible:border-primary/70"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-hpp" className="text-sm font-medium">
              HPP (Harga Pokok Pembelian)
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                Rp
              </span>
              <Input
                id="new-hpp"
                type="number"
                min={0}
                value={hpp || ""}
                onChange={(e) => setHpp(Number(e.target.value))}
                placeholder="0 (opsional)"
                className="pl-8 text-right tabular-nums border-border/60 focus-visible:border-primary/70"
              />
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="new-kategori" className="text-sm font-medium">
              Kategori
            </Label>
            <div className="relative">
              <Palette className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="new-kategori"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25 appearance-none"
              >
                <option value="">— Pilih Kategori —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-desc" className="text-sm font-medium">
              Deskripsi
            </Label>
            <textarea
              id="new-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !name.trim() || !sku.trim() || price <= 0}
              className="flex-1 gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tambah Produk
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Combobox — searchable dropdown using shadcn/ui Command component
// Shows ALL products from Inventory/Stok Sentral (same data source)
// ═══════════════════════════════════════════════════════════════════════════

function ProductCombobox({
  products,
  selectedSku,
  selectedName,
  onSelect,
  onAddNewProduct,
}: {
  products: InventoryProduct[];
  selectedSku: string;
  selectedName: string;
  onSelect: (sku: string, name: string) => void;
  onAddNewProduct: (nameHint: string, skuHint: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = products.find((p) => p.sku === selectedSku);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products by search text (name or SKU)
  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const hasSearchText = search.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger input: shows selected product name or search text */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        {selected && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono">
              {selected.sku}
            </Badge>
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
              stok: {selected.totalStock}
            </span>
          </div>
        )}          <Input
          value={selected ? selected.name : search}
          onChange={(e) => {
            const val = e.target.value;
            // If there's a selected product and user types, clear the selection
            if (selectedSku && val !== selected?.name) {
              onSelect("", "");
            }
            setSearch(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari nama produk atau SKU..."
          className={`h-9 pl-8 pr-28 text-sm border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25 ${
            selected ? "bg-primary/5 border-primary/30" : ""
          }`}
          autoComplete="off"
        />
      </div>

      {/* Dropdown with Command */}
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari produk..."
              value={selected ? selected.name : search}
              onValueChange={(val) => {
                if (selectedSku) {
                  onSelect("", "");
                }
                setSearch(val);
              }}
              className="h-9"
            />
            <CommandList>
              {filtered.length === 0 && !hasSearchText && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Belum ada produk</p>
                  <button
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    onClick={() => {
                      onAddNewProduct("", "");
                      setIsOpen(false);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Barang Baru
                  </button>
                </div>
              )}
              {filtered.length === 0 && hasSearchText && (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-muted-foreground">Tidak ditemukan</p>
                    <button
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => {
                        onAddNewProduct(search, generateSkuHint(search));
                        setIsOpen(false);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah &ldquo;{search}&rdquo; sebagai barang baru
                    </button>
                  </div>
                </CommandEmpty>
              )}
              {filtered.length > 0 && (
                <CommandGroup heading={`${filtered.length} produk ditemukan`}>
                  {filtered.slice(0, 50).map((p) => (
                    <CommandItem
                      key={p.sku}
                      value={p.sku}
                      onSelect={(value) => {
                        onSelect(value, p.name);
                        setSearch(p.name);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{p.totalStock} stok</span>
                        <Badge
                          variant={
                            p.totalStock === 0
                              ? "destructive"
                              : p.totalStock <= 10
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {p.totalStock}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {hasSearchText && filtered.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => {
                      onAddNewProduct(search, generateSkuHint(search));
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-2 py-2 text-primary"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/5 shrink-0">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        Tambah &ldquo;{search}&rdquo; sebagai barang baru
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Buat produk baru di inventory
                      </p>
                    </div>
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

// ─── Generate SKU hint from product name ──────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// Supplier Combobox — searchable dropdown using shadcn/ui Command component
// ═══════════════════════════════════════════════════════════════════════════

function SupplierCombobox({
  suppliers,
  selectedName,
  onSelect,
  onAddNewSupplier,
}: {
  suppliers: Supplier[];
  selectedName: string;
  onSelect: (name: string) => void;
  onAddNewSupplier: (name: string) => Promise<void>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = suppliers.find((s) => s.name === selectedName);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suppliers by name
  const filtered = suppliers.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q);
  });

  const hasSearchText = search.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={selected ? selected.name : search}
          onChange={(e) => {
            const val = e.target.value;
            if (selectedName && val !== selected?.name) {
              onSelect("");
            }
            setSearch(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari atau ketik nama supplier..."
          className={`h-10 pl-9 text-sm border-border/60 focus-visible:border-primary/70 focus-visible:ring-primary/25 ${
            selected ? "bg-primary/5 border-primary/30" : ""
          }`}
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Cari supplier..."
              value={selected ? selected.name : search}
              onValueChange={(val) => {
                if (selectedName) {
                  onSelect("");
                }
                setSearch(val);
              }}
              className="h-9"
            />
            <CommandList>
              {filtered.length === 0 && !hasSearchText && (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Belum ada supplier</p>
                  <button
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    onClick={() => {
                      onAddNewSupplier("");
                      setIsOpen(false);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Supplier Baru
                  </button>
                </div>
              )}
              {filtered.length === 0 && hasSearchText && (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-muted-foreground">Tidak ditemukan</p>
                    <button
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      onClick={() => {
                        onAddNewSupplier(search);
                        setIsOpen(false);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah &ldquo;{search}&rdquo; sebagai supplier baru
                    </button>
                  </div>
                </CommandEmpty>
              )}
              {filtered.length > 0 && (
                <CommandGroup heading={`${filtered.length} supplier ditemukan`}>
                  {filtered.slice(0, 50).map((s) => (
                    <CommandItem
                      key={s.id}
                      value={s.name}
                      onSelect={(value) => {
                        onSelect(value);
                        setSearch(s.name);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-2 py-2"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{s.name}</p>
                        {s.contact_person && (
                          <p className="text-xs text-muted-foreground">{s.contact_person}</p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {hasSearchText && filtered.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => {
                      onAddNewSupplier(search);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-2 py-2 text-primary"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/5 shrink-0">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        Tambah &ldquo;{search}&rdquo; sebagai supplier baru
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Buat supplier baru di sistem
                      </p>
                    </div>
                  </CommandItem>
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}

// ─── Generate SKU hint from product name ──────────────────────────────────

function generateSkuHint(name: string): string {
  // Remove special chars, uppercase, take first 3-4 chars of each word
  const words = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "SKU-" + Date.now().toString().slice(-4);
  const prefix = words
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join("-");
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}


