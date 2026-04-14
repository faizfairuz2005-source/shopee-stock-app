import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShopeeShops } from "@/lib/shopee/database";
import { ShopeeApiClient } from "@/lib/shopee/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shops = await getShopeeShops();
    if (shops.length === 0) {
      return NextResponse.json({ error: "No Shopee shop connected" }, { status: 400 });
    }

    // Use the first shop for now
    const shop = shops[0];
    
    const api = new ShopeeApiClient({
      partnerId: process.env.SHOPEE_PARTNER_ID!,
      partnerKey: process.env.SHOPEE_PARTNER_KEY!,
      baseUrl: process.env.SHOPEE_BASE_URL!,
    });

    // Fetch product list
    const productList = await api.getProductList(
      shop.access_token,
      shop.shop_id
    );

    if (productList.response && productList.response.item && productList.response.item.length > 0) {
      const itemIds = productList.response.item.slice(0, 50).map((i: { item_id: number }) => i.item_id);
      
      // Fetch product details
      const productDetails = await api.getProductDetail(
        shop.access_token,
        shop.shop_id,
        itemIds
      );

      return NextResponse.json({
        products: productDetails.response?.item_list || [],
        total: productList.response.total_count,
      });
    }

    return NextResponse.json({ products: [], total: 0 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
