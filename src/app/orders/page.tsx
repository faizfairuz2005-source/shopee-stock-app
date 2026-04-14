import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrdersPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Halaman orders masih kosong dan siap diisi daftar pesanan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
            Belum ada data pesanan. Tambahkan tabel order Shopee di sini.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
