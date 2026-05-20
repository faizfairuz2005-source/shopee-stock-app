"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  History,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  RefreshCw,
  UserCircle,
  FileText,
  HardDrive,
  Package,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Settings,
  LogIn,
  LogOut,
  AlertTriangle,
} from "lucide-react";

import { getLocalAuditLogs } from "@/lib/audit";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AuditAction } from "@/lib/audit";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: string;
  ip_address: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return formatDate(dateStr);
}

function getActionIcon(action: string) {
  if (action.startsWith("login")) return LogIn;
  if (action.startsWith("logout")) return LogOut;
  if (action.startsWith("product.") || action.startsWith("stock.")) return Package;
  if (action.startsWith("order.") || action === "pos.transaction") return ShoppingCart;
  if (action.startsWith("goods_receipt.")) return Receipt;
  if (action.startsWith("goods_return.")) return RotateCcw;
  if (action.startsWith("supplier.")) return HardDrive;
  if (action.startsWith("category.") || action.startsWith("rack.")) return FileText;
  if (action.startsWith("customer.")) return Users;
  if (action.startsWith("user.") || action.startsWith("settings.")) return Settings;
  if (action.startsWith("expense.")) return Receipt;
  if (action.startsWith("kit.")) return Package;
  if (action.startsWith("backup.")) return HardDrive;
  return History;
}

function getActionColor(action: string): string {
  if (action.includes(".create") || action === "pos.transaction" || action.includes(".earned"))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (action.includes(".delete") || action.includes(".deactivate") || action.includes(".failed"))
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (action.includes(".update") || action.includes(".edit") || action.includes(".change"))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  if (action.includes("login") || action.includes("logout"))
    return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  if (action.startsWith("backup.") || action.startsWith("export."))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function formatActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "login": "Login",
    "logout": "Logout",
    "login.failed": "Login Gagal",
    "product.create": "Tambah Produk",
    "product.update": "Update Produk",
    "product.delete": "Hapus Produk",
    "product.import": "Import Produk",
    "stock.adjust": "Adjust Stok",
    "stock.transfer_rack": "Transfer Rak",
    "stock.bulk_update": "Update Stok Massal",
    "order.create": "Buat Pesanan",
    "order.update": "Update Pesanan",
    "order.delete": "Hapus Pesanan",
    "pos.transaction": "Transaksi POS",
    "goods_return.create": "Retur Barang",
    "goods_receipt.create": "Barang Masuk",
    "expense.create": "Tambah Pengeluaran",
    "expense.delete": "Hapus Pengeluaran",
    "supplier.create": "Tambah Supplier",
    "supplier.update": "Update Supplier",
    "supplier.delete": "Hapus Supplier",
    "category.create": "Tambah Kategori",
    "category.update": "Update Kategori",
    "category.delete": "Hapus Kategori",
    "rack.create": "Tambah Rak",
    "rack.update": "Update Rak",
    "rack.delete": "Hapus Rak",
    "kit.create": "Tambah Paket",
    "kit.update": "Update Paket",
    "kit.delete": "Hapus Paket",
    "customer.create": "Tambah Pelanggan",
    "customer.update": "Update Pelanggan",
    "customer.delete": "Hapus Pelanggan",
    "user.invite": "Undang Pengguna",
    "user.role_change": "Ubah Role",
    "user.activate": "Aktivasi Pengguna",
    "user.deactivate": "Nonaktifkan Pengguna",
    "settings.update": "Update Settings",
    "backup.export_json": "Export JSON",
    "backup.export_csv": "Export CSV",
    "backup.download": "Download Backup",
    "backup.delete": "Hapus Backup",
    "backup.restore": "Restore Database",
  };
  return labels[action] || action;
}

function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    product: "Produk",
    order: "Pesanan",
    user: "Pengguna",
    receipt: "Barang Masuk",
    supplier: "Supplier",
    expense: "Pengeluaran",
    return: "Retur",
    customer: "Pelanggan",
    category: "Kategori",
    rack: "Rak",
    adjustment: "Penyesuaian",
    settings: "Pengaturan",
    auth: "Autentikasi",
    kit: "Paket Barang",
    backup: "Backup",
  };
  return labels[type] || type;
}

// ─── Action/Entity type filter options ─────────────────────────────────────

const ACTION_TYPES = [
  "login", "logout", "login.failed",
  "product.create", "product.update", "product.delete",
  "stock.adjust", "stock.transfer_rak",
  "order.create", "pos.transaction",
  "goods_receipt.create", "goods_return.create",
  "expense.create", "expense.delete",
  "supplier.create", "supplier.update", "supplier.delete",
  "customer.create", "customer.update", "customer.delete",
  "category.create", "rack.create",
  "kit.create", "kit.update", "kit.delete",
  "user.invite", "user.role_change", "user.activate", "user.deactivate",
  "settings.update",
  "backup.export_json", "backup.export_csv", "backup.restore",
];

