import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Package, ShoppingCart, Store, TrendingUp } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { href: "/inventory", icon: Package, title: "Kelola Stok", desc: "Update inventory", color: "text-primary" },
  { href: "/orders", icon: ShoppingCart, title: "Lihat Pesanan", desc: "Manage orders", color: "text-primary" },
  { href: "/laporan", icon: TrendingUp, title: "Lihat Laporan", desc: "Analisis penjualan", color: "text-primary" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan stok dan aktivitas toko Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Produk aktif</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Unit tersedia</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Total terjual</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">0</p>
            <p className="text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-lg border p-4 transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out hover:border-primary/50 hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className={`shrink-0 rounded-lg bg-primary/10 p-2.5 transition-transform duration-200 ease-out group-hover:scale-110 ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 ease-out group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-4 w-4 transition-transform duration-200 ease-out group-hover/card:scale-110" />
            Toko Terhubung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <Store className="mb-2 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada toko terhubung
            </p>
            <Link
              href="/connect-shopee"
              className="mt-3 inline-flex text-xs font-medium text-primary transition-[color,transform,opacity] duration-200 ease-out hover:underline hover:translate-x-0.5 active:scale-[0.99] active:opacity-90"
            >
              Hubungkan toko →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
