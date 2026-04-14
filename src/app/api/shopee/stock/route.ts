import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShopeeShops } from "@/lib/shopee/database";
import { ShopeeApiClient } from "@/lib/shopee/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { item_id, stock } = body;

    if (!item_id || stock === undefined) {
      return NextResponse.json(
        { error: "item_id and stock are required" },
        { status: 400 }
      );
    }

    const shops = await getShopeeShops();
    if (shops.length === 0) {
      return NextResponse.json({ error: "No Shopee shop connected" }, { status: 400 });
    }

    const shop = shops[0];
    
    const api = new ShopeeApiClient({
      partnerId: process.env.SHOPEE_PARTNER_ID!,
      partnerKey: process.env.SHOPEE_PARTNER_KEY!,
      baseUrl: process.env.SHOPEE_BASE_URL!,
    });

    const result = await api.updateStock(shop.access_token, shop.shop_id, [
      {
        item_id,
        stock_list: [{ location_id: 1, stock }],
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