const ENTITY_TYPES = [
  "product", "order", "user", "receipt", "supplier", "expense",
  "return", "customer", "category", "rack", "adjustment", "settings",
  "auth", "kit", "backup",
];

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLIENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ActivityClient() {
  // ─── State ────────────────────────────────────────────────────────

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Expanded detail row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Fetch logs ──────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((page - 1) * pageSize));
      if (search) params.set("search", search);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entity_type", entityFilter);
      if (dateFrom) params.set("start_date", new Date(dateFrom).toISOString());
      if (dateTo) params.set("end_date", new Date(dateTo + "T23:59:59").toISOString());

      // Fetch logs from local file via server action
      const result = await getLocalAuditLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: search || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        entity_type: entityFilter !== "all" ? entityFilter : undefined,
        start_date: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        end_date: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
      });

      if (result.success && result.data) {
        setLogs(result.data);
        setTotal(result.total ?? 0);
      } else {
        setError(result.error || "Gagal memuat log aktivitas");
        setLogs([]);
        setTotal(0);
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ─── Computed ────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const stats = useMemo(() => {
    if (!logs.length) return { totalEvents: total, uniqueUsers: 0, todayCount: 0 };
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalEvents: total,
      uniqueUsers: new Set(logs.map((l) => l.user_name)).size,
      todayCount: logs.filter((l) => l.created_at.startsWith(today)).length,
    };
  }, [logs, total]);

  // ─── Reset page when filters change ──────────────────────────────

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleActionFilter = (val: string) => {
    setActionFilter(val);
    setPage(1);
  };

  const handleEntityFilter = (val: string) => {
    setEntityFilter(val);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setEntityFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = search || actionFilter !== "all" || entityFilter !== "all" || dateFrom || dateTo;

  // ─── Parse details ───────────────────────────────────────────────

  const parseDetails = (detailsStr: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(detailsStr);
      if (parsed && typeof parsed === "object") return parsed;
      return null;
    } catch {
      return null;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Riwayat Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log aktivitas semua pengguna dalam sistem
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <History className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground">Aktivitas tercatat</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Pengguna melakukan aktivitas</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.todayCount}</p>
            <p className="text-xs text-muted-foreground">Events terjadi hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Cari</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari user, action, entity..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Action Type Filter */}
            <div className="w-48">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tipe Aksi</Label>
              <Select value={actionFilter} onValueChange={handleActionFilter}>
                <SelectTrigger className="border-border/60 bg-background/60 shadow-none">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {formatActionLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type Filter */}
            <div className="w-44">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tipe Entitas</Label>
              <Select value={entityFilter} onValueChange={handleEntityFilter}>
                <SelectTrigger className="border-border/60 bg-background/60 shadow-none">
                  <SelectValue placeholder="Semua Entitas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Entitas</SelectItem>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {getEntityTypeLabel(e)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Dari</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-40 border-border/60 bg-background/60 shadow-none"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Sampai</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-40 border-border/60 bg-background/60 shadow-none"
              />
            </div>

            {/* Clear */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-10" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Log Aktivitas
              {!loading && <span className="ml-2 text-sm font-normal text-muted-foreground">({total.toLocaleString("id-ID")} entri)</span>}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Halaman {page} dari {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-300 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Gagal memuat data</p>
              <p className="text-xs text-muted-foreground/50 mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum ada aktivitas"
              description={
                hasActiveFilters
                  ? `Tidak ada hasil untuk filter yang dipilih`
                  : "Belum ada aktivitas yang tercatat di sistem."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" className="gap-2" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Waktu</TableHead>
                    <TableHead className="w-[140px]">User</TableHead>
                    <TableHead className="w-[200px]">Aksi</TableHead>
                    <TableHead>Entitas</TableHead>
                    <TableHead className="w-[120px] text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id;
                    const Icon = getActionIcon(log.action);
                    const details = parseDetails(log.details);

                    return (
                      <TableRow
                        key={log.id}
                        className={cn(
                          "transition-colors",
                          isExpanded && "bg-muted/30",
                          "hover:bg-muted/50"
                        )}
                      >
                        <TableCell className="align-top">
                          <div className="flex flex-col">
                            <span className="text-xs tabular-nums text-foreground">
                              {formatDateTime(log.created_at)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/60 mt-0.5">
                              {formatRelativeTime(log.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-1.5">
                            <UserCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <span className="text-sm truncate max-w-[120px]">
                              {log.user_name || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2">
                            <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", getActionColor(log.action))}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-normal border-0", getActionColor(log.action))}
                            >
                              {formatActionLabel(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">
                              {getEntityTypeLabel(log.entity_type)}
                            </span>
                            {log.entity_name && (
                              <span className="text-sm font-medium truncate max-w-[200px]">
                                {log.entity_name}
                              </span>
                            )}
                            {log.entity_id && (
                              <span className="text-[11px] text-muted-foreground/50 font-mono">
                                {log.entity_id}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            disabled={!details && !log.entity_name}
                            title={details ? "Lihat detail" : "Tidak ada detail"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Expanded Details Panel */}
          {expandedId && (() => {
            const log = logs.find((l) => l.id === expandedId);
            if (!log) return null;
            const details = parseDetails(log.details);
            if (!details) return null;

            return (
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Detail Activity
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => setExpandedId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="space-y-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                        {key.replace(/_/g, " ")}
                      </span>
                      <p className="text-sm font-mono tabular-nums text-foreground break-all">
                        {value !== null && value !== undefined
                          ? typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)
                          : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total.toLocaleString("id-ID")} entri
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Sebelumnya
                </Button>
                <span className="px-3 text-xs text-muted-foreground tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
