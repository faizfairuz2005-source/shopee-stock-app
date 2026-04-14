import { NextRequest, NextResponse } from "next/server";
import { handleShopeeCallback } from "@/app/connect-shopee/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const shopId = searchParams.get("shop_id");

  if (!code || !shopId) {
    return NextResponse.redirect(
      new URL("/connect-shopee?error=missing_params", request.url)
    );
  }

  const result = await handleShopeeCallback(code, shopId);

  if (result.success) {
    return NextResponse.redirect(new URL("/inventory", request.url));
  }

  return NextResponse.redirect(
    new URL(`/connect-shopee?error=${encodeURIComponent(result.error || "Unknown error")}`, request.url)
  );
}
