export interface ShopeeShop {
  id: string;
  shop_id: number;
  region: string;
  name: string;
  shop_name: string;
  shop_code: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: number;
  created_at: string;
  updated_at: string;
}

export interface ShopeeProductItem {
  item_id: number;
  name: string;
  description: string;
  image: string;
  images: string[];
  cmt_count: number;
  liked_count: number;
  view_count: number;
  sales: number;
  historical_sold: number;
  stock_info_v2: StockInfoV2;
  price: number;
  currency: string;
  brand_id: number;
  item_status: string;
  has_model: boolean;
  models?: ShopeeProductModel[];
  category_id: number;
  condition: number;
  size_chart?: string;
  item_sku?: string;
  pre_order?: {
    is_pre_order: boolean;
    days_to_ship: number;
  };
}

export interface StockInfoV2 {
  stock_type: number;
  total_reserved_stock: number;
  stocks: StockLocation[];
}

export interface StockLocation {
  location_id: number;
  stock: StockUoM[];
}

export interface StockUoM {
  normal_stock: number;
  reserved_stock: number;
  total_stock: number;
}

export interface ShopeeProductModel {
  model_id: number;
  name: string;
  product_id: number;
  seller_sku: string;
  original_price: number;
  discounted_price: number;
  model_status: string;
  stock_info_v2: StockInfoV2;
  tier_index: number[];
}

export interface ShopeeItemListResponse {
  error: number;
  message: string;
  response: {
    item: Array<{
      item_id: number;
      item_sku: string;
    }>;
    has_next: boolean;
    total_count: number;
  };
  request_id: string;
}

export interface ShopeeItemDetailResponse {
  error: number;
  message: string;
  response: {
    item_list: ShopeeProductItem[];
  };
  request_id: string;
}

export interface ShopeeUpdateStockResponse {
  error: number;
  message: string;
  response: {
    failure_list?: Record<string, { error: string; error_msg: string }>;
    success_list?: Record<string, { updated: boolean }>;
  };
  request_id: string;
}
