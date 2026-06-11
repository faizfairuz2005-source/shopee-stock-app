"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpDown,
} from "lucide-react"
import type { Order } from "@/app/actions"

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value)
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

function todayStr(): string {
  return toDateStr(new Date())
}

function monthStartStr(): string {
  const d = new Date()
  d.setDate(1)
  return toDateStr(d)
}

interface DailyRow {
  date: string
  label: string
  transactions: number
  revenue: number
  items: number
}

interface MonthlyRow {
  month: string
  label: string
  transactions: number
  revenue: number
  items: number
}

export default function LaporanPenjualan({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<"harian" | "bulanan">("harian")
  const [startDate, setStartDate] = useState(monthStartStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [sortField, setSortField] = useState<"date" | "revenue" | "transactions">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const toggleSort = (field: "date" | "revenue" | "transactions") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = o.tanggal_pesanan
      return d >= startDate && d <= endDate
    })
  }, [orders, startDate, endDate])

  const dailyData = useMemo((): DailyRow[] => {
    const map = new Map<string, { transactions: Set<number>; revenue: number; items: number }>()
    for (const order of filteredOrders) {
      const date = order.tanggal_pesanan
      if (!map.has(date)) {
        map.set(date, { transactions: new Set(), revenue: 0, items: 0 })
      }
      const entry = map.get(date)!
      entry.transactions.add(order.id)
      entry.revenue += order.grand_total
      entry.items += order.items.reduce((s, i) => s + i.quantity, 0)
    }
    return Array.from(map.entries())
      .map(([date, data]) => {
        const d = new Date(date)
        const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
        return { date, label, transactions: data.transactions.size, revenue: data.revenue, items: data.items }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredOrders])

  const monthlyData = useMemo((): MonthlyRow[] => {
    const map = new Map<string, { transactions: Set<number>; revenue: number; items: number }>()
    for (const order of filteredOrders) {
      const month = order.tanggal_pesanan.slice(0, 7)
      if (!map.has(month)) {
        map.set(month, { transactions: new Set(), revenue: 0, items: 0 })
      }
      const entry = map.get(month)!
      entry.transactions.add(order.id)
      entry.revenue += order.grand_total
      entry.items += order.items.reduce((s, i) => s + i.quantity, 0)
    }
    return Array.from(map.entries())
      .map(([month, data]) => {
        const d = new Date(month + "-01")
        const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
        return { month, label, transactions: data.transactions.size, revenue: data.revenue, items: data.items }
      })
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredOrders])

  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.grand_total, 0), [filteredOrders])
  const totalTransactions = filteredOrders.length
  const totalItems = filteredOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)

  const maxRevenue = useMemo(() => {
    if (tab === "harian") return Math.max(...dailyData.map((d) => d.revenue), 1)
    return Math.max(...monthlyData.map((d) => d.revenue), 1)
  }, [tab, dailyData, monthlyData])

  const sortedData = useMemo(() => {
    const data = tab === "harian" ? dailyData : monthlyData
    return [...data].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      if (sortField === "revenue") return (a.revenue - b.revenue) * dir
      if (sortField === "transactions") return (a.transactions - b.transactions) * dir
      const aKey = "date" in a ? (a as DailyRow).date : (a as MonthlyRow).month
      const bKey = "date" in b ? (b as DailyRow).date : (b as MonthlyRow).month
      return aKey.localeCompare(bKey) * dir
    })
  }, [tab, dailyData, monthlyData, sortField, sortDir])

  const presetRanges = [
    { label: "Hari Ini", start: todayStr(), end: todayStr() },
    {
      label: "7 Hari",
      start: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return toDateStr(d) })(),
      end: todayStr(),
    },
    {
      label: "30 Hari",
      start: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return toDateStr(d) })(),
      end: todayStr(),
    },
    { label: "Bulan Ini", start: monthStartStr(), end: todayStr() },
    {
      label: "Bulan Lalu",
      start: (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setDate(1); return toDateStr(d) })(),
      end: (() => { const d = new Date(); d.setDate(0); return toDateStr(d) })(),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => { setStartDate(preset.start); setEndDate(preset.end) }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-hover border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTransactions}</p>
            <p className="text-xs text-muted-foreground">
              {tab === "harian" ? `${dailyData.length} hari aktif` : `${monthlyData.length} bulan`}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover border-emerald-200 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              Rata-rata {formatRupiah(
                tab === "harian"
                  ? (dailyData.length ? Math.round(totalRevenue / dailyData.length) : 0)
                  : (monthlyData.length ? Math.round(totalRevenue / monthlyData.length) : 0)
              )}/{tab === "harian" ? "hari" : "bulan"}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover border-blue-200 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item Terjual</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalItems.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground">
              {totalTransactions > 0 ? `${Math.round(totalItems / totalTransactions)} item/transaksi` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab: Harian / Bulanan */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setTab("harian")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
            tab === "harian" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="mr-1.5 h-4 w-4 inline-block" />
          Harian
        </button>
        <button
          onClick={() => setTab("bulanan")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all ${
            tab === "bulanan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="mr-1.5 h-4 w-4 inline-block" />
          Bulanan
        </button>
      </div>

      {/* Revenue Bar Chart */}
      {sortedData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tren {tab === "harian" ? "Penjualan Harian" : "Penjualan Bulanan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-40">
              {sortedData.map((row, i) => {
                const pct = row.revenue / maxRevenue
                return (
                  <div key={i} className="flex-1 relative group">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/40 hover:from-primary hover:to-primary/60 transition-all duration-200 cursor-pointer"
                      style={{ height: `${Math.max(pct * 100, 2)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg transition-opacity">
                        {formatRupiah(row.revenue)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{"label" in sortedData[0] ? (sortedData[0] as DailyRow | MonthlyRow).label : ""}</span>
              <span>{"label" in sortedData[sortedData.length - 1] ? (sortedData[sortedData.length - 1] as DailyRow | MonthlyRow).label : ""}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Detail {tab === "harian" ? "Harian" : "Bulanan"}
            <Badge variant="outline" className="text-xs font-mono">
              {sortedData.length} {tab === "harian" ? "hari" : "bulan"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedData.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada data penjualan di periode ini.</p>
            </div>
          ) : (
            <Table responsive>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors w-48"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      {tab === "harian" ? "Tanggal" : "Bulan"}
                      {sortField === "date" && <ArrowUpDown className="h-3 w-3 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors text-right"
                    onClick={() => toggleSort("transactions")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Transaksi
                      {sortField === "transactions" && <ArrowUpDown className="h-3 w-3 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-foreground transition-colors text-right"
                    onClick={() => toggleSort("revenue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue
                      {sortField === "revenue" && <ArrowUpDown className="h-3 w-3 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Item Terjual</TableHead>
                  <TableHead className="text-right w-32">Grafik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, i) => {
                  const pct = row.revenue / maxRevenue
                  return (
                    <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                      <TableCell data-label={tab === "harian" ? "Tanggal" : "Bulan"} className="font-medium">
                        {"label" in row ? (row as DailyRow | MonthlyRow).label : ""}
                      </TableCell>
                      <TableCell data-label="Transaksi" className="text-right tabular-nums">{row.transactions}</TableCell>
                      <TableCell data-label="Revenue" className="text-right tabular-nums font-medium">
                        {formatRupiah(row.revenue)}
                      </TableCell>
                      <TableCell data-label="Item Terjual" className="text-right tabular-nums text-muted-foreground">
                        {row.items.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell data-label="Grafik" className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                              style={{ width: `${Math.max(pct * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                            {Math.round(pct * 100)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
