"use client";

import {
  PackageOpen,
  Search,
  X,
  Calendar,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowDownToLine,
  Filter,
  RotateCcw,
  Eye,
  User,
  Tag,
  Clock,
  List,
} from "lucide-react";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";

import { getAppData, type GoodsReceipt } from "@/app/actions";
import { ExportButton } from "@/components/export-button";
import { GOODS_RECEIPT_EXPORT_COLUMNS } from "@/lib/export-utils";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
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

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReceiptNumber(id: number): string {
  return `GR-${String(id).padStart(6, "0")}`;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function RiwayatBarangMasukPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [detailReceipt, setDetailReceipt] = useState<GoodsReceipt | null>(null);

  // Expanded row
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    getAppData().then((data) => {
      setReceipts(data.goodsReceipts || []);
      setIsLoading(false);
    });
  }, []);

  // ─── Compute stats ────────────────────────────────────────────────────

  const totalReceipts = receipts.length;
  const totalItemsIn = receipts.reduce((s, r) => s + r.total_item, 0);
  const totalBiaya = receipts.reduce((s, r) => s + r.total_biaya, 0);

  // ─── Filtered receipts ────────────────────────────────────────────────

  const filteredReceipts = useMemo(() => {
    let result = [...receipts];

    // Search filter (supplier, faktur, or product name/SKU)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.supplier.toLowerCase().includes(q) ||
          r.nomor_faktur.toLowerCase().includes(q) ||
          r.items.some(
            (i) =>
              i.nama_produk.toLowerCase().includes(q) ||
              i.sku.toLowerCase().includes(q)
          )
      );
    }

    // Date from filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((r) => new Date(r.tanggal) >= from);
    }

    // Date to filter
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((r) => new Date(r.tanggal) <= to);
    }

    return result.reverse(); // newest first
  }, [receipts, search, dateFrom, dateTo]);

  const hasActiveFilters = search.trim() || dateFrom || dateTo;

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  // ─── Export data ──────────────────────────────────────────────────────

  const exportData = useMemo(() => {
    return filteredReceipts.map((r) => ({
      receiptNumber: formatReceiptNumber(r.id),
      tanggal: formatDateShort(r.tanggal),
      supplier: r.supplier,
      nomorFaktur: r.nomor_faktur || "-",
      products: r.items.map((i) => `${i.nama_produk} (${i.sku}) x${i.quantity}`).join(", "),
      totalItem: r.total_item,
      totalBiaya: r.total_biaya,
      userName: r.user_name || "-",
    }));
  }, [filteredReceipts]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Barang Masuk", href: "/barang-masuk" },
          { name: "Riwayat", href: "/barang-masuk/riwayat" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Riwayat Barang Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seluruh catatan penerimaan barang dari supplier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={exportData as unknown as Record<string, unknown>[]}
            columns={GOODS_RECEIPT_EXPORT_COLUMNS}
            filenamePrefix="Riwayat-Barang-Masuk"
            label="Export Riwayat"
          />
        </div>
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
              <TableSkeleton rows={4} cols={7} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="card-hover border-primary/10 bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penerimaan</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <PackageOpen className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalReceipts}</p>
                <p className="text-xs text-muted-foreground">Transaksi barang masuk</p>
              </CardContent>
            </Card>
            <Card className="card-hover border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-card to-emerald-50/40 dark:to-emerald-950/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Item Masuk</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <ArrowDownToLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalItemsIn.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Unit diterima dari supplier</p>
              </CardContent>
            </Card>
            <Card className="card-hover border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-card to-amber-50/40 dark:to-amber-950/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Biaya</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(totalBiaya)}</p>
                <p className="text-xs text-muted-foreground">Total pembelian dari supplier</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Search Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Penerimaan Barang</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1.5 text-sm ${showFilters ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                    {hasActiveFilters && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                        {(!!search ? 1 : 0) + (!!dateFrom ? 1 : 0) + (!!dateTo ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-sm text-muted-foreground"
                      onClick={resetFilters}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari supplier, no. faktur, nama produk, atau SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Date range filters (collapsible) */}
              {showFilters && (
                <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 animate-in slide-in-from-top-1 duration-150">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Dari Tanggal
                    </Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-44 pl-8 h-9 text-sm border-border/60 focus-visible:border-primary/70"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Sampai Tanggal
                    </Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-44 pl-8 h-9 text-sm border-border/60 focus-visible:border-primary/70"
                      />
                    </div>
                  </div>
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="h-9 text-xs text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Hapus
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground ml-auto">
                    {filteredReceipts.length === receipts.length
                      ? `Menampilkan ${receipts.length} transaksi`
                      : `${filteredReceipts.length} dari ${receipts.length} transaksi`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card>
            <CardContent className="pt-6">
              {filteredReceipts.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title="Tidak ada data ditemukan"
                  description={
                    hasActiveFilters
                      ? `Tidak ada barang masuk yang cocok dengan filter yang diterapkan. Coba ubah kata kunci atau rentang tanggal.`
                      : "Belum ada catatan barang masuk. Buat barang masuk baru untuk mulai mencatat penerimaan dari supplier."
                  }
                  action={
                    hasActiveFilters ? (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={resetFilters}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset Filter
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="w-32">
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            No. Penerimaan
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            Tanggal
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Supplier
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            No. Faktur
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <List className="h-3.5 w-3.5 text-muted-foreground" />
                            Produk
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Total Biaya</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            Diinput
                          </div>
                        </TableHead>
                        <TableHead className="text-right w-20">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => {
                        const isExpanded = expandedId === receipt.id;
                        return (
                          <React.Fragment key={receipt.id}>
                            <TableRow
                              className="cursor-pointer transition-colors hover:bg-muted/50"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : receipt.id)
                              }
                            >
                              <TableCell className="text-muted-foreground">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-primary font-medium">
                                {formatReceiptNumber(receipt.id)}
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {formatDateShort(receipt.tanggal)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                                    {receipt.supplier.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-sm">
                                    {receipt.supplier}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {receipt.nomor_faktur ? (
                                  <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono">
                                    {receipt.nomor_faktur}
                                  </code>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex -space-x-1.5">
                                  {receipt.items.slice(0, 3).map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground"
                                      title={item.nama_produk}
                                    >
                                      {item.nama_produk.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                  {receipt.items.length > 3 && (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-medium text-primary">
                                      +{receipt.items.length - 3}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className="text-xs font-medium">
                                  {receipt.total_item} item
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums text-sm">
                                {formatRupiah(receipt.total_biaya)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {receipt.user_name ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium shrink-0">
                                      {receipt.user_name.charAt(0).toUpperCase()}
                                    </span>
                                    {receipt.user_name}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-primary hover:text-primary/80 gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailReceipt(receipt);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Detail
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Expanded product detail rows */}
                            {isExpanded && (
                              <>
                                {receipt.items.map((item, idx) => (
                                  <TableRow
                                    key={`${receipt.id}-item-${idx}`}
                                    className="bg-muted/20 border-t-0"
                                  >
                                    <TableCell className="w-8"></TableCell>
                                    <TableCell colSpan={2} className="py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/5 text-[9px] font-mono text-primary">
                                          {idx + 1}
                                        </span>
                                        <code className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                          {item.sku}
                                        </code>
                                      </div>
                                    </TableCell>
                                    <TableCell colSpan={2} className="py-2">
                                      <span className="text-sm font-medium">
                                        {item.nama_produk}
                                      </span>
                                      {item.catatan && (
                                        <span className="ml-2 text-xs text-muted-foreground italic">
                                          — {item.catatan}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <span className="text-sm font-medium tabular-nums">
                                        {item.quantity}x
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                      <div className="text-sm tabular-nums">
                                        <span className="font-medium">
                                          {formatRupiah(item.harga_beli * item.quantity)}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1">
                                          (@{formatRupiah(item.harga_beli)})
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                  </TableRow>
                                ))}

                                {/* Summary row for expanded items */}
                                <TableRow className="bg-primary/5 border-t-0">
                                  <TableCell colSpan={7} className="py-2 text-right text-sm text-muted-foreground">
                                    Total <strong>{receipt.items.length}</strong> produk —{" "}
                                    <strong>{receipt.total_item}</strong> unit
                                  </TableCell>
                                  <TableCell className="py-2 text-right font-semibold tabular-nums text-sm">
                                    {formatRupiah(receipt.total_biaya)}
                                  </TableCell>
                                  <TableCell colSpan={2}></TableCell>
                                </TableRow>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Footer info */}
              {filteredReceipts.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <PackageOpen className="h-3 w-3" />
                      {filteredReceipts.reduce((s, r) => s + r.items.length, 0)} produk
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ArrowDownToLine className="h-3 w-3" />
                      {filteredReceipts.reduce((s, r) => s + r.total_item, 0).toLocaleString("id-ID")} unit
                    </span>
                    <button
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      onClick={() => {
                        if (detailReceipt) setDetailReceipt(null);
                        setExpandedId(
                          expandedId === null ? -1 : null // toggle all: a signal
                        );
                        // If no expanded, expand all
                        if (expandedId === null) {
                          // Expand first one
                          setExpandedId(filteredReceipts[0]?.id ?? null);
                        }
                      }}
                    >
                      {expandedId !== null ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Ciutkan
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Perluas
                        </>
                      )}
                    </button>
                  </div>
                  <span>
                    {filteredReceipts.length === receipts.length
                      ? `${receipts.length} transaksi`
                      : `${filteredReceipts.length} / ${receipts.length} transaksi`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Detail Modal ──────────────────────────────────────────── */}
      {detailReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-card shadow-2xl ring-1 ring-border animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 backdrop-blur px-6 py-4 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {formatReceiptNumber(detailReceipt.id)}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Detail penerimaan barang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailReceipt(null)}
                className="rounded-md p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto">
              {/* Header info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Tanggal
                  </p>
                  <p className="text-sm font-semibold">
                    {formatDateFull(detailReceipt.tanggal)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Supplier
                  </p>
                  <p className="text-sm font-semibold">{detailReceipt.supplier}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    No. Faktur
                  </p>
                  <p className="text-sm font-semibold">
                    {detailReceipt.nomor_faktur || (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    Diinput Oleh
                  </p>
                  <p className="text-sm font-semibold">
                    {detailReceipt.user_name || (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Created at */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Dicatat pada {formatDateFull(detailReceipt.created_at)} pukul{" "}
                {formatTime(detailReceipt.created_at)}
                {detailReceipt.user_name && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <User className="h-3.5 w-3.5" />
                    {detailReceipt.user_name}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Items list */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Daftar Produk ({detailReceipt.items.length} item)
                </h3>
                <div className="space-y-2">
                  {detailReceipt.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.nama_produk}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                      {item.catatan && (
                        <span className="hidden sm:block text-xs text-muted-foreground italic mx-4 max-w-[150px] truncate">
                          {item.catatan}
                        </span>
                      )}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums">
                          {item.quantity}x
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          @{formatRupiah(item.harga_beli)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Keseluruhan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {detailReceipt.total_item} unit dari{" "}
                      {detailReceipt.items.length} produk
                    </p>
                  </div>
                  <p className="text-xl font-bold tabular-nums">
                    {formatRupiah(detailReceipt.total_biaya)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t px-6 py-4 shrink-0">
              <Button
                variant="outline"
                onClick={() => setDetailReceipt(null)}
                className="gap-2"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
