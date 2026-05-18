// ─── Product Types ────────────────────────────────────────────────────────

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  hpp: number;
  stock_total: number;
  connected_stores: number;
  sales: number;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<
  Product,
  "id" | "created_at" | "updated_at"
>;

export type ProductUpdate = Partial<
  Omit<Product, "id" | "created_at" | "updated_at">
>;

// ─── Stock Mutation Types ─────────────────────────────────────────────────

export type MutationType =
  | "incoming"    // barang masuk dari supplier
  | "outgoing"    // penjualan / pesanan
  | "adjustment"  // penyesuaian stok manual
  | "return";     // retur dari pembeli

export interface StockMutation {
  id: string;
  product_id: string;
  mutation_type: MutationType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  buy_price: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string;
  user_id: string | null;
  created_at: string;
}

export type StockMutationInsert = Omit<
  StockMutation,
  "id" | "created_at"
>;

// ─── Incoming Stock Types ─────────────────────────────────────────────────

export interface IncomingStockItem {
  /** UUID of the product in the `products` table */
  product_id: string;
  /** Product SKU (for display/verification) */
  sku?: string;
  /** Quantity received (must be > 0) */
  quantity: number;
  /** Buy price per unit */
  buy_price?: number;
  /** Reference document type (e.g. 'goods_receipt') */
  reference_type?: string;
  /** Reference document ID */
  reference_id?: string;
  /** Optional notes */
  notes?: string;
}

export interface IncomingStockResult {
  product_id: string;
  sku?: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  success: boolean;
  error?: string;
}

export interface IncomingStockResponse {
  success: boolean;
  success_count?: number;
  fail_count?: number;
  results?: IncomingStockResult[];
  error?: string;
}

// ─── Stock History Types ──────────────────────────────────────────────────

export interface StockHistoryItem {
  id: string;
  mutation_type: MutationType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  buy_price: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string;
  created_at: string;
}

export interface StockHistoryResponse {
  success: boolean;
  data: StockHistoryItem[];
  total: number;
  error?: string;
}
