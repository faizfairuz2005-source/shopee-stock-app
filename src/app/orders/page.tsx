import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, DollarSign } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola pesanan dari semua toko Shopee terhubung
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Semua pesanan</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
            <Clock className="h-4 w-4 text-amber-500 transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Perlu diproses</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Berhasil dikirim</p>
          </CardContent>
        </Card>
        <Card className="card-hover cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              Belum ada pesanan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hubungkan toko Shopee untuk mulai menarik data pesanan
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
