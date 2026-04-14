import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getShopeeShops } from "@/lib/shopee/database";
import { ShopeeApiClient } from "@/lib/shopee/client";
import { connectShopeeAction, disconnectShopeeAction } from "./actions";

export default async function ConnectShopeePage() {
  const shops = await getShopeeShops();

  const redirectUrl = process.env.SHOPEE_REDIRECT_URL!;
  const api = new ShopeeApiClient({
    partnerId: process.env.SHOPEE_PARTNER_ID!,
    partnerKey: process.env.SHOPEE_PARTNER_KEY!,
    baseUrl: process.env.SHOPEE_BASE_URL!,
  });

  await api.getAuthorizationUrl(redirectUrl);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hubungkan Toko Shopee
        </h1>
        <p className="text-sm text-muted-foreground">
          Sambungkan akun toko Shopee Anda untuk mulai sinkronisasi data stok.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={connectShopeeAction}>
            <Button type="submit" className="h-14 w-full bg-[#EE4D2D] text-base hover:bg-[#d84325]">
              Sambungkan Toko Shopee
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toko yang Sudah Terhubung ({shops.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shops.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Belum ada toko yang terhubung.
            </div>
          ) : (
            <div className="space-y-3">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{shop.shop_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Region: {shop.region} | Shop ID: {shop.shop_id}
                    </p>
                  </div>
                  <form action={disconnectShopeeAction}>
                    <input type="hidden" name="shop_id" value={shop.shop_id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Disconnect
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
