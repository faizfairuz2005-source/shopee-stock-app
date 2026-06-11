"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Package,
  History,
  CheckCircle2,
  X,
  ArrowUpDown,
  User,
  Calendar,
} from "lucide-react";
import {
  getAppData,
  getStockAdjustments,
  saveStockAdjustment,
  type InventoryProduct,
  type StockAdjustment,
  type StockAdjustmentInput,
} from "@/app/actions";
import { usePermission } from "@/lib/use-permission";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

// ─── Preset alasan ─────────────────────────────────────────────────────────

const ALASAN_PRESETS = [
  "Stok opname",
  "Barang rusak",
  "Barang hilang",
  "Koreksi stok",
  "Barang retur",
  "Bonus supplier",
  "Kesalahan input",
  "Lainnya",
] as const;

// ─── Main Component ────────────────────────────────────────────────────────

export default function AdjustStokPage() {
  usePermission();

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [jenis, setJenis] = useState<"tambah" | "kurangi">("tambah");
  const [jumlah, setJumlah] = useState("");
  const [alasan, setAlasan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [customAlasan, setCustomAlasan] = useState("");
  const [nilaiKerugian, setNilaiKerugian] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);

  // History filter
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    Promise.all([
      getAppData().then((data) => setProducts(data.inventoryProducts || [])),
      getStockAdjustments().then((res) => {
        if (res.success) setAdjustments(res.adjustments);
      }),
    ]).finally(() => setIsLoading(false));
  }, []);

  // ── Search products ──────────────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [products, searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProduct = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
    setIsSearchOpen(false);
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setJumlah("");
  };

  // ── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    const numJumlah = parseInt(jumlah);
    if (!numJumlah || numJumlah <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    if (jenis === "kurangi" && numJumlah > selectedProduct.totalStock) {
      toast.error(`Stok tidak mencukupi. Stok saat ini: ${selectedProduct.totalStock}`);
      return;
    }
    const alasanFinal = alasan === "Lainnya" ? customAlasan.trim() : alasan;
    if (!alasanFinal) {
      toast.error("Alasan penyesuaian wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      let nilaiKerugianNum = parseInt(nilaiKerugian);
      // Auto-calculate loss from HPP if user didn't enter a manual value
      if (
        jenis === "kurangi" &&
        (alasanFinal === "Barang rusak" || alasanFinal === "Barang hilang") &&
        (!nilaiKerugianNum || nilaiKerugianNum <= 0)
      ) {
        nilaiKerugianNum = (selectedProduct.hpp || 0) * numJumlah;
      }
      const input: StockAdjustmentInput = {
        sku: selectedProduct.sku,
        jenis,
        jumlah: numJumlah,
        alasan: alasanFinal,
        catatan: catatan || undefined,
        nilai_kerugian: nilaiKerugianNum > 0 ? nilaiKerugianNum : undefined,
      };

      const result = await saveStockAdjustment(input);

      if (result.success && result.adjustment) {
        toast.success(
          `Stok ${jenis === "tambah" ? "ditambah" : "dikurangi"} ${numJumlah} unit untuk "${selectedProduct.name}"`
        );
        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.sku === selectedProduct.sku
              ? { ...p, totalStock: result.adjustment!.stok_sesudah }
              : p
          )
        );
        setAdjustments((prev) => [result.adjustment!, ...prev]);
        // Reset form
        clearProduct();
        setJenis("tambah");
        setAlasan("");
        setCatatan("");
        setCustomAlasan("");
        setNilaiKerugian("");
        setShowConfirm(false);
      } else {
        toast.error(result.error || "Gagal menyimpan penyesuaian");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered history ─────────────────────────────────────────────────

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return adjustments;
    const q = historySearch.toLowerCase();
    return adjustments.filter(
      (a) =>
        a.nama_produk.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.alasan.toLowerCase().includes(q) ||
        a.catatan?.toLowerCase().includes(q)
    );
  }, [adjustments, historySearch]);

  // ── Stok setelah perubahan (untuk preview) ─────────────────────────

  const previewStokSesudah = useMemo(() => {
    if (!selectedProduct) return null;
    const num = parseInt(jumlah);
    if (!num || num <= 0) return selectedProduct.totalStock;
    return jenis === "tambah"
      ? selectedProduct.totalStock + num
      : selectedProduct.totalStock - num;
  }, [selectedProduct, jumlah, jenis]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Inventory", href: "/inventory" },
          { name: "Adjust Stok", href: "/adjust-stok" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Adjust Stok</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Menu khusus untuk penyesuaian stok manual (stok opname, koreksi, dll)
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          {/* ── Adjustment Form Card ── */}
          <Card className="border-primary/20">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ArrowUpDown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Form Penyesuaian Stok</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pilih produk, tentukan jenis & jumlah penyesuaian
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Product Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Cari Produk <span className="text-destructive">*</span>
                </Label>
                <div ref={searchContainerRef} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    placeholder="Ketik nama produk atau SKU..."
                    value={selectedProduct ? selectedProduct.name : searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedProduct && val !== selectedProduct.name) {
                        setSelectedProduct(null);
                      }
                      setSearchQuery(val);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className="border-border/60 bg-background/60 pl-9"
                  />
                  {selectedProduct && (
                    <button
                      onClick={clearProduct}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Search dropdown with Command */}
                  {isSearchOpen && !selectedProduct && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl animate-in fade-in slide-in-from-top-1">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari nama produk atau SKU..."
                          value={searchQuery}
                          onValueChange={(val) => {
                            setSearchQuery(val);
                          }}
                          className="h-9"
                        />
                        <CommandList>
                          {searchResults.length === 0 && !searchQuery.trim() && (
                            <div className="py-6 text-center">
                              <Package className="mx-auto h-8 w-8 text-muted-foreground/40" />
                              <p className="mt-2 text-sm text-muted-foreground">
                                Ketik untuk mencari produk
                              </p>
                            </div>
                          )}
                          {searchResults.length === 0 && searchQuery.trim() && (
                            <CommandEmpty>
                              <p className="text-muted-foreground">
                                Tidak ada produk untuk &quot;{searchQuery}&quot;
                              </p>
                            </CommandEmpty>
                          )}
                          {searchResults.length > 0 && (
                            <CommandGroup heading={`${searchResults.length} produk ditemukan`}>
                              {searchResults.map((p) => (
                                <CommandItem
                                  key={p.sku}
                                  value={p.sku}
                                  onSelect={() => handleSelectProduct(p)}
                                  className="flex items-center gap-3 px-2 py-2"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      <span className="font-mono">{p.sku}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                      Stok: {p.totalStock}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Product Info + Form */}
              {selectedProduct && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  {/* Product Info Card */}
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{selectedProduct.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedProduct.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Stok Saat Ini</p>
                        <p className="text-xl font-bold tabular-nums">{selectedProduct.totalStock}</p>
                      </div>
                    </div>
                    {selectedProduct.lokasiRak && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rak: {selectedProduct.lokasiRak}</span>
                        {selectedProduct.kategori && <span>· {selectedProduct.kategori}</span>}
                      </div>
                    )}
                  </div>

                  {/* Jenis Penyesuaian */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Jenis Penyesuaian <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setJenis("tambah")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                          jenis === "tambah"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Stok (+)
                      </button>
                      <button
                        onClick={() => setJenis("kurangi")}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                          jenis === "kurangi"
                            ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <Minus className="h-4 w-4" />
                        Kurangi Stok (-)
                      </button>
                    </div>
                  </div>

                  {/* Jumlah */}
                  <div className="space-y-2">
                    <Label htmlFor="jumlah" className="text-sm font-medium">
                      Jumlah <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="jumlah"
                      type="number"
                      min={1}
                      max={jenis === "kurangi" ? selectedProduct.totalStock : undefined}
                      value={jumlah}
                      onChange={(e) => setJumlah(e.target.value)}
                      placeholder={`Masukkan jumlah (maks: ${jenis === "kurangi" ? selectedProduct.totalStock : "∞"})`}
                      className="border-border/60"
                    />
                    {previewStokSesudah !== null && previewStokSesudah >= 0 && (
                      <p className="text-xs text-muted-foreground">
                        Stok setelah penyesuaian:{" "}
                        <span className="font-semibold tabular-nums">{previewStokSesudah}</span> unit
                        {jenis === "tambah"
                          ? ` (+${parseInt(jumlah) || 0} dari ${selectedProduct.totalStock})`
                          : ` (-${parseInt(jumlah) || 0} dari ${selectedProduct.totalStock})`}
                      </p>
                    )}
                  </div>

                  {/* Alasan */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Alasan <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALASAN_PRESETS.map((a) => (
                        <Badge
                          key={a}
                          variant={alasan === a ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-all ${
                            alasan === a ? "" : "hover:border-primary/50"
                          }`}
                          onClick={() => {
                            setAlasan(a);
                            if (a !== "Lainnya") setCustomAlasan("");
                          }}
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                    {alasan === "Lainnya" && (
                      <Input
                        placeholder="Tuliskan alasan penyesuaian..."
                        value={customAlasan}
                        onChange={(e) => setCustomAlasan(e.target.value)}
                        className="border-border/60 mt-2"
                      />
                    )}
                  </div>

                  {/* Catatan (opsional) */}
                  <div className="space-y-2">
                    <Label htmlFor="catatan" className="text-sm font-medium">
                      Catatan Tambahan <span className="text-muted-foreground text-xs">(opsional)</span>
                    </Label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tambahan terkait penyesuaian stok..."
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                    />
                  </div>

                  {/* Nilai Kerugian — only for kurangi + barang rusak/hilang */}
                  {jenis === "kurangi" && (alasan === "Barang rusak" || alasan === "Barang hilang") && (
                    <div className="space-y-2 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <Label className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Nilai Kerugian (Rupiah)
                        </Label>
                      </div>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mb-3">
                        Masukkan estimasi nilai kerugian dari {alasan === "Barang rusak" ? "barang yang rusak" : "barang yang hilang"}. Nilai ini akan tercatat di Laporan Profit & Loss.
                      </p>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={nilaiKerugian}
                          onChange={(e) => setNilaiKerugian(e.target.value)}
                          placeholder="0"
                          className="pl-10 border-amber-300/60 dark:border-amber-700/30 focus-visible:border-amber-500 focus-visible:ring-amber-500/25"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={
                      !selectedProduct ||
                      !jumlah ||
                      parseInt(jumlah) <= 0 ||
                      !alasan ||
                      (alasan === "Lainnya" && !customAlasan.trim())
                    }
                    className={`w-full gap-2 ${
                      jenis === "tambah"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {jenis === "tambah" ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    {jenis === "tambah"
                      ? `Tambah Stok ${parseInt(jumlah) || 0} Unit`
                      : `Kurangi Stok ${parseInt(jumlah) || 0} Unit`}
                  </Button>
                </div>
              )}

              {/* Empty state when no product selected */}
              {!selectedProduct && (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">Cari produk untuk memulai</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ketik nama produk atau SKU di kolom pencarian di atas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Confirmation Modal ── */}
          {showConfirm && selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      jenis === "tambah" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        jenis === "tambah" ? "text-emerald-600" : "text-red-600"
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Konfirmasi Penyesuaian Stok</h2>
                      <p className="text-xs text-muted-foreground">Pastikan data sudah benar</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produk</span>
                      <span className="font-medium text-right">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="font-mono text-xs">{selectedProduct.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jenis</span>
                      <Badge variant={jenis === "tambah" ? "default" : "destructive"} className="text-xs">
                        {jenis === "tambah" ? "Tambah (+)" : "Kurangi (-)"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah</span>
                      <span className="font-bold tabular-nums">{parseInt(jumlah) || 0} unit</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="text-muted-foreground">Stok Saat Ini</span>
                      <span className="tabular-nums">{selectedProduct.totalStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stok Setelah</span>
                      <span className="font-bold tabular-nums">{previewStokSesudah}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alasan</span>
                      <span className="text-right max-w-[180px]">{alasan === "Lainnya" ? customAlasan : alasan}</span>
                    </div>
                    {(alasan === "Barang rusak" || alasan === "Barang hilang") && (() => {
                      const manualVal = parseInt(nilaiKerugian);
                      const calcVal = (!manualVal || manualVal <= 0) && selectedProduct
                        ? (selectedProduct.hpp || 0) * (parseInt(jumlah) || 0)
                        : manualVal;
                      return calcVal > 0 ? (
                        <div className="border-t border-border pt-2 flex justify-between text-amber-600 dark:text-amber-400">
                          <span className="font-medium">Nilai Kerugian</span>
                          <span className="font-bold tabular-nums">
                            {formatRupiah(calcVal)}
                            {(!manualVal || manualVal <= 0) && (
                              <span className="text-xs font-normal text-amber-500/70 ml-1">(auto)</span>
                            )}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirm(false)}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 gap-2 ${
                        jenis === "tambah"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {isSubmitting ? (
                        "Menyimpan..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Konfirmasi
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Riwayat Adjust Stok ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Riwayat Penyesuaian Stok</CardTitle>
                  <Badge variant="outline" className="text-xs font-mono ml-1">
                    {adjustments.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* History Search */}
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari riwayat..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="border-border/60 bg-background/60 pl-9 h-9 text-sm"
                />
              </div>

              {adjustments.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Belum ada penyesuaian stok"
                  description="Riwayat penyesuaian stok akan muncul di sini setelah Anda melakukan penyesuaian pertama."
                />
              ) : filteredHistory.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada riwayat ditemukan"
                  description={`Tidak ada penyesuaian yang cocok dengan "${historySearch}"`}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistorySearch("")}
                    >
                      Reset Pencarian
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-lg border table-responsive">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Jenis</TableHead>
                        <TableHead className="text-right">Stok Sebelum</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Stok Sesudah</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((adj) => (
                        <TableRow key={adj.id} className={
                          adj.jenis === "tambah"
                            ? "even:bg-emerald-50/30 dark:even:bg-emerald-950/10"
                            : "even:bg-red-50/30 dark:even:bg-red-950/10"
                        }>
                          <TableCell data-label="Tanggal" className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(adj.created_at)}
                            </div>
                          </TableCell>
                          <TableCell data-label="Produk">
                            <div>
                              <p className="text-sm font-medium">{adj.nama_produk}</p>
                              <p className="text-xs text-muted-foreground font-mono">{adj.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell data-label="Jenis" className="text-center">
                            {adj.jenis === "tambah" ? (
                              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                                <Plus className="h-3 w-3 mr-0.5" />
                                Tambah
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <Minus className="h-3 w-3 mr-0.5" />
                                Kurang
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell data-label="Sebelum" className="text-right tabular-nums text-sm">
                            {adj.stok_sebelum}
                          </TableCell>
                          <TableCell data-label="Jumlah" className="text-right">
                            <span className={`font-medium tabular-nums ${
                              adj.jenis === "tambah" ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {adj.jenis === "tambah" ? "+" : "-"}{adj.jumlah}
                            </span>
                          </TableCell>
                          <TableCell data-label="Sesudah" className="text-right tabular-nums text-sm font-semibold">
                            {adj.stok_sesudah}
                          </TableCell>
                          <TableCell data-label="Alasan">
                            <span className="text-xs">{adj.alasan}</span>
                            {adj.catatan && (
                              <p className="text-xs text-muted-foreground mt-0.5">{adj.catatan}</p>
                            )}
                          </TableCell>
                          <TableCell data-label="User" className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {adj.user_name || "—"}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
