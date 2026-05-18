"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Type definitions for Order system
export interface InventoryProduct {
  sku: string;
  name: string;
  price: number;
  hpp?: number;
  totalStock: number;
  description: string;
  connectedStores: number;
  sales: number;
  /** Lokasi penyimpanan di gudang / rak */
  lokasiRak?: string;
  /** Kategori produk */
  kategori?: string;
}

export interface OrderItem {
  id: number;
  sku: string;
  nama_produk: string;
  harga: number;
  hpp?: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  nomor_order: string;
  tanggal_pesanan: string;
  user_id: string;
  seller_name: string;
  nama_pembeli: string;
  alamat_pengiriman: string;
  nama_toko_shopee: string;
  status_pesanan: 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  items: OrderItem[];
  subtotal: number;
  ongkir: number;
  grand_total: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  color: string;
}

interface AppData {
  inventoryProducts: InventoryProduct[];
  orders: Order[];
  sampleStoreCount: number;
  goodsReceipts?: GoodsReceipt[];
  categories?: ProductCategory[];
}

const dataFilePath = path.join(process.cwd(), "data.json");

// Helper to read data
export async function getAppData(): Promise<AppData> {
  try {
    if (!fs.existsSync(dataFilePath)) {
      throw new Error("data.json not found");
    }
    const fileContents = fs.readFileSync(dataFilePath, "utf8");
    const data = JSON.parse(fileContents);

    // Ensure orders array exists for backward compatibility
    if (!data.orders) {
      data.orders = [];
    }

    // Ensure categories array exists
    if (!data.categories) {
      data.categories = [];
    }

    return data as AppData;
  } catch (error) {
    console.error("Error reading data.json:", error);
    return {
      inventoryProducts: [],
      orders: [],
      sampleStoreCount: 0
    };
  }
}

// Action to update the entire inventory list (e.g. after edit/delete)
export async function updateInventory(newProducts: InventoryProduct[]) {
  try {
    const data = await getAppData();
    data.inventoryProducts = newProducts;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // Revalidate paths so the UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error saving inventory:", error);
    return { success: false, error: "Gagal menyimpan data" };
  }
}

// ─── Barang Masuk (Goods Receipt) Types ────────────────────────────────

export interface GoodsReceiptItem {
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_beli: number;
  lokasiRak?: string;
  catatan: string;
}

export interface GoodsReceipt {
  id: number;
  tanggal: string;
  supplier: string;
  nomor_faktur: string;
  items: GoodsReceiptItem[];
  total_item: number;
  total_biaya: number;
  created_at: string;
  user_id?: string;
  user_name?: string;
}

// ─── Category CRUD ────────────────────────────────────────────────────────

export async function getCategories(): Promise<ProductCategory[]> {
  const data = await getAppData();
  return data.categories || [];
}

export async function addCategory(category: Omit<ProductCategory, "id">): Promise<{ success: boolean; category?: ProductCategory; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.categories) data.categories = [];

    // Check duplicate name
    if (data.categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) {
      return { success: false, error: "Kategori dengan nama tersebut sudah ada" };
    }

    const maxId = data.categories.length > 0
      ? Math.max(...data.categories.map(c => Number(c.id) || 0))
      : 0;

    const newCategory: ProductCategory = {
      id: String(maxId + 1),
      name: category.name,
      color: category.color,
    };

    data.categories.push(newCategory);

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true, category: newCategory };
  } catch (error) {
    console.error("Error adding category:", error);
    return { success: false, error: "Gagal menambahkan kategori" };
  }
}

export async function updateCategory(category: ProductCategory): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.categories) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    const idx = data.categories.findIndex(c => c.id === category.id);
    if (idx === -1) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    // Check duplicate name (excluding self)
    if (data.categories.some(c => c.id !== category.id && c.name.toLowerCase() === category.name.toLowerCase())) {
      return { success: false, error: "Kategori dengan nama tersebut sudah ada" };
    }

    data.categories[idx] = category;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Gagal mengupdate kategori" };
  }
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.categories) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    const category = data.categories.find(c => c.id === categoryId);
    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    // Remove category from all products that use it
    for (const product of data.inventoryProducts) {
      if (product.kategori === category.name) {
        product.kategori = undefined;
      }
    }

    data.categories = data.categories.filter(c => c.id !== categoryId);

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Gagal menghapus kategori" };
  }
}

