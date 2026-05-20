import { getAppData } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/get-profile";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { orders, inventoryProducts } = await getAppData();

  const userId = user?.id ?? "";

  // Get seller name from profile (with email fallback if full_name empty)
  const { fullName, email } = await getUserProfile();
  const defaultSellerName = fullName || email?.split("@")[0] || userId.slice(0, 8) || "Penjual";

  // Extract unique store names from existing orders
  const storeSuggestions = [
    ...new Set(orders.map((o) => o.nama_toko).filter(Boolean)),
  ];

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
