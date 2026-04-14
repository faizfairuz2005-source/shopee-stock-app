import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, XCircle } from "lucide-react";

export default function OrdersPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola pesanan Shopee Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-amber-100 p-1.5">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              Menunggu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground">Pesanan baru</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-green-100 p-1.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Berhasil diproses</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-normal">
              <div className="rounded-lg bg-red-100 p-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              Dibatalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Pesanan batal</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="border-blue-200/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
            <ShoppingCart className="mb-3 h-12 w-12 text-blue-300" />
            <p className="text-sm text-muted-foreground">
              Belum ada data pesanan. Hubungkan toko Shopee Anda untuk mulai menarik data pesanan.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
