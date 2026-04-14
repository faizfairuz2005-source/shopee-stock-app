"use server";

import { redirect } from "next/navigation";
import { ShopeeApiClient } from "@/lib/shopee/client";
import { saveShopeeShop, deleteShopeeShop } from "@/lib/shopee/database";

export async function connectShopeeAction() {
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL!;
  const api = new ShopeeApiClient({
    partnerId: process.env.SHOPEE_PARTNER_ID!,
    partnerKey: process.env.SHOPEE_PARTNER_KEY!,
    baseUrl: process.env.SHOPEE_BASE_URL!,
  });

  const authUrl = await api.getAuthorizationUrl(redirectUrl);
  redirect(authUrl);
}

export async function disconnectShopeeAction(formData: FormData) {
  const shopId = Number(formData.get("shop_id"));
  await deleteShopeeShop(shopId);
  redirect("/connect-shopee");
}

export async function handleShopeeCallback(code: string, shopId: string) {
  const api = new ShopeeApiClient({
    partnerId: process.env.SHOPEE_PARTNER_ID!,
    partnerKey: process.env.SHOPEE_PARTNER_KEY!,
    baseUrl: process.env.SHOPEE_BASE_URL!,
  });

  try {
    const tokenData = await api.getAccessToken(code, Number(shopId));

    await saveShopeeShop({
      shop_id: tokenData.shop_id,
      region: "ID",
      shop_name: `Shopee Shop ${shopId}`,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: Math.floor(Date.now() / 1000) + tokenData.expire_in,
    });

    return { success: true };
  } catch (error) {
    console.error("Shopee callback error:", error);
    return { success: false, error: String(error) };
  }
}
