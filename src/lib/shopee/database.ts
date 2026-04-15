import { createClient } from "@/lib/supabase/server";
import type { ShopeeShop } from "@/types/shopee";

function getReadableError(error: unknown): string {
  if (!error) return "Unknown database error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;

  if (typeof error === "object") {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    if (parts.length > 0) return parts.join(" | ");
  }

  return "Unserializable error object";
}

export async function getShopeeShops(): Promise<ShopeeShop[]> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("shopee_shops")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shopee shops:", getReadableError(error));
    return [];
  }
  return data || [];
}

export async function getShopeeShopById(shopId: number): Promise<ShopeeShop | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("shopee_shops")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("shop_id", shopId)
    .single();

  if (error) {
    console.error("Error fetching shop:", getReadableError(error));
    return null;
  }
  return data;
}

export async function saveShopeeShop(shop: {
  shop_id: number;
  region: string;
  shop_name: string;
  shop_code?: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: number;
}): Promise<boolean> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) return false;

  const { error } = await supabase
    .from("shopee_shops")
    .upsert(
      {
        user_id: user.user.id,
        shop_id: shop.shop_id,
        region: shop.region,
        shop_name: shop.shop_name,
        shop_code: shop.shop_code,
        access_token: shop.access_token,
        refresh_token: shop.refresh_token,
        token_expires_at: shop.token_expires_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "shop_id" }
    );

  if (error) {
    console.error("Error saving shop:", getReadableError(error));
    return false;
  }
  return true;
}

export async function deleteShopeeShop(shopId: number): Promise<boolean> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return false;
  }

  const { error } = await supabase
    .from("shopee_shops")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("shop_id", shopId);

  if (error) {
    console.error("Error deleting shop:", getReadableError(error));
    return false;
  }
  return true;
}
