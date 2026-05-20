"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { InventoryProduct, Order } from "@/app/actions";

// ─── Color Palette ─────────────────────────────────────────────────────
const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#06b6d4", "#d946ef", "#eab308", "#22c55e", "#a855f7",
];

const CHART_AXIS_STYLE = { fontSize: 12, fill: "var(--muted-foreground)" };

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
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// ─── Custom Tooltip ─────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
  formatter?: (value: number, name?: string) => string;
}

function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry: { color: string; name: string; value: number }, i: number) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold tabular-nums">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Header ────────────────────────────────────────────────────────

function StatBadge({ label, value, trend, format }: {
  label: string;
  value: number;
  trend?: number;
  format?: (v: number) => string;
}) {
  const fmt = format || ((v: number) => v.toLocaleString("id-ID"));
  return (
    <div className="flex items-baseline gap-3 rounded-xl bg-muted/30 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">{fmt(value)}</p>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={`flex items-center gap-0.5 text-xs font-medium ${
          trend > 0 ? "text-success" : "text-destructive"
        }`}>
          {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Dashboard Charts Component
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardCharts({
  inventoryProducts,
  orders,
}: {
  inventoryProducts: InventoryProduct[];
  orders: Order[];
}) {
  // ── Compute Monthly Revenue ──────────────────────────────────────────
  const revenueData = useMemo(() => {
    const map = new Map<string, { revenue: number; hpp: number; orders: number; profit: number }>();

    for (const order of orders) {
      const key = order.tanggal_pesanan.slice(0, 7); // "YYYY-MM"
      const existing = map.get(key) ?? { revenue: 0, hpp: 0, orders: 0, profit: 0 };
      existing.revenue += order.grand_total;
      existing.orders += 1;
      for (const item of order.items) {
        existing.hpp += (item.hpp ?? Math.round(item.harga * 0.6)) * item.quantity;
      }
      existing.profit = existing.revenue - existing.hpp;
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .map(([key, data]) => {
        const [y, m] = key.split("-");
        return {
          bulan: `${MONTHS_INA[parseInt(m, 10) - 1]} ${y}`,
          key,
          Pendapatan: data.revenue,
          HPP: data.hpp,
          Profit: data.profit,
          Pesanan: data.orders,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12); // last 12 months
  }, [orders]);

  // Revenue trend (period-over-period)
  const revenueTrend = useMemo(() => {
    if (revenueData.length < 2) return 0;
    const last = revenueData[revenueData.length - 1].Pendapatan;
    const prev = revenueData[revenueData.length - 2].Pendapatan;
    if (prev === 0) return 0;
    return ((last - prev) / prev) * 100;
  }, [revenueData]);

  // ── Top Selling Products ────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const salesMap = new Map<string, { name: string; quantity: number; revenue: number; sku: string }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = salesMap.get(item.sku) ?? { name: item.nama_produk, quantity: 0, revenue: 0, sku: item.sku };
        existing.quantity += item.quantity;
        existing.revenue += item.subtotal;
        salesMap.set(item.sku, existing);
      }
    }
    return Array.from(salesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item, i) => ({ 
        ...item, 
        displayName: `${String(i + 1).padStart(2, "0")} ${item.name}`,
        rank: i + 1,
      }));
  }, [orders]);

  // Total units sold across top 10 products
  const topProductsTotal = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + p.quantity, 0);
  }, [topProducts]);

  const topProductsRevenue = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + p.revenue, 0);
  }, [topProducts]);

  // Custom YAxis tick with native browser tooltip for full name
  const renderProductTick = (props: {
    x: number | string;
    y: number | string;
    payload: { value: string };
  }) => {
    const { x, y, payload } = props;
    const name = payload.value;
    const displayName = name.length > 24 ? `${name.slice(0, 22)}...` : name;
    const fullName = name.replace(/^\d{2} /, "");
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-8}
          y={0}
          dy={4}
          textAnchor="end"
          fill="var(--muted-foreground)"
          fontSize={12}
        >
          <title>{fullName}</title>
          {displayName}
        </text>
      </g>
    );
  };

  // ── Category Distribution ───────────────────────────────────────────
  const categoryData = useMemo(() => {
    const catMap = new Map<string, { name: string; stock: number; products: number; value: number }>();
    for (const p of inventoryProducts) {
      const cat = p.kategori || "Tanpa Kategori";
      const existing = catMap.get(cat) ?? { name: cat, stock: 0, products: 0, value: 0 };
      existing.stock += p.totalStock;
      existing.products += 1;
      existing.value += p.totalStock * (p.hpp || p.price);
      catMap.set(cat, existing);
    }
    return Array.from(catMap.values())
      .sort((a, b) => b.stock - a.stock)
      .map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }));
  }, [inventoryProducts]);

  // ── Stock Status Summary ────────────────────────────────────────────
  const stockStatusData = useMemo(() => {
    let aman = 0, rendah = 0, habis = 0;
    for (const p of inventoryProducts) {
      const threshold = p.minStok ?? 10;
      if (p.totalStock === 0) habis++;
      else if (p.totalStock <= threshold) rendah++;
      else aman++;
    }
    return [
      { name: "Aman", value: aman, fill: "#10b981" },
      { name: "Rendah", value: rendah, fill: "#f59e0b" },
      { name: "Habis", value: habis, fill: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [inventoryProducts]);

  // ── Orders Trend (daily for last 30 days) ──────────────────────────
  const ordersTrend = useMemo(() => {
    const now = new Date();
    const dayMap = new Map<string, number>();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, 0);
    }

    for (const order of orders) {
      const key = order.tanggal_pesanan.slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      }
    }

    return Array.from(dayMap.entries()).map(([tgl, count], i) => {
      const d = new Date(tgl);
      return {
        hari: `${d.getDate()}/${d.getMonth() + 1}`,
        Pesanan: count,
        index: i,
      };
    });
  }, [orders]);

  // Total products sold from ALL orders (not just top 10)
  const totalSoldAll = useMemo(() => {
    return orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
  }, [orders]);

  const totalOrders = orders.length;
  const avgOrdersPerDay = ordersTrend.length > 0
    ? (ordersTrend.reduce((s, d) => s + d.Pesanan, 0) / ordersTrend.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge
          label="Total Pendapatan"
          value={revenueData.reduce((s, d) => s + d.Pendapatan, 0)}
          format={formatRupiah}
          trend={revenueTrend}
        />
        <StatBadge
          label="Total Pesanan"
          value={totalOrders}
        />
        <StatBadge
          label="Total Produk Terjual"
          value={totalSoldAll}
        />
        <StatBadge
          label="Rata-rata Pesanan/Hari"
          value={parseFloat(avgOrdersPerDay)}
          format={(v) => v.toFixed(1)}
        />
      </div>

      {/* Row 1: Revenue Trend + Orders 30-day Trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue & Profit Trend */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tren Pendapatan & Profit
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {revenueData.length} bulan
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="bulan"
                    tick={CHART_AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)", opacity: 0.3 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={formatCompact}
                    tick={CHART_AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatRupiah(v)} />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value: string) => (
                      <span style={{ color: "var(--muted-foreground)" }}>{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="Pendapatan"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "white" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Profit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "white" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders 30-Day Trend */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart className="h-4 w-4 text-primary" />
                Pesanan 30 Hari Terakhir
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {ordersTrend.reduce((s, d) => s + d.Pesanan, 0)} pesanan
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersTrend}>
                  <defs>
                    <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="hari"
                    tick={CHART_AXIS_STYLE}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)", opacity: 0.3 }}
                    interval={4}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={CHART_AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Pesanan"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#orderGradient)"
                    activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "white" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top Products + Category Pie */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card className="card-hover overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Top 10 Produk Terlaris
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground/60 mt-px">
                    Bulan Ini
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {topProducts.length > 0 && (
                  <>                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCompact(topProductsTotal)} unit
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatRupiah(topProductsRevenue)}
                      </span>
                  </>
                )}
                <Badge variant="outline" className="text-xs ml-1">
                  Top {topProducts.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Belum ada data penjualan
              </div>
            ) : (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 140, right: 60, top: 4, bottom: 4 }}
                    barCategoryGap={8}
                  >
                    <defs>
                      <linearGradient id="topBarGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.95} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" opacity={0.2} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={CHART_AXIS_STYLE}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      tick={renderProductTick}
                      tickLine={false}
                      axisLine={false}
                      width={140}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border bg-popover px-4 py-3 shadow-xl backdrop-blur-sm min-w-[180px]">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">
                              {label}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Terjual</span>
                                <span className="font-semibold tabular-nums text-foreground">
                                  {data.quantity} unit
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Pendapatan</span>
                                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(data.revenue)}
                                </span>
                              </div>
                              {data.quantity > 0 && (
                                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                                  <span>Harga rata-rata</span>
                                  <span className="tabular-nums">
                                    {formatRupiah(Math.round(data.revenue / data.quantity))}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="quantity"
                      name="Terjual"
                      radius={[0, 5, 5, 0]}
                      barSize={20}
                      minPointSize={3}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={900}
                      animationEasing="ease-out"
                      fill="url(#topBarGradient)"
                    >
                      <LabelList
                        dataKey="quantity"
                        position="right"
                        content={(props: {
                          x?: number | string;
                          y?: number | string;
                          width?: number | string;
                          value?: React.ReactNode;
                        }) => {
                          const { x, y, width, value } = props || {};
                          return (
                            <g>
                              <rect
                                x={Number(x) + Number(width) + 4}
                                y={Number(y) - 5}
                                width={28}
                                height={18}
                                rx={4}
                                fill="var(--muted)"
                                opacity={0.6}
                              />
                              <text
                                x={Number(x) + Number(width) + 18}
                                y={Number(y) + 4}
                                textAnchor="middle"
                                fill="var(--foreground)"
                                fontSize={11}
                                fontWeight={600}
                                fontFamily="var(--font-mono, monospace)"
                              >
                                {String(value ?? "")}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category & Stock Distribution */}
        <div className="grid gap-4">
          {/* Stock Status Pie */}
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Status Stok
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {stockStatusData.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Tidak ada data stok
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="h-36 w-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {stockStatusData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {stockStatusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: item.fill }}
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Distribusi per Kategori
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  Tidak ada kategori
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categoryData.slice(0, 6).map((cat) => {
                    const totalStock = categoryData.reduce((s, c) => s + c.stock, 0);
                    const pct = totalStock > 0 ? (cat.stock / totalStock) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[200px]">{cat.name}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {cat.stock} unit ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${pct}%`,
                              background: cat.fill,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {categoryData.length > 6 && (
                    <p className="pt-1 text-xs text-muted-foreground text-center">
                      +{categoryData.length - 6} kategori lainnya
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
