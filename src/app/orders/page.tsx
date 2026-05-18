import { getAppData } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/get-profile";
import { getShopeeShops } from "@/lib/shopee/database";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { orders, inventoryProducts } = await getAppData();

  const userId = user?.id ?? "";

  // Get seller name from profile (with email fallback if full_name empty)
  const { fullName, email } = await getUserProfile();
  const defaultSellerName = fullName || email?.split("@")[0] || userId.slice(0, 8) || "Penjual";

  // Get connected store names from Shopee integration (graceful fallback)
  let shopNames: string[] = [];
  try {
    const connectedShops = await getShopeeShops();
    shopNames = connectedShops.map((s) => s.shop_name).filter(Boolean);
  } catch {
    // shopee_shops table may not exist yet
    shopNames = [];
  }

  // Extract unique store names from existing orders
  const orderStoreNames = [
    ...new Set(orders.map((o) => o.nama_toko_shopee).filter(Boolean)),
  ];

  // Combine and deduplicate
  const storeSuggestions = [...new Set([...shopNames, ...orderStoreNames])];

  return (
    <OrdersClient
      initialOrders={orders}
      products={inventoryProducts}
      defaultSellerName={defaultSellerName}
      userId={userId}
      storeSuggestions={storeSuggestions}
    />
  );
}
