import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getShopeeShops } from "@/lib/shopee/database";
import { ShopeeApiClient } from "@/lib/shopee/client";

/**
 * Input validation schema for product listing
 */
const productListSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const validationResult = productListSchema.safeParse({ limit, offset });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { limit: validLimit, offset: validOffset } = validationResult.data;

    // Get user's Shopee shops
    const shops = await getShopeeShops();
    if (shops.length === 0) {
      return NextResponse.json(
        { error: "No Shopee shop connected" },
        { status: 400 }
      );
    }

    const shop = shops[0];

    // Validate environment variables
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const baseUrl = process.env.SHOPEE_BASE_URL;

    if (!partnerId || !partnerKey || !baseUrl) {
      console.error("Missing Shopee API configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const api = new ShopeeApiClient({
      partnerId,
      partnerKey,
      baseUrl,
    });

    // Fetch product list with validated parameters
    const productList = await api.getProductList(
      shop.access_token,
      shop.shop_id,
      validOffset,
      validLimit
    );

    if (
      productList.response &&
      productList.response.item &&
      productList.response.item.length > 0
    ) {
      const itemIds = productList.response.item.map(
        (i: { item_id: number }) => i.item_id
      );

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
    // Log error without exposing sensitive information
    console.error("Error fetching products:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
