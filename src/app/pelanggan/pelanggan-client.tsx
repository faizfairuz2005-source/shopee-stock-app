"use client";

import { useState, useTransition } from "react";
import {
  Search,
  UserPlus,
  X,
  Users,
  Phone,
  Mail,
  ShoppingCart,
  Receipt,
  BadgePercent,
  Calendar,
  TrendingUp,
  Eye,
  Trash2,
  MoreHorizontal,
  Pencil,
  History,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/toast";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import type { Customer, CustomerOrder } from "./actions";
import type { PoinHistoryEntry } from "@/app/actions";
import {
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getPoinHistory,
  adjustPoin,
} from "./actions";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLIENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PelangganClientProps {
  initialCustomers: Customer[];
}

export function PelangganClient({ initialCustomers }: PelangganClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Customer form modal
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nomor_hp: "",
    email: "",
    alamat: "",
    catatan: "",
  });

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Adjust Poin modal
  const [showAdjustPoin, setShowAdjustPoin] = useState(false);
  const [adjustingPoinCustomer, setAdjustingPoinCustomer] = useState<Customer | null>(null);
  const [adjustPoinJumlah, setAdjustPoinJumlah] = useState("");
  const [adjustPoinAlasan, setAdjustPoinAlasan] = useState("");

  // Detail / History modal
  const [showHistory, setShowHistory] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [historyOrders, setHistoryOrders] = useState<CustomerOrder[]>([]);
  const [historyPoin, setHistoryPoin] = useState<PoinHistoryEntry[]>([]);
  const [historyTab, setHistoryTab] = useState<"transactions" | "poin">("transactions");

  // ─── Computed ──────────────────────────────────────────────────

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nama_lengkap.toLowerCase().includes(q) ||
      c.nomor_hp.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const totalCustomers = customers.length;
  const totalTransactionValue = customers.reduce(
    (sum, c) => sum + c.total_transaksi,
    0
  );

  // ─── Form handlers ──────────────────────────────────────────────

  const openAddForm = () => {
    setEditingCustomer(null);
    setFormData({
      nama_lengkap: "",
      nomor_hp: "",
      email: "",
      alamat: "",
      catatan: "",
    });
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      nama_lengkap: customer.nama_lengkap,
      nomor_hp: customer.nomor_hp,
      email: customer.email,
      alamat: customer.alamat,
      catatan: customer.catatan,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.nama_lengkap.trim()) {
      toast.error("Nama lengkap harus diisi");
      return;
    }
    if (!formData.nomor_hp.trim()) {
      toast.error("Nomor HP harus diisi");
      return;
    }

    startTransition(async () => {
      if (editingCustomer) {
        // Update existing
        const result = await updateCustomer(editingCustomer.id, formData);
        if (result.success && result.customer) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === editingCustomer.id ? result.customer! : c
            )
          );
          toast.success("Pelanggan berhasil diupdate");
          setShowForm(false);
        } else {
          toast.error(result.error || "Gagal mengupdate pelanggan");
        }
      } else {
        // Add new
        const result = await addCustomer(formData);
        if (result.success && result.customer) {
          setCustomers((prev) => [result.customer!, ...prev]);
          toast.success("Pelanggan baru berhasil ditambahkan");
          setShowForm(false);
        } else {
          toast.error(result.error || "Gagal menambahkan pelanggan");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deletingCustomer) return;

    startTransition(async () => {
      const result = await deleteCustomer(deletingCustomer.id);
      if (result.success) {
        setCustomers((prev) =>
          prev.filter((c) => c.id !== deletingCustomer.id)
        );
        toast.success("Pelanggan berhasil dihapus");
        setShowDelete(false);
        setDeletingCustomer(null);
      } else {
        toast.error(result.error || "Gagal menghapus pelanggan");
      }
    });
  };

  const openHistory = (customer: Customer) => {
    setHistoryCustomer(customer);
    setShowHistory(true);
    setHistoryTab("transactions");
    setIsLoadingOrders(true);
    setHistoryPoin([]);

    startTransition(async () => {
      const result = await getCustomerOrders(customer.nama_lengkap);
      setHistoryOrders(result.orders);
      setIsLoadingOrders(false);
    });
  };

  const openPoinHistory = async (customer: Customer) => {
    setHistoryCustomer(customer);
    setShowHistory(true);
    setHistoryTab("poin");
    setHistoryOrders([]);
    setIsLoadingOrders(true);

    startTransition(async () => {
      const result = await getPoinHistory(customer.nama_lengkap);
      setHistoryPoin(result.entries);
      setIsLoadingOrders(false);
    });
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pelanggan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data pelanggan dan riwayat transaksi
          </p>
        </div>
        <Button className="gap-2" onClick={openAddForm}>
          <UserPlus className="h-4 w-4" />
          Tambah Pelanggan Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pelanggan
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCustomers}</p>
            <p className="text-xs text-muted-foreground">
              Pelanggan terdaftar
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Nilai Transaksi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalTransactionValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Akumulasi dari semua transaksi
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata per Pelanggan
            </CardTitle>
            <BadgePercent className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalCustomers > 0
                ? formatCurrency(
                    Math.round(totalTransactionValue / totalCustomers)
                  )
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalCustomers > 0
                ? `${formatCurrency(
                    Math.round(totalTransactionValue / totalCustomers)
                  )} per pelanggan`
                : "Belum ada data transaksi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pelanggan</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, nomor HP, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Tidak ada pelanggan ditemukan"
              description={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada pelanggan terdaftar. Tambahkan pelanggan baru untuk memulai."
              }
              action={
                search ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                ) : (
                  <Button className="gap-2" onClick={openAddForm}>
                    <UserPlus className="h-4 w-4" />
                    Tambah Pelanggan
                  </Button>
                )
              }
            />
          ) : (
            <div className="rounded-md border table-responsive">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Transaksi</TableHead>
                    <TableHead className="text-center">Poin</TableHead>
                    <TableHead className="text-center">Pesanan</TableHead>
                    <TableHead>Terakhir Transaksi</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => openHistory(customer)}
                    >
                      <TableCell data-label="Nama">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {customer.nama_lengkap}
                            </p>
                            {customer.alamat && (
                              <p className="text-[11px] text-muted-foreground/60 line-clamp-1 max-w-[200px]">
                                {customer.alamat}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-label="No. HP">
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground/50" />
                          {customer.nomor_hp}
                        </span>
                      </TableCell>
                      <TableCell data-label="Email">
                        {customer.email ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground/50" />
                            {customer.email}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 italic">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-label="Total">
                        <span className="font-semibold tabular-nums text-sm">
                          {formatCurrency(customer.total_transaksi)}
                        </span>
                      </TableCell>
                      <TableCell data-label="Poin" className="text-center">
                        {customer.total_poin > 0 ? (
                          <Badge
                            className="cursor-pointer bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800/50 border-0 text-xs font-semibold transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPoinHistory(customer);
                            }}
                          >
                            {customer.total_poin}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Pesanan" className="text-center">
                        <Badge variant="outline" className="text-xs font-mono tabular-nums">
                          {customer.total_orders ?? 0}x
                        </Badge>
                      </TableCell>
                      <TableCell data-label="Terakhir" className="text-sm text-muted-foreground">
                        {formatDate(customer.terakhir_transaksi)}
                      </TableCell>
                      <TableCell data-label="Aksi" className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => openHistory(customer)}
                            title="Lihat Riwayat Transaksi"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>                            <DropdownMenu>
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
                                className="cursor-pointer"
                                onClick={() => openEditForm(customer)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Pelanggan
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => {
                                  setAdjustingPoinCustomer(customer);
                                  setAdjustPoinJumlah("");
                                  setAdjustPoinAlasan("");
                                  setShowAdjustPoin(true);
                                }}
                              >
                                <BadgePercent className="mr-2 h-4 w-4" />
                                Atur Poin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => {
                                  setDeletingCustomer(customer);
                                  setShowDelete(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  ADD / EDIT CUSTOMER MODAL                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Ubah data pelanggan yang sudah terdaftar"
                : "Masukkan data pelanggan baru untuk dicatat dalam sistem"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Nama Lengkap
                </Label>
                <Input
                  id="nama"
                  placeholder="Nama pelanggan"
                  value={formData.nama_lengkap}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nama_lengkap: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hp" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Nomor HP
                </Label>
                <Input
                  id="hp"
                  placeholder="0812-3456-7890"
                  value={formData.nomor_hp}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nomor_hp: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="pelanggan@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <textarea
                id="alamat"
                rows={2}
                placeholder="Jl. Raya No. 123, Jakarta"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, alamat: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan</Label>
              <textarea
                id="catatan"
                rows={2}
                placeholder="Catatan khusus tentang pelanggan ini..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.catatan}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, catatan: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : editingCustomer
                  ? "Simpan Perubahan"
                  : "Tambah Pelanggan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  DELETE CONFIRMATION                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Hapus Pelanggan
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-medium text-foreground">
                {deletingCustomer?.nama_lengkap}
              </span>
              ? Tindakan ini tidak dapat dibatalkan. Data transaksi pelanggan
              ini akan tetap tersimpan di laporan penjualan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDelete(false);
                setDeletingCustomer(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  ADJUST POIN MODAL                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showAdjustPoin} onOpenChange={setShowAdjustPoin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-amber-500" />
              Atur Poin — {adjustingPoinCustomer?.nama_lengkap}
            </DialogTitle>
            <DialogDescription>
              Tambah atau kurangi poin reward pelanggan.
              Saldo saat ini:{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {adjustingPoinCustomer?.total_poin ?? 0} poin
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="adjust-jumlah">
                Jumlah Poin
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    +
                  </span>
                  <Input
                    id="adjust-jumlah"
                    type="number"
                    min="1"
                    placeholder="Masukkan jumlah poin"
                    value={adjustPoinJumlah}
                    onChange={(e) => setAdjustPoinJumlah(e.target.value)}
                    className="pl-7 border-border/60"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setAdjustPoinJumlah(prev => prev.startsWith("-") ? prev.slice(1) : `-${prev}`)}
                  title="Toggle kurangi/tambah"
                >
                  <span className="text-sm font-bold">
                    {adjustPoinJumlah.startsWith("-") ? "+" : "−"}
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gunakan tombol <strong>±</strong> untuk toggle tambah/kurangi.
                Poin tidak bisa menjadi negatif.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-alasan" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Alasan
              </Label>
              <textarea
                id="adjust-alasan"
                rows={2}
                placeholder="Contoh: Bonus poin ulang tahun, koreksi transaksi, dll."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={adjustPoinAlasan}
                onChange={(e) => setAdjustPoinAlasan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustPoin(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (!adjustingPoinCustomer) return;
                const jumlah = Number(adjustPoinJumlah);
                if (!jumlah || jumlah === 0) {
                  toast.error("Jumlah poin harus diisi");
                  return;
                }
                if (!adjustPoinAlasan.trim()) {
                  toast.error("Alasan penyesuaian wajib diisi");
                  return;
                }

                startTransition(async () => {
                  const result = await adjustPoin(
                    adjustingPoinCustomer.nama_lengkap,
                    jumlah,
                    adjustPoinAlasan.trim()
                  );
                  if (result.success && result.customer) {
                    setCustomers((prev) =>
                      prev.map((c) =>
                        c.id === adjustingPoinCustomer.id ? { ...c, total_poin: result.customer!.total_poin } : c
                      )
                    );
                    toast.success(
                      jumlah > 0
                        ? `${jumlah} poin berhasil ditambahkan`
                        : `${Math.abs(jumlah)} poin berhasil dikurangi`
                    );
                    setShowAdjustPoin(false);
                  } else {
                    toast.error(result.error || "Gagal menyesuaikan poin");
                  }
                });
              }}
              disabled={isPending || !adjustPoinJumlah || Number(adjustPoinJumlah) === 0}
            >
              {isPending
                ? "Menyimpan..."
                : adjustPoinJumlah.startsWith("-")
                  ? "Kurangi Poin"
                  : "Tambah Poin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  TRANSACTION HISTORY MODAL                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {historyCustomer?.nama_lengkap}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap gap-4 mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {historyCustomer?.nomor_hp}
                </span>
                {historyCustomer?.email && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {historyCustomer?.email}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <ShoppingCart className="h-3 w-3" />
                  Total: {formatCurrency(historyCustomer?.total_transaksi || 0)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Receipt className="h-3 w-3" />
                  {historyCustomer?.total_orders ?? 0} transaksi
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <BadgePercent className="h-3 w-3" />
                  {(historyCustomer?.total_poin ?? 0) > 0 ? `${historyCustomer?.total_poin} poin` : "0 poin"}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted/60 p-1 -mx-6 px-6 border-y border-border/40">
            <button
              onClick={() => setHistoryTab("transactions")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                historyTab === "transactions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Receipt className="h-4 w-4" />
                Transaksi
              </div>
            </button>
            <button
              onClick={() => {
                setHistoryTab("poin");
                if (historyPoin.length === 0 && historyCustomer) {
                  setIsLoadingOrders(true);
                  startTransition(async () => {
                    const result = await getPoinHistory(historyCustomer.nama_lengkap);
                    setHistoryPoin(result.entries);
                    setIsLoadingOrders(false);
                  });
                }
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                historyTab === "poin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <BadgePercent className="h-4 w-4" />
                Riwayat Poin
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {isLoadingOrders ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : historyTab === "transactions" ? (
              /* ─── TRANSACTIONS TAB ─── */
              historyOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Belum ada transaksi
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Pelanggan ini belum melakukan transaksi di sistem
                  </p>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                  {historyOrders.map((order) => (
                    <div
                      key={order.nomor_order}
                      className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {order.nomor_order}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(order.tanggal_pesanan)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {order.seller_name}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-primary tabular-nums">
                          {formatCurrency(order.grand_total)}
                        </p>
                      </div>

                      {/* Order Items */}
                      <div className="rounded-lg bg-muted/30 p-2.5 space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground truncate flex-1">
                              {item.nama_produk}
                              <span className="text-muted-foreground/50 ml-1">
                                x{item.quantity}
                              </span>
                            </span>
                            <span className="font-medium tabular-nums ml-2">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* ─── POIN HISTORY TAB ─── */
              historyPoin.length === 0 ? (
                <div className="py-12 text-center">
                  <BadgePercent className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Belum ada riwayat poin
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Riwayat poin akan muncul setiap kali pelanggan melakukan transaksi atau meredeem poin
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  {historyPoin.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border/60 bg-card p-3.5 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              entry.tipe === "earned"
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                : entry.tipe === "redeemed"
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                            }`}
                          >
                            {entry.tipe === "earned" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : entry.tipe === "redeemed" ? (
                              <BadgePercent className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {entry.tipe === "earned"
                                ? "Poin Didapatkan"
                                : entry.tipe === "redeemed"
                                  ? "Poin Digunakan"
                                  : "Penyesuaian Poin"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.detail}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(entry.tanggal)}
                              <span className="mx-1">·</span>
                              Ref: {entry.referensi}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p
                            className={`text-sm font-bold tabular-nums ${
                              entry.jumlah > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : entry.jumlah < 0
                                  ? "text-amber-600 dark:text-amber-400"
                                  : ""
                            }`}
                          >
                            {entry.jumlah > 0 ? "+" : ""}{entry.jumlah}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60">
                            Saldo: {entry.saldo_setelah}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-2">
            <p className="text-xs text-muted-foreground">
              {historyTab === "transactions"
                ? `${historyOrders.length} transaksi ditemukan`
                : `${historyPoin.length} entri poin`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(false)}
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
