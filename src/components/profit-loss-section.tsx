"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Banknote,
  BarChart3,
  Landmark,
  Minus,
  PiggyBank,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Order, StockAdjustment, GoodsReturn, Expense } from "@/app/actions";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

const MONTHS_INA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface MonthlyPL {
  month: number;
  year: number;
  revenue: number;
  hpp: number;
  operationalCosts: number;
  grossProfit: number;
  netProfit: number;
  orderCount: number;
}

function computeMonthlyPL(orders: Order[]): MonthlyPL[] {
  const monthMap = new Map<string, { revenue: number; hpp: number; orderCount: number }>();

  for (const order of orders) {
    const key = order.tanggal_pesanan.slice(0, 7);
    const existing = monthMap.get(key) ?? { revenue: 0, hpp: 0, orderCount: 0 };

    existing.revenue += order.grand_total;
    existing.orderCount += 1;

    for (const item of order.items) {
      existing.hpp += (item.hpp ?? Math.round(item.harga * 0.6)) * item.quantity;
    }

    monthMap.set(key, existing);
  }

  const result: MonthlyPL[] = [];

  for (const [key, data] of monthMap) {
    const [yearStr, monthStr] = key.split("-");
    const month = parseInt(monthStr, 10) - 1;
    const year = parseInt(yearStr, 10);

    const grossProfit = data.revenue - data.hpp;
    const operationalCosts = 0; // Will be replaced by real expenses in the component
    const netProfit = grossProfit - operationalCosts;

    result.push({
      month,
      year,
      revenue: data.revenue,
      hpp: data.hpp,
      operationalCosts,
      grossProfit,
      netProfit,
      orderCount: data.orderCount,
    });
  }

  return result.sort((a, b) => a.year - b.year || a.month - b.month);
}

function getExpenseTotal(expenses: Expense[], month: number, year: number): number {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return expenses
    .filter((e) => e.tanggal.startsWith(prefix))
    .reduce((sum, e) => sum + e.jumlah, 0);
}

function getComparison(current: number, previous: number) {
  if (previous === 0) return { pct: 0, direction: "flat" as const };
  const pct = ((current - previous) / previous) * 100;
  return {
    pct: Math.abs(pct),
    direction: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("flat" as const),
  };
}

interface StoreBreakdown {
  store: string;
  revenue: number;
  hpp: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
}

function getStoreBreakdown(orders: Order[], month: number, year: number): StoreBreakdown[] {
  const filtered = orders.filter((o) => {
    const d = o.tanggal_pesanan.slice(0, 7);
    return d === `${year}-${String(month + 1).padStart(2, "0")}`;
  });

  const sellerMap = new Map<string, { revenue: number; hpp: number }>();

  for (const order of filtered) {
    const existing = sellerMap.get(order.seller_name) ?? { revenue: 0, hpp: 0 };
    existing.revenue += order.grand_total;
    for (const item of order.items) {
      existing.hpp += (item.hpp ?? Math.round(item.harga * 0.6)) * item.quantity;
    }
    sellerMap.set(order.seller_name, existing);
  }

  return Array.from(sellerMap.entries()).map(([store, data]) => {
    const gp = data.revenue - data.hpp;
    const opCost = Math.round(data.revenue * 0.2);
    const np = gp - opCost;
    return {
      store,
      revenue: data.revenue,
      hpp: data.hpp,
      grossProfit: gp,
      netProfit: np,
      margin: data.revenue > 0 ? (np / data.revenue) * 100 : 0,
    };
  });
}