// Action to save a goods receipt (Barang Masuk)
export async function saveGoodsReceipt(receiptData: {
  tanggal: string;
  supplier: string;
  nomor_faktur: string;
  items: GoodsReceiptItem[];
}) {
  try {
    const data = await getAppData();

    // Get current user info from session
    let userId = "";
    let userName = "";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
      }
    } catch {
      // Fallback: user might not be authenticated
    }

    // Initialize goodsReceipts array if not exists
    if (!data.goodsReceipts) {
      data.goodsReceipts = [];
    }

    // Auto-increment ID
    const receipts = data.goodsReceipts;
    const maxId = receipts.length > 0
      ? Math.max(...receipts.map(r => r.id))
      : 0;

    const totalItem = receiptData.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalBiaya = receiptData.items.reduce((sum, i) => sum + (i.harga_beli * i.quantity), 0);

    const newReceipt: GoodsReceipt = {
      id: maxId + 1,
      tanggal: receiptData.tanggal,
      supplier: receiptData.supplier,
      nomor_faktur: receiptData.nomor_faktur,
      items: receiptData.items,
      total_item: totalItem,
      total_biaya: totalBiaya,
      created_at: new Date().toISOString(),
      user_id: userId,
      user_name: userName,
    };

    receipts.push(newReceipt);

    // Update inventory stock: add quantities to existing products
    for (const item of receiptData.items) {
      const productIndex = data.inventoryProducts.findIndex(p => p.sku === item.sku);
      if (productIndex !== -1) {
        data.inventoryProducts[productIndex].totalStock += item.quantity;
        // Update lokasiRak if provided and product doesn't already have one
        if (item.lokasiRak && !data.inventoryProducts[productIndex].lokasiRak) {
          data.inventoryProducts[productIndex].lokasiRak = item.lokasiRak;
        }
      }
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // Revalidate paths so the UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return { success: true, receipt: newReceipt };
  } catch (error) {
    console.error("Error saving goods receipt:", error);
    return { success: false, error: "Gagal menyimpan barang masuk" };
  }
}

