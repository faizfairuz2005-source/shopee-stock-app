"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  AlertCircle,
  Wallet,
  History,
  CheckCircle2,
  X,
  Calendar,
  Trash2,
  Smartphone,
  CreditCard,
  TrendingDown,
  Filter,
} from "lucide-react";
import {
  getExpenses,
  saveExpense,
  deleteExpense,
  type Expense,
} from "@/app/actions";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
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

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Metode Pembayaran ─────────────────────────────────────────────────────

const METODE_LIST = [
  { value: "tunai" as const, label: "Tunai", icon: Wallet },
  { value: "transfer" as const, label: "Transfer", icon: Smartphone },
  { value: "kartu" as const, label: "Kartu", icon: CreditCard },
];

// ─── Kategori Icons ────────────────────────────────────────────────────────

const KATEGORI_ICONS: Record<string, string> = {
  Listrik: "⚡",
  Air: "💧",
  Sewa: "🏠",
  "Gaji Karyawan": "👥",
  Transportasi: "🚗",
  "ATK & Perlengkapan": "📎",
  "Internet & Telepon": "📡",
  "Promosi & Iklan": "📢",
  "Perawatan & Perbaikan": "🔧",
  Kebersihan: "🧹",
  Keamanan: "🛡️",
  Konsumsi: "☕",
  Lainnya: "📋",
};

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PengeluaranPage() {
  usePermission();

  // ── Data state ───────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Form state ───────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(getToday());
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [metode, setMetode] = useState<"tunai" | "transfer" | "kartu">("tunai");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Confirmation state ───────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);

  // ── History state ────────────────────────────────────────────────────
  const [historySearch, setHistorySearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState<string | null>(null);

  // ── Load data ────────────────────────────────────────────────────────
  useEffect(() => {
    getExpenses().then(setExpenses).finally(() => setIsLoading(false));
  }, []);

  // ── Summary calculations ─────────────────────────────────────────────
  const totalPengeluaran = useMemo(
    () => expenses.reduce((sum, e) => sum + e.jumlah, 0),
    [expenses]
  );

  const pengeluaranBulanIni = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return expenses
      .filter((e) => e.tanggal.startsWith(prefix))
      .reduce((sum, e) => sum + e.jumlah, 0);
  }, [expenses]);

  const kategoriTotals = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expenses
      .filter((e) => e.tanggal.startsWith(prefix))
      .forEach((e) => {
        map.set(e.kategori, (map.get(e.kategori) || 0) + e.jumlah);
      });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [expenses]);

  // ── Filtered history ─────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    const q = historySearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (e) =>
          e.deskripsi.toLowerCase().includes(q) ||
          e.kategori.toLowerCase().includes(q) ||
          e.catatan?.toLowerCase().includes(q)
      );
    }
    if (kategoriFilter) {
      result = result.filter((e) => e.kategori === kategoriFilter);
    }
    return result;
  }, [expenses, historySearch, kategoriFilter]);

  // ── Unique categories from data ──────────────────────────────────────
  const uniqueCategories = useMemo(() => {
    const cats = new Set(expenses.map((e) => e.kategori));
    return Array.from(cats).sort();
  }, [expenses]);

  // ── Reset form ────────────────────────────────────────────────────────
  const resetForm = () => {
    setTanggal(getToday());
    setKategori("");
    setDeskripsi("");
    setJumlah("");
    setMetode("tunai");
    setCatatan("");
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!kategori || !deskripsi.trim() || !jumlah || parseInt(jumlah) <= 0) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveExpense({
        tanggal,
        kategori,
        deskripsi: deskripsi.trim(),
        jumlah: parseInt(jumlah),
        metode,
        catatan: catatan.trim() || undefined,
      });

      if (result.success && result.expense) {
        toast.success(`Pengeluaran \"${result.expense.deskripsi}\" berhasil dicatat`);
        setExpenses((prev) => [result.expense!, ...prev]);
        resetForm();
        setShowForm(false);
        setShowConfirm(false);
      } else {
        toast.error(result.error || "Gagal menyimpan pengeluaran");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async (expenseId: number) => {
    const result = await deleteExpense(expenseId);
    if (result.success) {
      toast.success("Pengeluaran berhasil dihapus");
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } else {
      toast.error(result.error || "Gagal menghapus pengeluaran");
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Pengeluaran", href: "/pengeluaran" },
        ]}
        className="mb-2"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pengeluaran Harian</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat biaya operasional harian — listrik, sewa, gaji, ATK, dan lainnya
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Catat Pengeluaran
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <TableSkeleton rows={4} cols={6} />
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════╗
           ║  SUMMARY CARDS                                              ║
           ╚══════════════════════════════════════════════════════════════ */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-hover border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{formatRupiah(totalPengeluaran)}</p>
                <p className="text-xs text-muted-foreground">{expenses.length} transaksi</p>
              </CardContent>
            </Card>
            <Card className="card-hover border-amber-200 dark:border-amber-900/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatRupiah(pengeluaranBulanIni)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover border-emerald-200 dark:border-emerald-900/30 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kategori Tertinggi Bulan Ini</CardTitle>
                <Filter className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {kategoriTotals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada pengeluaran bulan ini</p>
                  ) : (
                    kategoriTotals.map(([kat, total]) => (
                      <div key={kat} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>{KATEGORI_ICONS[kat] || "📋"}</span>
                          {kat}
                        </span>
                        <span className="text-xs font-semibold tabular-nums">{formatRupiah(total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═════════════════════════════════════════════════════════════╗
           ║  ADD EXPENSE FORM — Modal/Sheet                              ║
           ╚══════════════════════════════════════════════════════════════ */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Catat Pengeluaran</h2>
                      <p className="text-xs text-muted-foreground">Isi detail pengeluaran harian</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="rounded-lg p-1.5 hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Tanggal */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tanggal <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="border-border/60"
                    />
                  </div>

                  {/* Kategori */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Kategori <span className="text-destructive">*</span></Label>
                    <div className="flex flex-wrap gap-1.5">
                      {EXPENSE_CATEGORIES.map((kat) => (
                        <Badge
                          key={kat}
                          variant={kategori === kat ? "default" : "outline"}
                          className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-all ${
                            kategori === kat ? "" : "hover:border-primary/50"
                          }`}
                          onClick={() => setKategori(kat)}
                        >
                          <span className="mr-1">{KATEGORI_ICONS[kat] || "📋"}</span>
                          {kat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Deskripsi <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Misal: Pembayaran listrik bulan April"
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                      className="border-border/60"
                    />
                  </div>

                  {/* Jumlah */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Jumlah (Rp) <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">Rp</span>
                      <Input
                        type="number"
                        min={0}
                        value={jumlah}
                        onChange={(e) => setJumlah(e.target.value)}
                        placeholder="0"
                        className="border-border/60 pl-10 text-lg font-bold tabular-nums"
                      />
                    </div>
                    {/* Quick Amount Buttons */}
                    <div className="flex gap-2">
                      {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setJumlah(String(amt))}
                          className={`flex-1 rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5 text-[10px] font-medium transition-all ${
                            parseInt(jumlah) === amt
                              ? "border-primary/50 bg-primary/5 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metode Pembayaran */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Metode Pembayaran</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {METODE_LIST.map((m) => {
                        const Icon = m.icon;
                        const isActive = metode === m.value;
                        return (
                          <button
                            key={m.value}
                            onClick={() => setMetode(m.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Catatan (opsional) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Catatan <span className="text-muted-foreground text-xs">(opsional)</span>
                    </Label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Catatan tambahan..."
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/70 focus-visible:ring-1 focus-visible:ring-primary/25"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 px-5 py-4 space-y-3 shrink-0">
                  {/* Summary */}
                  {jumlah && parseInt(jumlah) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {kategori ? `${kategori} — ${deskripsi || "—"}` : "Pengeluaran"}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatRupiah(parseInt(jumlah) || 0)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(true)}
                      disabled={!kategori || !deskripsi.trim() || !jumlah || parseInt(jumlah) <= 0}
                      className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="h-4 w-4" />
                      Simpan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════╗
           ║  CONFIRMATION MODAL                                         ║
           ╚══════════════════════════════════════════════════════════════ */}
          {showConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95">
                <div className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">Konfirmasi Pengeluaran</h2>
                      <p className="text-xs text-muted-foreground">Pastikan data sudah benar</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium">{formatDate(tanggal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kategori</span>
                      <Badge variant="outline" className="text-xs">{kategori}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deskripsi</span>
                      <span className="text-right max-w-[200px]">{deskripsi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {formatRupiah(parseInt(jumlah) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metode</span>
                      <span className="capitalize">{metode}</span>
                    </div>
                    {catatan.trim() && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Catatan</span>
                        <span className="text-right max-w-[200px] text-xs">{catatan}</span>
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
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
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

          {/* ═════════════════════════════════════════════════════════════╗
           ║  HISTORY TABLE                                              ║
           ╚══════════════════════════════════════════════════════════════ */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Riwayat Pengeluaran</CardTitle>
                  <Badge variant="outline" className="text-xs font-mono ml-1">
                    {expenses.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengeluaran..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="border-border/60 bg-background/60 pl-9 h-9 text-sm"
                  />
                </div>
                {/* Kategori filter badges */}
                {uniqueCategories.map((kat) => (
                  <Badge
                    key={kat}
                    variant={kategoriFilter === kat ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setKategoriFilter(kategoriFilter === kat ? null : kat)}
                  >
                    {KATEGORI_ICONS[kat] || "📋"} {kat}
                  </Badge>
                ))}
                {kategoriFilter && (
                  <button
                    onClick={() => setKategoriFilter(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reset filter
                  </button>
                )}
              </div>

              {expenses.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Belum ada pengeluaran"
                  description={'Catat pengeluaran harian Anda dengan klik tombol "Catat Pengeluaran" di atas.'}
                />
              ) : filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="Tidak ada pengeluaran ditemukan"
                  description={historySearch ? `Tidak ada pengeluaran yang cocok dengan "${historySearch}"` : "Tidak ada pengeluaran untuk kategori ini"}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setHistorySearch(""); setKategoriFilter(null); }}
                    >
                      Reset Filter
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-center">Metode</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right w-16">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((exp) => (
                        <TableRow key={exp.id} className="even:bg-amber-50/30 dark:even:bg-amber-950/10">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(exp.tanggal)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal">
                              <span className="mr-1">{KATEGORI_ICONS[exp.kategori] || "📋"}</span>
                              {exp.kategori}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{exp.deskripsi}</p>
                              {exp.catatan && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{exp.catatan}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {exp.metode === "tunai" ? (
                              <Wallet className="h-3.5 w-3.5 inline text-emerald-500" />
                            ) : exp.metode === "transfer" ? (
                              <Smartphone className="h-3.5 w-3.5 inline text-blue-500" />
                            ) : (
                              <CreditCard className="h-3.5 w-3.5 inline text-purple-500" />
                            )}
                            <span className="text-xs text-muted-foreground ml-1 capitalize">{exp.metode}</span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                            {formatRupiah(exp.jumlah)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {exp.user_name || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleDelete(exp.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Total summary */}
              {filteredExpenses.length > 0 && (
                <div className="flex items-center justify-between px-2 py-2 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">
                    Menampilkan {filteredExpenses.length} dari {expenses.length} pengeluaran
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    Total: {formatRupiah(filteredExpenses.reduce((s, e) => s + e.jumlah, 0))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
