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
  ShoppingCart,
  RotateCcw,
  Receipt,
  Store,
} from "lucide-react";
import {
  getAppData,
  saveReturn,
  getReturns,
  type Order,
  type GoodsReturn,
  type InventoryProduct,
} from "@/app/actions";
import { usePermission } from "@/lib/use-permission";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";

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

// ─── Return Item interface for form ────────────────────────────────────────

interface ReturnFormItem {
  sku: string;
  nama_produk: string;
  harga_jual: number;
  hpp: number;
  maxQuantity: number;
  quantity: number;
  checked: boolean;
}

const ALASAN_RETUR = [
  "Barang cacat/rusak",
  "Barang tidak sesuai pesanan",
  "Ukuran tidak cocok",
  "Kualitas kurang baik",
  "Barang expired",
  "Kesalahan input penjualan",
  "Lainnya",
] as const;

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function ReturPage() {
  usePermission();

  // ── Data state ───────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [returns, setReturns] = useState<GoodsReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Order search state ───────────────────────────────────────────────
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const orderSearchRef = useRef<HTMLDivElement>(null);

  // ── Return form state ────────────────────────────────────────────────
  const [returnItems, setReturnItems] = useState<ReturnFormItem[]>([]);
  const [alasan, setAlasan] = useState("");
  const [customAlasan, setCustomAlasan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Confirmation state ───────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);

  // ── History state ────────────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState("");

  // ── Load data ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getAppData().then((data) => {
        setOrders(data.orders || []);
        setProducts(data.inventoryProducts || []);
      }),
      getReturns().then(setReturns),
    ]).finally(() => setIsLoading(false));
  }, []);

  // ── Close order dropdown on click outside ────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (orderSearchRef.current && !orderSearchRef.current.contains(e.target as Node)) {
        setShowOrderDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Filter completed orders for search ─────────────────────────────
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.status_pesanan === "selesai");
  }, [orders]);

  const orderSearchResults = useMemo(() => {
    if (!orderSearch.trim()) return [];
    const q = orderSearch.toLowerCase();
    return completedOrders.filter(
      (o) =>
        o.nomor_order.toLowerCase().includes(q) ||
        o.nama_pembeli.toLowerCase().includes(q) ||
        o.seller_name.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [completedOrders, orderSearch]);

  // ── Select order & init return items ──────────────────────────────
  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderSearch(`${order.nomor_order} - ${order.nama_pembeli}`);
    setShowOrderDropdown(false);
    // Initialize return items from order items
    setReturnItems(
      order.items.map((item) => ({
        sku: item.sku,
        nama_produk: item.nama_produk,
        harga_jual: item.harga,
        hpp: item.hpp || Math.round(item.harga * 0.6),
        maxQuantity: item.quantity,
        quantity: item.quantity,
        checked: false,
      }))
    );
  };

  const clearOrder = () => {
    setSelectedOrder(null);
    setOrderSearch("");
    setReturnItems([]);
    setAlasan("");
    setCustomAlasan("");
  };

  const toggleItemCheck = (sku: string) => {
    setReturnItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, checked: !i.checked } : i))
    );
  };

  const updateReturnQty = (sku: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((i) =>
        i.sku === sku
          ? { ...i, quantity: Math.min(Math.max(1, qty), i.maxQuantity) }
          : i
      )
    );
  };

  const selectAllItems = () => {
    setReturnItems((prev) => prev.map((i) => ({ ...i, checked: true })));
  };

  const deselectAllItems = () => {
    setReturnItems((prev) => prev.map((i) => ({ ...i, checked: false })));
  };

  // ── Computed totals ──────────────────────────────────────────────────
  const checkedItems = useMemo(
    () => returnItems.filter((i) => i.checked),
    [returnItems]
  );

  const totalRefund = useMemo(
    () => checkedItems.reduce((sum, i) => sum + i.harga_jual * i.quantity, 0),
    [checkedItems]
  );

  const totalHpp = useMemo(
    () => checkedItems.reduce((sum, i) => sum + i.hpp * i.quantity, 0),
    [checkedItems]
  );

  // Deteksi apakah retur ini karena kerusakan (stok tidak dikembalikan)
  const isDamageReturn = useMemo(() => {
    const alasanFinal = alasan === "Lainnya" ? customAlasan.trim() : alasan;
    if (!alasanFinal) return false;
    const damageKeywords = ["cacat", "rusak", "expired"];
    return damageKeywords.some((k) => alasanFinal.toLowerCase().includes(k));
  }, [alasan, customAlasan]);

  const hppLoss = isDamageReturn ? totalHpp : 0;

  const totalItemCount = useMemo(
    () => checkedItems.reduce((sum, i) => sum + i.quantity, 0),
    [checkedItems]
  );

  // ── Validate form ───────────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (checkedItems.length === 0) return false;
    const alasanFinal = alasan === "Lainnya" ? customAlasan.trim() : alasan;
    if (!alasanFinal) return false;
    return true;
  }, [checkedItems, alasan, customAlasan]);

  // ── Submit return ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedOrder || !isValid) return;

    const alasanFinal = alasan === "Lainnya" ? customAlasan.trim() : alasan;

    setIsSubmitting(true);
    try {
      const result = await saveReturn({
        original_order_id: selectedOrder.id,
        nomor_order: selectedOrder.nomor_order,
        customer_name: selectedOrder.nama_pembeli,
        alasan: alasanFinal,
        items: checkedItems.map((i) => ({
          sku: i.sku,
          nama_produk: i.nama_produk,
          quantity: i.quantity,
          harga_jual: i.harga_jual,
          hpp: i.hpp,
        })),
      });

      if (result.success && result.goodsReturn) {
        toast.success(
          `Retur berhasil! ${totalItemCount} item dari "${selectedOrder.nomor_order}" diretur`
        );
        // Update local state
        setReturns((prev) => [result.goodsReturn!, ...prev]);
        // Update product stock locally
        setProducts((prev) =>
          prev.map((p) => {
            const returnedItem = checkedItems.find((i) => i.sku === p.sku);
            return returnedItem
              ? { ...p, totalStock: p.totalStock + returnedItem.quantity }
              : p;
          })
        );
        // Reset form
        clearOrder();
        setShowConfirm(false);
      } else {
        toast.error(result.error || "Gagal menyimpan retur");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan retur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filter history ──────────────────────────────────────────────────
  const filteredReturns = useMemo(() => {
    if (!historySearch.trim()) return returns;
    const q = historySearch.toLowerCase();
    return returns.filter(
      (r) =>
        r.nomor_retur.toLowerCase().includes(q) ||
        r.nomor_order.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.alasan.toLowerCase().includes(q)
    );
  }, [returns, historySearch]);

  // ======================================================================
  //  RENDER
  // ======================================================================

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Retur Barang", href: "/retur" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Retur Barang</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Proses retur barang dari pesanan yang sudah selesai, stok akan dikembalikan otomatis
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Receipt className="h-4 w-4" />
          <span>{completedOrders.length} pesanan selesai</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <TableSkeleton rows={4} cols={6} />
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════╗
           ║  RETURN FORM CARD                                           ║
           ╚══════════════════════════════════════════════════════════════ */}
          <Card className="border-primary/20">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <RotateCcw className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Form Retur Barang</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cari pesanan yang sudah selesai, pilih item untuk diretur
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* ── Order Search ───────────────────────────────────── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Cari Pesanan <span className="text-destructive">*</span>
                </Label>
                <div ref={orderSearchRef} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    placeholder="Cari nomor order atau nama pelanggan..."
                    value={selectedOrder ? `${selectedOrder.nomor_order} - ${selectedOrder.nama_pembeli}` : orderSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedOrder) {
                        setSelectedOrder(null);
                        setReturnItems([]);
                      }
                      setOrderSearch(val);
                      setShowOrderDropdown(true);
                    }}
                    onFocus={() => !selectedOrder && setShowOrderDropdown(true)}
                    className="border-border/60 bg-background/60 pl-9"
                  />
                  {selectedOrder && (
                    <button
                      onClick={clearOrder}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Order search dropdown */}
                  {showOrderDropdown && !selectedOrder && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-xl animate-in fade-in slide-in-from-top-1">
                      <div className="p-2">
                        <Input
                          placeholder="Cari nomor order atau nama..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="border-none bg-muted/50 h-9 text-sm mb-2"
                          autoFocus
                        />
                        {orderSearchResults.length === 0 && (
                          <div className="py-6 text-center">
                            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/40" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              {orderSearch.trim()
                                ? `Tidak ada pesanan untuk "${orderSearch}"`
                                : "Ketik nomor order atau nama pelanggan"}
                            </p>
                          </div>
                        )}
                        {orderSearchResults.length > 0 && (
                          <div className="max-h-60 overflow-y-auto">
                            {orderSearchResults.map((order) => (
                              <button
                                key={order.id}
                                onClick={() => handleSelectOrder(order)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent transition-colors"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                                  <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{order.nomor_order}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.nama_pembeli} · {order.items.length} item · {formatRupiah(order.grand_total)}
                                  </p>
                                </div>
                                <div className="text-xs text-muted-foreground shrink-0">
                                  {formatDate(order.tanggal_pesanan)}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Selected Order Details + Items ─────────────────── */}
              {selectedOrder && (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                  {/* Order Info Card */}
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                          <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{selectedOrder.nomor_order}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedOrder.nama_pembeli} · {formatDate(selectedOrder.tanggal_pesanan)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-300 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
                        Selesai
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{selectedOrder.items.length} jenis produk</span>
                      <span>Total: {formatRupiah(selectedOrder.grand_total)}</span>
                      {selectedOrder.nama_toko && selectedOrder.nama_toko !== "POS Direct" && (
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {selectedOrder.nama_toko}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">
                        Pilih Item untuk Diretur
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={selectAllItems}
                        >
                          <Plus className="h-3 w-3" />
                          Pilih Semua
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={deselectAllItems}
                        >
                          <X className="h-3 w-3" />
                          Hapus Semua
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {returnItems.map((item) => (
                        <div
                          key={item.sku}
                          className={`rounded-xl border p-3.5 transition-all ${
                            item.checked
                              ? "border-primary/40 bg-primary/5 shadow-sm"
                              : "border-border/60 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleItemCheck(item.sku)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                                item.checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30 hover:border-muted-foreground/50"
                              }`}
                            >
                              {item.checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>

                            {/* Item Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium">{item.nama_produk}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                                </div>
                                <p className="text-sm font-semibold tabular-nums shrink-0">
                                  {formatRupiah(item.hpp)}
                                </p>
                              </div>

                              {item.checked && (
                                <div className="mt-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Jumlah retur:</span>
                                    <div className="flex items-center rounded-lg border border-border/60 overflow-hidden shadow-sm">
                                      <button
                                        className="flex h-7 w-7 items-center justify-center bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                        onClick={() => updateReturnQty(item.sku, item.quantity - 1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="flex h-7 w-10 items-center justify-center text-xs font-bold tabular-nums text-foreground bg-background">
                                        {item.quantity}
                                      </span>
                                      <button
                                        className="flex h-7 w-7 items-center justify-center bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                        onClick={() => updateReturnQty(item.sku, item.quantity + 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      / maks {item.maxQuantity}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Subtotal retur: <span className="font-semibold text-foreground">{formatRupiah(item.harga_jual * item.quantity)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Alasan Retur <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALASAN_RETUR.map((a) => (
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
                        placeholder="Tuliskan alasan retur..."
                        value={customAlasan}
                        onChange={(e) => setCustomAlasan(e.target.value)}
                        className="border-border/60 mt-2"
                      />
                    )}
                  </div>

                  {/* Summary */}
                  {checkedItems.length > 0 && (
                    <div className={`rounded-xl border p-4 space-y-2 ${
                      isDamageReturn
                        ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10"
                        : "border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/10"
                    }`}>
                      <p className={`text-sm font-semibold ${
                        isDamageReturn ? "text-red-700 dark:text-red-400" : "text-orange-700 dark:text-orange-400"
                      }`}>
                        Ringkasan Retur
                      </p>

                      {/* ⚠️ Warning untuk retur karena kerusakan */}
                      {isDamageReturn && (
                        <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/30 bg-red-100/50 dark:bg-red-950/20 p-2.5">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                              Barang tidak dikembalikan ke stok
                            </p>
                            <p className="text-[11px] text-red-600/70 dark:text-red-400/70">
                              Karena alasan cacat/rusak/expired, stok TIDAK dikembalikan.
                              Nilai HPP ({formatRupiah(hppLoss)}) tercatat sebagai kerugian.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Jumlah item diretur</span>
                          <span className="font-medium">{totalItemCount} unit</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {isDamageReturn ? "Total refund (ke pelanggan)" : "Total refund (ke pelanggan)"}
                          </span>
                          <span className="font-bold text-destructive tabular-nums">{formatRupiah(totalRefund)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {isDamageReturn ? "Nilai HPP (kerugian)" : "Total HPP dikembalikan"}
                          </span>
                          <span className={`font-semibold tabular-nums ${
                            isDamageReturn
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {formatRupiah(isDamageReturn ? hppLoss : totalHpp)}
                          </span>
                        </div>
                        <Separator className="my-1 bg-border/50" />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total biaya retur</span>
                          <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                            {formatRupiah(isDamageReturn ? totalRefund + hppLoss : totalRefund)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={() => setShowConfirm(true)}
                    disabled={!isValid}
                    className={`w-full gap-2 ${
                      isDamageReturn
                        ? "bg-red-600 hover:bg-red-700"
                        : ""
                    }`}
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {checkedItems.length > 0
                      ? `Retur ${totalItemCount} Item${isDamageReturn ? " (Kerugian " + formatRupiah(totalRefund + hppLoss) + ")" : " (" + formatRupiah(totalRefund) + ")"}`
                      : "Pilih item untuk diretur"}
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {!selectedOrder && (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Cari pesanan untuk memulai retur
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cari berdasarkan nomor order atau nama pelanggan dari pesanan yang sudah selesai
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═════════════════════════════════════════════════════════════╗
           ║  CONFIRMATION MODAL                                         ║
           ╚══════════════════════════════════════════════════════════════ */}
          {showConfirm && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Konfirmasi Retur</h2>
                      <p className="text-xs text-muted-foreground">
                        Stok akan dikembalikan secara otomatis
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pesanan</span>
                      <span className="font-medium text-right">{selectedOrder.nomor_order}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span>{selectedOrder.nama_pembeli}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alasan</span>
                      <span className="text-right max-w-[180px]">{alasan === "Lainnya" ? customAlasan : alasan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Item diretur</span>
                      <span className="font-medium">{totalItemCount} unit dari {checkedItems.length} produk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total refund</span>
                      <span className="font-bold text-destructive tabular-nums">{formatRupiah(totalRefund)}</span>
                    </div>
                    {isDamageReturn ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nilai HPP (kerugian)</span>
                          <span className="font-semibold text-red-600 tabular-nums">{formatRupiah(hppLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total kerugian</span>
                          <span className="font-bold text-amber-600 tabular-nums">{formatRupiah(totalRefund + hppLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stok dikembalikan</span>
                          <span className="font-semibold text-red-600 tabular-nums">0 unit (rusak)</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stok dikembalikan</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">{totalItemCount} unit</span>
                      </div>
                    )}

                    <Separator className="bg-border/50" />
                    <p className="text-xs text-muted-foreground">
                      Produk yang diretur:
                    </p>
                    {checkedItems.map((item) => (
                      <div key={item.sku} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]">{item.nama_produk}</span>
                        <span className="font-medium">x{item.quantity}</span>
                      </div>
                    ))}
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
                      className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      {isSubmitting ? (
                        "Menyimpan..."
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Konfirmasi Retur
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════╗
           ║  HISTORY TABLE                                              ║
           ╚══════════════════════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Riwayat Retur Barang</CardTitle>
                  <Badge variant="outline" className="text-xs font-mono ml-1">
                    {returns.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* History Search */}
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari riwayat retur..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="border-border/60 bg-background/60 pl-9 h-9 text-sm"
                />
              </div>

              {returns.length === 0 ? (
                <EmptyState
                  icon={RotateCcw}
                  title="Belum ada retur barang"
                  description="Riwayat retur akan muncul di sini setelah Anda melakukan retur pertama."
                />
              ) : filteredReturns.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada riwayat ditemukan"
                  description={`Tidak ada retur yang cocok dengan "${historySearch}"`}
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
                        <TableHead>No. Retur</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Pesanan Asal</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead className="text-center">Item</TableHead>
                        <TableHead className="text-right">Total Refund</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReturns.map((ret) => (
                        <TableRow key={ret.id} className="even:bg-orange-50/30 dark:even:bg-orange-950/10">
                          <TableCell data-label="No. Retur">
                            <span className="font-mono text-xs font-medium text-orange-600 dark:text-orange-400">
                              {ret.nomor_retur}
                            </span>
                          </TableCell>
                          <TableCell data-label="Tanggal" className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ret.tanggal)}
                            </div>
                          </TableCell>
                          <TableCell data-label="Pesanan">
                            <span className="text-xs font-mono">{ret.nomor_order}</span>
                          </TableCell>
                          <TableCell data-label="Pelanggan" className="text-sm">{ret.customer_name}</TableCell>
                          <TableCell data-label="Item" className="text-center text-sm tabular-nums">
                            {ret.total_item}
                          </TableCell>
                          <TableCell data-label="Refund" className="text-right tabular-nums font-medium text-destructive">
                            {formatRupiah(ret.total_refund)}
                          </TableCell>
                          <TableCell data-label="Alasan">
                            <span className="text-xs">{ret.alasan}</span>
                            {ret.items.length > 1 && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {ret.items.map((i) => `${i.nama_produk} x${i.quantity}`).join(", ")}
                              </p>
                            )}
                          </TableCell>
                          <TableCell data-label="User" className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ret.user_name || "—"}
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