export default function ProfitLossSection({
  orders,
  stockAdjustments,
  goodsReturns,
  expenses,
}: {
  orders: Order[];
  stockAdjustments?: StockAdjustment[];
  goodsReturns?: GoodsReturn[];
  expenses?: Expense[];
}) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const allData = useMemo(() => computeMonthlyPL(orders), [orders]);

  // ── Compute stock adjustment losses for selected month ──────────────
  const adjustmentLossesThisMonth = useMemo(() => {
    if (!stockAdjustments || stockAdjustments.length === 0) return 0;
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return stockAdjustments
      .filter((a) => a.created_at?.startsWith(prefix) && a.nilai_kerugian)
      .reduce((sum, a) => sum + (a.nilai_kerugian || 0), 0);
  }, [stockAdjustments, selectedMonth, selectedYear]);

  const adjustmentLossesPrevMonth = useMemo(() => {
    if (!stockAdjustments || stockAdjustments.length === 0) return 0;
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    const prefix = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
    return stockAdjustments
      .filter((a) => a.created_at?.startsWith(prefix) && a.nilai_kerugian)
      .reduce((sum, a) => sum + (a.nilai_kerugian || 0), 0);
  }, [stockAdjustments, selectedMonth, selectedYear]);

  // ── Return losses for selected & previous month ────────────────
  // Total refund (uang ke pelanggan) + HPP loss (barang rusak tidak bisa dijual)
  const returnTotalLoss = (r: GoodsReturn) => r.total_refund + (r.hpp_loss || 0);

  const returnLossesThisMonth = useMemo(() => {
    if (!goodsReturns || goodsReturns.length === 0) return 0;
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return goodsReturns
      .filter((r) => r.tanggal.startsWith(prefix))
      .reduce((sum, r) => sum + returnTotalLoss(r), 0);
  }, [goodsReturns, selectedMonth, selectedYear]);

  const returnLossesPrevMonth = useMemo(() => {
    if (!goodsReturns || goodsReturns.length === 0) return 0;
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    const prefix = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
    return goodsReturns
      .filter((r) => r.tanggal.startsWith(prefix))
      .reduce((sum, r) => sum + returnTotalLoss(r), 0);
  }, [goodsReturns, selectedMonth, selectedYear]);

  // ── HPP loss from damaged returns (separate breakdown) ──────────
  const returnHppLossThisMonth = useMemo(() => {
    if (!goodsReturns || goodsReturns.length === 0) return 0;
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return goodsReturns
      .filter((r) => r.tanggal.startsWith(prefix))
      .reduce((sum, r) => sum + (r.hpp_loss || 0), 0);
  }, [goodsReturns, selectedMonth, selectedYear]);

  const returnHppLossPrevMonth = useMemo(() => {
    if (!goodsReturns || goodsReturns.length === 0) return 0;
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    const prefix = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
    return goodsReturns
      .filter((r) => r.tanggal.startsWith(prefix))
      .reduce((sum, r) => sum + (r.hpp_loss || 0), 0);
  }, [goodsReturns, selectedMonth, selectedYear]);

  // ── Real Operational Costs from Expense Data ─────────────────
  const realOperationalCosts = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    return getExpenseTotal(expenses, selectedMonth, selectedYear);
  }, [expenses, selectedMonth, selectedYear]);

  const realOperationalCostsPrev = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }
    return getExpenseTotal(expenses, prevMonth, prevYear);
  }, [expenses, selectedMonth, selectedYear]);

  const currentPL = useMemo(
    () => allData.find((d) => d.month === selectedMonth && d.year === selectedYear),
    [allData, selectedMonth, selectedYear],
  );

  const previousPL = useMemo(() => {
    if (selectedMonth === 0)
      return allData.find((d) => d.month === 11 && d.year === selectedYear - 1);
    return allData.find((d) => d.month === selectedMonth - 1 && d.year === selectedYear);
  }, [allData, selectedMonth, selectedYear]);

  const trendData = useMemo(() => {
    const result: MonthlyPL[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - i, 1);
      const pl = allData.find((x) => x.month === d.getMonth() && x.year === d.getFullYear());
      if (pl) {
        // Use real expenses for trend data if available
        const expTotal = expenses ? getExpenseTotal(expenses, d.getMonth(), d.getFullYear()) : 0;
        result.push({ ...pl, operationalCosts: expTotal, netProfit: pl.grossProfit - expTotal });
      }
    }
    return result;
  }, [allData, selectedMonth, selectedYear, expenses]);

  const storeBreakdown = useMemo(
    () => getStoreBreakdown(orders, selectedMonth, selectedYear),
    [orders, selectedMonth, selectedYear],
  );

  const years = useMemo(() => {
    const set = new Set(allData.map((d) => d.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [allData]);

  if (!currentPL) return null;

  const totalDeductions = adjustmentLossesThisMonth + returnLossesThisMonth + realOperationalCosts;
  const totalPrevDeductions = adjustmentLossesPrevMonth + returnLossesPrevMonth + realOperationalCostsPrev;
  const netProfit = currentPL.grossProfit - totalDeductions;
  const prevNetProfit = (previousPL?.grossProfit ?? 0) - totalPrevDeductions;

  const comparisons = [
    { label: "Pendapatan", value: currentPL.revenue, prev: previousPL?.revenue ?? 0, icon: Banknote },
    { label: "HPP", value: currentPL.hpp, prev: previousPL?.hpp ?? 0, icon: TrendingDown },
    { label: "Laba Kotor", value: currentPL.grossProfit, prev: previousPL?.grossProfit ?? 0, icon: TrendingUp },
    { label: "Kerugian Stok", value: adjustmentLossesThisMonth, prev: adjustmentLossesPrevMonth, icon: AlertCircle },
    { label: "Retur", value: returnLossesThisMonth, prev: returnLossesPrevMonth, icon: RotateCcw },
    ...(returnHppLossThisMonth > 0 ? [{ label: "Retur (HPP Rusak)", value: returnHppLossThisMonth, prev: returnHppLossPrevMonth, icon: AlertCircle }] : []),
    { label: "Biaya Operasional", value: realOperationalCosts, prev: realOperationalCostsPrev, icon: Wallet },
    { label: "Laba Bersih", value: netProfit, prev: prevNetProfit, icon: PiggyBank },
  ];

  const maxChartValue = Math.max(...trendData.map((d) => Math.max(d.grossProfit, d.netProfit)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Profit & Loss</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {MONTHS_INA.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Tahun:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {comparisons.map((item) => {
          const comp = getComparison(item.value, item.prev);
          return (
            <Card key={item.label} className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <item.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold tabular-nums">{formatRupiah(item.value)}</p>
                <div className="mt-1 flex items-center gap-1">
                  {comp.direction === "up" ? (
                    <ArrowUp className="h-3.5 w-3.5 text-success" />
                  ) : comp.direction === "down" ? (
                    <ArrowDown className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      comp.direction === "up"
                        ? "text-success"
                        : comp.direction === "down"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {comp.pct.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs bln lalu</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══ Pemasukan vs Pengeluaran Comparison ═══ */}
      <div className="rounded-2xl border-2 border-border/60 bg-gradient-to-br from-primary/5 via-background to-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Pemasukan vs Pengeluaran</h3>
            <p className="text-xs text-muted-foreground">
              Perbandingan pendapatan dan biaya — {MONTHS_INA[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Pemasukan */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/10 border border-emerald-200/60 dark:border-emerald-800/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-foreground">Pemasukan</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatRupiah(currentPL.revenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total pendapatan penjualan</p>
          </div>

          {/* Pengeluaran */}
          <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-50/30 dark:from-red-950/20 dark:to-red-950/10 border border-red-200/60 dark:border-red-800/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-semibold text-foreground">Pengeluaran</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatRupiah(totalDeductions + currentPL.hpp)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              HPP + Biaya Operasional + Kerugian Stok + Retur
            </p>
          </div>

          {/* Selisih (Laba/Rugi Bersih) */}
          <div className={`rounded-xl bg-gradient-to-br p-4 ${
            netProfit >= 0
              ? "from-primary/5 to-primary/5 border border-primary/20"
              : "from-red-50 to-red-50/30 dark:from-red-950/20 dark:to-red-950/10 border border-red-200/60 dark:border-red-800/30"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                netProfit >= 0 ? "bg-primary/20" : "bg-red-500/20"
              }`}>
                <PiggyBank className={`h-4 w-4 ${
                  netProfit >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"
                }`} />
              </div>
              <span className="text-sm font-semibold text-foreground">Selisih</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${
              netProfit >= 0
                ? "text-primary"
                : "text-red-600 dark:text-red-400"
            }`}>
              {netProfit >= 0 ? "" : "-"}{formatRupiah(Math.abs(netProfit))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {netProfit >= 0 ? "Laba bersih" : "Rugi bersih"}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Table + Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Breakdown per Toko */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Landmark className="h-4 w-4 text-primary" />
              Breakdown per Toko
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border table-responsive">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Toko</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                    <TableHead className="text-right">HPP</TableHead>
                    <TableHead className="text-right">Laba Kotor</TableHead>
                    <TableHead className="text-right">Laba Bersih</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeBreakdown.length === 0 ? (
                    <TableRow>
                        <TableCell className="text-center text-muted-foreground py-6" data-label="Status">
                        Tidak ada data penjualan bulan ini
                      </TableCell>
                    </TableRow>
                  ) : (
                    storeBreakdown.map((s) => (
                      <TableRow key={s.store}>
                        <TableCell className="font-medium" data-label="Toko">{s.store}</TableCell>
                        <TableCell className="text-right tabular-nums" data-label="Pendapatan">
                          {formatCompact(s.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums" data-label="HPP">
                          {formatCompact(s.hpp)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-success" data-label="Laba Kotor">
                          {formatCompact(s.grossProfit)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums" data-label="Laba Bersih">
                          <span
                            className={s.netProfit >= 0 ? "text-success" : "text-destructive"}
                          >
                            {formatCompact(s.netProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums" data-label="Margin">
                          {s.margin.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 6-Month Trend Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Tren 6 Bulan Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {trendData.map((d, i) => {
                const grossPct = (d.grossProfit / maxChartValue) * 100;
                const netPct = (d.netProfit / maxChartValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                    <div className="flex items-end gap-0.5 w-full flex-1">
                      <div
                        className="flex-1 rounded-t transition-all duration-300 ease-out"
                        style={{
                          height: `${Math.max(grossPct, 1)}%`,
                          background: "var(--primary)",
                          opacity: 0.3,
                        }}
                        title={`Laba Kotor: ${formatRupiah(d.grossProfit)}`}
                      />
                      <div
                        className="flex-1 rounded-t transition-all duration-300 ease-out"
                        style={{
                          height: `${Math.max(netPct, 1)}%`,
                          background: "var(--success)",
                          opacity: 0.75,
                        }}
                        title={`Laba Bersih: ${formatRupiah(d.netProfit)}`}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-medium text-muted-foreground leading-tight">
                        {MONTHS_INA[d.month].slice(0, 3)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 leading-tight">
                        {d.year}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-6 rounded"
                  style={{ background: "var(--primary)", opacity: 0.3 }}
                />
                <span className="text-xs text-muted-foreground">Laba Kotor</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-6 rounded"
                  style={{ background: "var(--success)", opacity: 0.75 }}
                />
                <span className="text-xs text-muted-foreground">Laba Bersih</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