// Action to add a new order with multiple items
export async function addOrder(newOrder: Omit<Order, "id" | "nomor_order">) {
  try {
    const data = await getAppData();

    // Auto-increment ID based on max existing ID
    const maxId = data.orders.length > 0
      ? Math.max(...data.orders.map(o => o.id))
      : 0;

    // Generate order number
    const orderNumber = `SPX-${String(maxId + 1).padStart(6, '0')}`;

    const orderWithId = {
      ...newOrder,
      id: maxId + 1,
      nomor_order: orderNumber,
    };

    data.orders.push(orderWithId);

    // Update inventory stock based on the new order items
    for (const item of newOrder.items) {
      const productIndex = data.inventoryProducts.findIndex(p => p.sku === item.sku);
      if (productIndex !== -1) {
        data.inventoryProducts[productIndex].totalStock -= item.quantity;
        data.inventoryProducts[productIndex].sales += item.quantity;
      }
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // Revalidate paths so the UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");

    return { success: true, order: orderWithId };
  } catch (error) {
    console.error("Error adding order:", error);
    return { success: false, error: "Gagal menambahkan pesanan" };
  }
}

// ─── Supabase: Add Incoming Stock ──────────────────────────────────────────

/** POS Transaction type */
export interface PosTransaction {
  id: number;
  nomor_transaksi: string;
  tanggal: string;
  customer_name: string;
  payment_method: "cash" | "qris" | "transfer" | "split";
  items: {
    sku: string;
    nama_produk: string;
    harga: number;
    quantity: number;
    discount_percent: number;
    subtotal: number;
  }[];
  subtotal: number;
  per_item_discount_total: number;
  transaction_discount_percent: number;
  transaction_discount_amount: number;
  grand_total: number;
  cash_amount: number;
  change_amount: number;
  created_at: string;
  user_name?: string;
}

// Action to save a POS transaction
export async function savePosTransaction(transaction: {
  customer_name: string;
  payment_method: "cash" | "qris" | "transfer" | "split";
  items: {
    sku: string;
    nama_produk: string;
    harga: number;
    quantity: number;
    discount_percent: number;
    subtotal: number;
  }[];
  subtotal: number;
  per_item_discount_total: number;
  transaction_discount_percent: number;
  transaction_discount_amount: number;
  ppn_amount: number;
  ppn_rate: number;
  grand_total: number;
  cash_amount: number;
  change_amount: number;
}) {
  try {
    const data = await getAppData();
    if (!data.orders) {
      data.orders = [];
    }

    // ── Get current user info from session ──────────────────────
    let userId = "";
    let userName = "Kasir";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Kasir";
      }
    } catch {
      // Fallback: user might not be authenticated
    }

    // ── Determine order origin ──────────────────────────────────
    // If customer is "Umum" (default, no specific customer), treat as offline/POS Direct.
    // If customer has a real name, treat as Online order (even from POS).
    const isOffline = transaction.customer_name === "Umum" || !transaction.customer_name.trim();
    const storeName = isOffline ? "POS Direct" : "Online";

    const maxId = data.orders.length > 0
      ? Math.max(...data.orders.map(o => o.id))
      : 0;

    const transactionNumber = `POS-${String(maxId + 1).padStart(6, "0")}`;

    // Create an order entry for this POS transaction
    const newOrder: Order = {
      id: maxId + 1,
      nomor_order: transactionNumber,
      tanggal_pesanan: new Date().toISOString(),
      user_id: userId,
      seller_name: userName,
      nama_pembeli: transaction.customer_name,
      alamat_pengiriman: "",
      nama_toko_shopee: storeName,
      status_pesanan: "selesai",
      items: transaction.items.map((item, idx) => ({
        id: idx + 1,
        sku: item.sku,
        nama_produk: item.nama_produk,
        harga: item.harga,
        hpp: undefined,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      subtotal: transaction.subtotal,
      ongkir: 0,
      grand_total: transaction.grand_total,
    };

    data.orders.push(newOrder);

    // Update inventory stock
    for (const item of transaction.items) {
      const productIndex = data.inventoryProducts.findIndex(p => p.sku === item.sku);
      if (productIndex !== -1) {
        data.inventoryProducts[productIndex].totalStock -= item.quantity;
        data.inventoryProducts[productIndex].sales += item.quantity;
      }
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // ── Update customer stats in Supabase ──────────────────────────
    // If the customer has a real name (not "Umum"), update their total_transaksi
    if (!isOffline) {
      try {
        const supabaseAdmin = createAdminClient();
        // Find customer by nama_lengkap
        const { data: existing, error: findError } = await supabaseAdmin
          .from("customers")
          .select("id, total_transaksi")
          .eq("nama_lengkap", transaction.customer_name.trim())
          .maybeSingle();

        if (!findError && existing) {
          // Update total_transaksi and terakhir_transaksi
          await supabaseAdmin
            .from("customers")
            .update({
              total_transaksi: (existing.total_transaksi || 0) + transaction.grand_total,
              terakhir_transaksi: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } catch (dbErr) {
        // Non-critical: don't fail the transaction if customer update fails
        console.error("Failed to update customer stats:", dbErr);
      }
    }

    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/pelanggan");

    return { success: true, transaction: newOrder };
  } catch (error) {
    console.error("Error saving POS transaction:", error);
    return { success: false, error: "Gagal menyimpan transaksi POS" };
  }
}

// ─── Atomic stock operations (Supabase) ─────────────────────────
// in a single database transaction via stored procedure.
// ───────────────────────────────────────────────────────────────────────────

/**
 * Item for addIncomingStock action
 */
export interface IncomingStockItemInput {
  /** UUID of the product in the `products` table */
  product_id: string;
  /** Product SKU (for display purposes) */
  sku?: string;
  /** Quantity received (must be > 0) */
  quantity: number;
  /** Buy price per unit (optional) */
  buy_price?: number;
  /** Reference document type (e.g. 'goods_receipt') */
  reference_type?: string;
  /** Reference document ID */
  reference_id?: string;
  /** Optional notes */
  notes?: string;
}

/**
 * Response from addIncomingStock action
 */
export interface IncomingStockActionResult {
  success: boolean;
  success_count?: number;
  fail_count?: number;
  results?: Array<{
    product_id: string;
    sku?: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    success: boolean;
    error?: string;
  }>;
  error?: string;
}

/**
 * Add incoming stock to products atomically via Supabase RPC.
 *
 * Calls the `add_incoming_stock` PostgreSQL stored procedure which:
 * 1. Locks each product row (FOR UPDATE) to prevent race conditions
 * 2. Updates stock_total by adding quantity
 * 3. Inserts a stock_mutations record
 * 4. Rolls back entirely if any item fails
 *
 * @param items - Array of IncomingStockItemInput
 * @returns IncomingStockActionResult
 */
export async function addIncomingStock(
  items: IncomingStockItemInput[]
): Promise<IncomingStockActionResult> {
  try {
    const supabase = createAdminClient();

    // Validate input
    if (!items || items.length === 0) {
      return { success: false, error: "Minimal satu item harus diisi" };
    }

    for (const item of items) {
      if (!item.product_id) {
        return { success: false, error: "Product ID wajib diisi untuk setiap item" };
      }
      if (!item.quantity || item.quantity <= 0) {
        return {
          success: false,
          error: `Quantity untuk product ${item.product_id} harus lebih dari 0`,
        };
      }
    }

    // Get current user ID for the mutation record
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User tidak terautentikasi" };
    }

    // Call the stored procedure
    const { data, error } = await supabase.rpc("add_incoming_stock", {
      p_items: items,
      p_user_id: user.id,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    // Parse the JSONB response
    const result = data as unknown as IncomingStockActionResult;

    // Revalidate paths so UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return result;
  } catch (error) {
    console.error("Error in addIncomingStock:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal memproses barang masuk",
    };
  }
}
