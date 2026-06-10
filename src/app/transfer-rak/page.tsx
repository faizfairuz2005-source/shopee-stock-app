"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  ArrowRightLeft,
  Warehouse,
  History,
  CheckCircle2,
  X,
  Package,
  User,
  Calendar,
  Plus,
} from "lucide-react";
import {
  getAppData,
  getRacks,
  getRackTransfers,
  saveRackTransfer,
  type InventoryProduct,
  type ProductRack,
  type RackTransfer,
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

function LokasiRakBadge({ rak }: { rak?: string }) {
  if (!rak) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
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

// ─── Main Component ────────────────────────────────────────────────────────

export default function TransferRakPage() {
  usePermission();

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [racks, setRacks] = useState<ProductRack[]>([]);
  const [transfers, setTransfers] = useState<RackTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [dariRak, setDariRak] = useState("");
  const [keRak, setKeRak] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation
  const [showConfirm, setShowConfirm] = useState(false);

  // History filter
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    Promise.all([
      getAppData().then((data) => setProducts(data.inventoryProducts || [])),
      getRacks().then((r) => setRacks(r)),
      getRackTransfers().then((t) => setTransfers(t)),
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
    setDariRak(product.lokasiRak || "");
    setKeRak("");
    setIsSearchOpen(false);
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setDariRak("");
    setKeRak("");
    setCatatan("");
  };

  // ── Submit ───────────────────────────────────────────────────────────

  const handleTransfer = async () => {
    if (!selectedProduct || !dariRak.trim() || !keRak.trim()) return;
    if (dariRak.trim() === keRak.trim()) {
      toast.error("Rak asal dan tujuan tidak boleh sama");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveRackTransfer({
        sku: selectedProduct.sku,
        dari_rak: dariRak.trim(),
        ke_rak: keRak.trim(),
        catatan: catatan || undefined,
      });

      if (result.success && result.transfer) {
        toast.success(
          `"${selectedProduct.name}" dipindahkan dari ${dariRak} ke ${keRak}`
        );
        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.sku === selectedProduct.sku
              ? { ...p, lokasiRak: keRak.trim() }
              : p
          )
        );
        setTransfers((prev) => [result.transfer!, ...prev]);
        // Reset form
        clearProduct();
        setShowConfirm(false);
      } else {
        toast.error(result.error || "Gagal menyimpan transfer");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtered history ─────────────────────────────────────────────────

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return transfers;
    const q = historySearch.toLowerCase();
    return transfers.filter(
      (t) =>
        t.nama_produk.toLowerCase().includes(q) ||
        t.sku.toLowerCase().includes(q) ||
        t.dari_rak.toLowerCase().includes(q) ||
        t.ke_rak.toLowerCase().includes(q) ||
        t.catatan?.toLowerCase().includes(q)
    );
  }, [transfers, historySearch]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Inventory", href: "/inventory" },
          { name: "Transfer Rak", href: "/transfer-rak" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transfer Antar Rak</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pindahkan produk dari satu rak ke rak lainnya dan lacak riwayat perpindahan
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <TableSkeleton rows={4} cols={5} />
        </div>
      ) : (
        <>
          {/* ── Transfer Form Card ── */}
          <Card className="border-primary/20">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Form Transfer Rak</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pilih produk, tentukan rak asal dan tujuan
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
                        setDariRak("");
                        setKeRak("");
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

                  {/* Search dropdown */}
                  {isSearchOpen && !selectedProduct && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl animate-in fade-in slide-in-from-top-1">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari nama produk atau SKU..."
                          value={searchQuery}
                          onValueChange={(val) => setSearchQuery(val)}
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
                                    {p.lokasiRak ? (
                                      <LokasiRakBadge rak={p.lokasiRak} />
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Tanpa Rak
                                      </span>
                                    )}
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
                          <p className="text-xs text-muted-foreground font-mono">{selectedProduct.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Stok</p>
                        <p className="text-lg font-bold tabular-nums">{selectedProduct.totalStock}</p>
                      </div>
                    </div>
                    {selectedProduct.kategori && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Kategori: {selectedProduct.kategori}
                      </div>
                    )}
                  </div>

                  {/* Rack Selection */}
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] items-center">
                    {/* Dari Rak */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Rak Asal <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          list="dari-rak-suggestions"
                          value={dariRak}
                          onChange={(e) => setDariRak(e.target.value)}
                          placeholder="Rak asal..."
                          className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                        />
                        <datalist id="dari-rak-suggestions">
                          {racks.map((r) => (
                            <option key={r.id} value={r.name} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center pt-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-primary/30">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    {/* Ke Rak */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Rak Tujuan <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          list="ke-rak-suggestions"
                          value={keRak}
                          onChange={(e) => setKeRak(e.target.value)}
                          placeholder="Rak tujuan..."
                          className="flex h-10 w-full rounded-md border border-border/60 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                        />
                        <datalist id="ke-rak-suggestions">
                          {racks.map((r) => (
                            <option key={r.id} value={r.name} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Preview current vs target */}
                  {dariRak.trim() && keRak.trim() && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <LokasiRakBadge rak={dariRak.trim()} />
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <LokasiRakBadge rak={keRak.trim()} />
                      </div>
                      {dariRak.trim() === keRak.trim() && (
                        <span className="text-xs text-destructive font-medium ml-2">
                          Rak sama — tidak ada perubahan
                        </span>
                      )}
                    </div>
                  )}

                  {/* Catatan (opsional) */}
                  <div className="space-y-2">
                    <Label htmlFor="catatan" className="text-sm font-medium">
                      Catatan <span className="text-muted-foreground text-xs">(opsional)</span>
                    </Label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Alasan pemindahan atau catatan tambahan..."
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={
                      !selectedProduct ||
                      !dariRak.trim() ||
                      !keRak.trim() ||
                      dariRak.trim() === keRak.trim()
                    }
                    className="w-full gap-2"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    {dariRak.trim() && keRak.trim()
                      ? `Pindahkan dari ${dariRak} ke ${keRak}`
                      : "Pilih rak asal & tujuan"}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRightLeft className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Konfirmasi Transfer Rak</h2>
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
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dari Rak</span>
                      <LokasiRakBadge rak={dariRak.trim()} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Ke Rak</span>
                      <LokasiRakBadge rak={keRak.trim()} />
                    </div>
                    {catatan.trim() && (
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="text-muted-foreground">Catatan</span>
                        <span className="text-right max-w-[180px] text-xs">{catatan.trim()}</span>
                      </div>
                    )}
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
                      onClick={handleTransfer}
                      disabled={isSubmitting}
                      className="flex-1 gap-2"
                    >
                      {isSubmitting ? (
                        "Menyimpan..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Konfirmasi Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Riwayat Transfer ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Riwayat Transfer Rak</CardTitle>
                  <Badge variant="outline" className="text-xs font-mono ml-1">
                    {transfers.length}
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

              {transfers.length === 0 ? (
                <EmptyState
                  icon={ArrowRightLeft}
                  title="Belum ada transfer rak"
                  description="Riwayat transfer antar rak akan muncul di sini setelah Anda melakukan transfer pertama."
                />
              ) : filteredHistory.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada riwayat ditemukan"
                  description={`Tidak ada transfer yang cocok dengan "${historySearch}"`}
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
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Transfer</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((t) => (
                        <TableRow key={t.id} className="even:bg-muted/20">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(t.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{t.nama_produk}</p>
                              <p className="text-xs text-muted-foreground font-mono">{t.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <LokasiRakBadge rak={t.dari_rak} />
                              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <LokasiRakBadge rak={t.ke_rak} />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {t.catatan || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {t.user_name || "—"}
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
