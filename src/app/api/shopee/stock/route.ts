import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getShopeeShops } from "@/lib/shopee/database";
import { ShopeeApiClient } from "@/lib/shopee/client";

/**
 * Input validation schema for stock update
 */
const stockUpdateSchema = z.object({
  item_id: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return !isNaN(num) && num > 0;
      },
      { message: "item_id must be a positive number" }
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),

  stock: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        return !isNaN(num) && num >= 0 && Number.isInteger(num);
      },
      { message: "stock must be a non-negative integer" }
    )
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),

  location_id: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = stockUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { item_id, stock, location_id } = validationResult.data;

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

    // Update stock
    const result = await api.updateStock(shop.access_token, shop.shop_id, [
      {
        item_id,
        stock_list: [{ location_id, stock }],
      },
    ]);

    return NextResponse.json(result);
  } catch (error) {
    // Log error without exposing sensitive information
    console.error("Error updating stock:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}
