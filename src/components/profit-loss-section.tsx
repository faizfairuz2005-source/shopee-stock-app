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
  ArrowDown,
  ArrowUp,
  Banknote,
  BarChart3,
  Landmark,
  Minus,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Order } from "@/app/actions";

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
    const opCostRate = 0.18 + (month % 3) * 0.02;
    const operationalCosts = Math.round(data.revenue * opCostRate);
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
}: {
  orders: Order[];
}) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const allData = useMemo(() => computeMonthlyPL(orders), [orders]);

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
      if (pl) result.push(pl);
    }
    return result;
  }, [allData, selectedMonth, selectedYear]);

  const storeBreakdown = useMemo(
    () => getStoreBreakdown(orders, selectedMonth, selectedYear),
    [orders, selectedMonth, selectedYear],
  );

  const years = useMemo(() => {
    const set = new Set(allData.map((d) => d.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [allData]);

  if (!currentPL) return null;

  const comparisons = [
    { label: "Pendapatan", value: currentPL.revenue, prev: previousPL?.revenue ?? 0, icon: Banknote },
    { label: "HPP", value: currentPL.hpp, prev: previousPL?.hpp ?? 0, icon: TrendingDown },
    { label: "Laba Kotor", value: currentPL.grossProfit, prev: previousPL?.grossProfit ?? 0, icon: TrendingUp },
    { label: "Biaya Operasional", value: currentPL.operationalCosts, prev: previousPL?.operationalCosts ?? 0, icon: Wallet },
    { label: "Laba Bersih", value: currentPL.netProfit, prev: previousPL?.netProfit ?? 0, icon: PiggyBank },
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
            <div className="rounded-md border">
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Tidak ada data penjualan bulan ini
                      </TableCell>
                    </TableRow>
                  ) : (
                    storeBreakdown.map((s) => (
                      <TableRow key={s.store}>
                        <TableCell className="font-medium">{s.store}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCompact(s.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCompact(s.hpp)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-success">
                          {formatCompact(s.grossProfit)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span
                            className={s.netProfit >= 0 ? "text-success" : "text-destructive"}
                          >
                            {formatCompact(s.netProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
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
