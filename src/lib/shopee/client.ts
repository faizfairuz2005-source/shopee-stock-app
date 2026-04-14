import crypto from "crypto";

interface ShopeeClientConfig {
  partnerId: string;
  partnerKey: string;
  baseUrl: string;
}

export class ShopeeApiClient {
  private partnerId: string;
  private partnerKey: string;
  private baseUrl: string;

  constructor(config: ShopeeClientConfig) {
    this.partnerId = config.partnerId;
    this.partnerKey = config.partnerKey;
    this.baseUrl = config.baseUrl;
  }

  private generateSign(path: string, timestamp: number, accessToken?: string): string {
    const baseString = `${this.partnerId}${path}${timestamp}${accessToken || ""}`;
    return crypto.createHmac("sha256", this.partnerKey).update(baseString).digest("hex");
  }

  private buildUrl(path: string, timestamp: number, accessToken?: string): string {
    const sign = this.generateSign(path, timestamp, accessToken);
    const url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}`;
    return accessToken ? `${url}&access_token=${accessToken}` : url;
  }

  async getAuthorizationUrl(redirectUrl: string, shopId?: string): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/auth/token/init";

    let url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&redirect=${encodeURIComponent(redirectUrl)}`;
    if (shopId) {
      url += `&shop_id=${shopId}`;
    }
    return url;
  }

  async getAccessToken(code: string, shopId: number): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
    shop_id: number;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/auth/token/get";

    const url = this.buildUrl(path, timestamp);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, shop_id: shopId }),
    });

    const data = await response.json();
    if (data.error !== 0) {
      throw new Error(`Shopee API Error: ${data.message}`);
    }
    return data.response;
  }

  async refreshAccessToken(refreshToken: string, shopId: number): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/auth/access_token/get";

    const url = this.buildUrl(path, timestamp);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, shop_id: shopId }),
    });

    const data = await response.json();
    if (data.error !== 0) {
      throw new Error(`Shopee API Error: ${data.message}`);
    }
    return data.response;
  }

  async getProductList(
    accessToken: string,
    shopId: number,
    offset: number = 0,
    pageSize: number = 100
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/product/get_item_list";
    const sign = this.generateSign(path, timestamp, accessToken);

    const url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&access_token=${accessToken}&shop_id=${shopId}&offset=${offset}&page_size=${pageSize}`;
    
    const response = await fetch(url);
    const data = await response.json();
    if (data.error !== 0) {
      throw new Error(`Shopee API Error: ${data.message}`);
    }
    return data;
  }

  async getProductDetail(
    accessToken: string,
    shopId: number,
    itemIds: number[]
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/product/get_item_detail";
    const sign = this.generateSign(path, timestamp, accessToken);

    const url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&access_token=${accessToken}&shop_id=${shopId}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id_list: itemIds }),
    });

    const data = await response.json();
    if (data.error !== 0) {
      throw new Error(`Shopee API Error: ${data.message}`);
    }
    return data;
  }

  async updateStock(
    accessToken: string,
    shopId: number,
    updates: Array<{
      item_id: number;
      stock_list: Array<{ location_id: number; stock: number }>;
    }>
  ) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = "/api/v2/product/update_stock";
    const sign = this.generateSign(path, timestamp, accessToken);

    const url = `${this.baseUrl}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&access_token=${accessToken}&shop_id=${shopId}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_stock_list: updates,
        stock_type: 1, // 1 = normal stock
      }),
    });

    const data = await response.json();
    if (data.error !== 0) {
      throw new Error(`Shopee API Error: ${data.message}`);
    }
    return data;
  }
}
