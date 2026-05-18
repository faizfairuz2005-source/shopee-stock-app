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

export interface ProductRack {
  id: string;
  name: string;
  zone: string;
  description?: string;
}

// ─── Expense (Pengeluaran Harian) Types ────────────────────────────────

export interface Expense {
  id: number;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  metode: "tunai" | "transfer" | "kartu";
  catatan?: string;
  created_at: string;
  user_name?: string;
}

interface AppData {
  inventoryProducts: InventoryProduct[];
  orders: Order[];
  sampleStoreCount: number;
  goodsReceipts?: GoodsReceipt[];
  categories?: ProductCategory[];
  racks?: ProductRack[];
  stockAdjustments?: StockAdjustment[];
  goodsReturns?: GoodsReturn[];
  expenses?: Expense[];
  rackTransfers?: RackTransfer[];
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

    // Ensure racks array exists
    if (!data.racks) {
      data.racks = [];
    }

    if (!data.expenses) {
      data.expenses = [];
    }

    if (!data.rackTransfers) {
      data.rackTransfers = [];
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

// ─── Rack CRUD ────────────────────────────────────────────────────────────

export async function getRacks(): Promise<ProductRack[]> {
  const data = await getAppData();
  return data.racks || [];
}

export async function addRack(rack: Omit<ProductRack, "id">): Promise<{ success: boolean; rack?: ProductRack; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.racks) data.racks = [];

    // Check duplicate name
    if (data.racks.some(r => r.name.toLowerCase() === rack.name.toLowerCase())) {
      return { success: false, error: "Rak dengan nama tersebut sudah ada" };
    }

    const maxId = data.racks.length > 0
      ? Math.max(...data.racks.map(r => Number(r.id) || 0))
      : 0;

    const newRack: ProductRack = {
      id: String(maxId + 1),
      name: rack.name,
      zone: rack.zone,
      description: rack.description,
    };

    data.racks.push(newRack);

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true, rack: newRack };
  } catch (error) {
    console.error("Error adding rack:", error);
    return { success: false, error: "Gagal menambahkan rak" };
  }
}

export async function updateRack(rack: ProductRack): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.racks) {
      return { success: false, error: "Rak tidak ditemukan" };
    }

    const idx = data.racks.findIndex(r => r.id === rack.id);
    if (idx === -1) {
      return { success: false, error: "Rak tidak ditemukan" };
    }

    // Check duplicate name (excluding self)
    if (data.racks.some(r => r.id !== rack.id && r.name.toLowerCase() === rack.name.toLowerCase())) {
      return { success: false, error: "Rak dengan nama tersebut sudah ada" };
    }

    data.racks[idx] = rack;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error updating rack:", error);
    return { success: false, error: "Gagal mengupdate rak" };
  }
}

export async function deleteRack(rackId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.racks) {
      return { success: false, error: "Rak tidak ditemukan" };
    }

    const rack = data.racks.find(r => r.id === rackId);
    if (!rack) {
      return { success: false, error: "Rak tidak ditemukan" };
    }

    // Remove rack from all products that use it
    for (const product of data.inventoryProducts) {
      if (product.lokasiRak === rack.name) {
        product.lokasiRak = undefined;
      }
    }

    data.racks = data.racks.filter(r => r.id !== rackId);

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting rack:", error);
    return { success: false, error: "Gagal menghapus rak" };
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

    // ── Update customer stats in Supabase ──────────────────────────
    // If the customer has a real name (not "Umum"), update their total_transaksi and total_orders
    const customerName = newOrder.nama_pembeli;
    if (customerName && customerName !== "Umum") {
      try {
        const supabaseAdmin = createAdminClient();
        const { data: existing, error: findError } = await supabaseAdmin
          .from("customers")
          .select("id, total_transaksi, total_orders")
          .eq("nama_lengkap", customerName.trim())
          .maybeSingle();

        if (!findError && existing) {
          await supabaseAdmin
            .from("customers")
            .update({
              total_transaksi: (existing.total_transaksi || 0) + newOrder.grand_total,
              total_orders: (existing.total_orders || 0) + 1,
              terakhir_transaksi: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } catch (dbErr) {
        // Non-critical: don't fail the order if customer update fails
        console.error("Failed to update customer stats from addOrder:", dbErr);
      }
    }

    // Revalidate paths so the UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");
    revalidatePath("/pelanggan");

    return { success: true, order: orderWithId };
  } catch (error) {
    console.error("Error adding order:", error);
    return { success: false, error: "Gagal menambahkan pesanan" };
  }
}

// ─── Goods Return (Retur Barang) Types & Actions ────────────────────────────

export interface ReturnItem {
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_jual: number;
  hpp: number;
  subtotal_retur: number;
}

export interface GoodsReturn {
  id: number;
  nomor_retur: string;
  tanggal: string;
  original_order_id: number | null;
  nomor_order: string;
  customer_name: string;
  alasan: string;
  items: ReturnItem[];
  total_item: number;
  total_refund: number;
  /** Total HPP (harga pokok) dari barang yang rusak/cacat — dicatat sebagai kerugian */
  hpp_loss?: number;
  /** Apakah barang diretur dikembalikan ke stok (false untuk barang cacat/rusak) */
  restocked: boolean;
  created_at: string;
  user_name?: string;
}

export interface ReturnInput {
  original_order_id?: number;
  nomor_order: string;
  customer_name: string;
  alasan: string;
  items: {
    sku: string;
    nama_produk: string;
    quantity: number;
    harga_jual: number;
    hpp: number;
  }[];
}

/** Alasan retur yang menyebabkan kerugian (barang tidak bisa dijual kembali) */
const DAMAGE_REASONS = ["Barang cacat/rusak", "Barang expired"];

function isDamageReason(alasan: string): boolean {
  return DAMAGE_REASONS.some(
    (r) => alasan.toLowerCase().includes(r.toLowerCase()) || alasan.toLowerCase().includes("cacat") || alasan.toLowerCase().includes("rusak") || alasan.toLowerCase().includes("expired")
  );
}

export async function saveReturn(returnInput: ReturnInput): Promise<{
  success: boolean;
  goodsReturn?: GoodsReturn;
  error?: string;
}> {
  try {
    const data = await getAppData();

    // Initialize goodsReturns array if not exists
    if (!data.goodsReturns) {
      data.goodsReturns = [];
    }

    // Validate input
    if (!returnInput.items || returnInput.items.length === 0) {
      return { success: false, error: "Minimal satu item harus diretur" };
    }
    if (!returnInput.alasan.trim()) {
      return { success: false, error: "Alasan retur wajib diisi" };
    }

    // Determine if this is a damage-related return (item can't be resold)
    const isDamage = isDamageReason(returnInput.alasan);

    // Get current user name
    let userName = "";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
      }
    } catch {
      // Fallback
    }

    // Auto-increment ID
    const returns: GoodsReturn[] = data.goodsReturns || [];
    const maxId = returns.length > 0
      ? Math.max(...returns.map(r => r.id))
      : 0;

    const hppLoss = returnInput.items.reduce((sum, i) => sum + (i.hpp * i.quantity), 0);

    const newReturn: GoodsReturn = {
      id: maxId + 1,
      nomor_retur: `RET-${String(maxId + 1).padStart(6, '0')}`,
      tanggal: new Date().toISOString().split("T")[0],
      original_order_id: returnInput.original_order_id || null,
      nomor_order: returnInput.nomor_order,
      customer_name: returnInput.customer_name || "Umum",
      alasan: returnInput.alasan,
      items: returnInput.items.map((item, idx) => ({
        sku: item.sku,
        nama_produk: item.nama_produk,
        quantity: item.quantity,
        harga_jual: item.harga_jual,
        hpp: item.hpp,
        subtotal_retur: item.harga_jual * item.quantity,
      })),
      total_item: returnInput.items.reduce((sum, i) => sum + i.quantity, 0),
      total_refund: returnInput.items.reduce((sum, i) => sum + (i.harga_jual * i.quantity), 0),
      hpp_loss: isDamage ? hppLoss : 0,
      restocked: !isDamage,
      created_at: new Date().toISOString(),
      user_name: userName,
    };

    // Save to data
    returns.unshift(newReturn);
    data.goodsReturns = returns;

    // Update inventory stock:
    // - For non-damage returns: ADD back the returned quantities (item can be resold)
    // - For damage returns: DON'T restock (item is damaged/expired), HPP recorded as loss
    if (!isDamage) {
      for (const item of returnInput.items) {
        const productIndex = data.inventoryProducts.findIndex(p => p.sku === item.sku);
        if (productIndex !== -1) {
          data.inventoryProducts[productIndex].totalStock += item.quantity;
        }
      }
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/retur");

    return { success: true, goodsReturn: newReturn };
  } catch (error) {
    console.error("Error saving return:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan retur",
    };
  }
}

export async function getReturns(): Promise<GoodsReturn[]> {
  try {
    const data = await getAppData();
    return data.goodsReturns || [];
  } catch {
    return [];
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
          .select("id, total_transaksi, total_orders")
          .eq("nama_lengkap", transaction.customer_name.trim())
          .maybeSingle();

        if (!findError && existing) {
          // Update total_transaksi, total_orders, and terakhir_transaksi
          await supabaseAdmin
            .from("customers")
            .update({
              total_transaksi: (existing.total_transaksi || 0) + transaction.grand_total,
              total_orders: (existing.total_orders || 0) + 1,
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

// ─── Stock Adjustment Types & Actions ──────────────────────────────

export interface StockAdjustment {
  id: number;
  tanggal: string;
  sku: string;
  nama_produk: string;
  stok_sebelum: number;
  stok_sesudah: number;
  jenis: "tambah" | "kurangi";
  jumlah: number;
  alasan: string;
  catatan?: string;
  /** Nilai kerugian (Rupiah) — untuk barang rusak/hilang, tercatat di laporan P&L */
  nilai_kerugian?: number;
  created_at: string;
  user_name?: string;
}

export interface StockAdjustmentInput {
  sku: string;
  jenis: "tambah" | "kurangi";
  jumlah: number;
  alasan: string;
  catatan?: string;
  /** Nilai kerugian (Rupiah) — untuk barang rusak/hilang */
  nilai_kerugian?: number;
}


export async function getStockAdjustments(): Promise<{
  success: boolean;
  adjustments: StockAdjustment[];
  error?: string;
}> {
  try {
    const data = await getAppData();
    return {
      success: true,
      adjustments: data.stockAdjustments || [],
    };
  } catch (error) {
    console.error("Error getting stock adjustments:", error);
    return {
      success: false,
      adjustments: [],
      error: error instanceof Error ? error.message : "Gagal mengambil riwayat adjust stok",
    };
  }
}

export async function saveStockAdjustment(
  input: StockAdjustmentInput
): Promise<{
  success: boolean;
  adjustment?: StockAdjustment;
  error?: string;
}> {
  try {
    const data = await getAppData();

    // Validate input
    if (!input.sku) {
      return { success: false, error: "Produk harus dipilih" };
    }
    if (!input.jumlah || input.jumlah <= 0) {
      return { success: false, error: "Jumlah harus lebih dari 0" };
    }
    if (!input.alasan.trim()) {
      return { success: false, error: "Alasan penyesuaian wajib diisi" };
    }

    // Find product
    const productIndex = data.inventoryProducts.findIndex(p => p.sku === input.sku);
    if (productIndex === -1) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    const product = data.inventoryProducts[productIndex];
    const stokSebelum = product.totalStock;

    // Calculate new stock
    let stokSesudah: number;
    if (input.jenis === "tambah") {
      stokSesudah = stokSebelum + input.jumlah;
    } else {
      stokSesudah = stokSebelum - input.jumlah;
      if (stokSesudah < 0) {
        return { success: false, error: `Stok tidak mencukupi. Stok saat ini: ${stokSebelum}` };
      }
    }

    // Get current user name
    let userName = "";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
      }
    } catch {
      // Fallback
    }

    // Initialize stockAdjustments array if not exists
    if (!data.stockAdjustments) {
      data.stockAdjustments = [];
    }

    // Auto-increment ID
    const adjustments = data.stockAdjustments;
    const maxId = adjustments.length > 0
      ? Math.max(...adjustments.map(a => a.id))
      : 0;

    const newAdjustment: StockAdjustment = {
      id: maxId + 1,
      tanggal: new Date().toISOString().split("T")[0],
      sku: input.sku,
      nama_produk: product.name,
      stok_sebelum: stokSebelum,
      stok_sesudah: stokSesudah,
      jenis: input.jenis,
      jumlah: input.jumlah,
      alasan: input.alasan,
      catatan: input.catatan,
      nilai_kerugian: input.nilai_kerugian,
      created_at: new Date().toISOString(),
      user_name: userName,
    };

    adjustments.unshift(newAdjustment);

    // Update inventory stock
    data.inventoryProducts[productIndex].totalStock = stokSesudah;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/adjust-stok");
    revalidatePath("/pos");

    return { success: true, adjustment: newAdjustment };
  } catch (error) {
    console.error("Error saving stock adjustment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan penyesuaian stok",
    };
  }
}

// ─── Expense CRUD ────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  try {
    const data = await getAppData();
    return data.expenses || [];
  } catch {
    return [];
  }
}

export async function saveExpense(input: {
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  metode: "tunai" | "transfer" | "kartu";
  catatan?: string;
}): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  try {
    const data = await getAppData();

    if (!data.expenses) {
      data.expenses = [];
    }

    // Validate
    if (!input.tanggal) return { success: false, error: "Tanggal wajib diisi" };
    if (!input.kategori) return { success: false, error: "Kategori wajib dipilih" };
    if (!input.deskripsi.trim()) return { success: false, error: "Deskripsi wajib diisi" };
    if (!input.jumlah || input.jumlah <= 0) return { success: false, error: "Jumlah harus lebih dari 0" };

    // Get current user name
    let userName = "";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
      }
    } catch { /* noop */ }

    const expenses = data.expenses;
    const maxId = expenses.length > 0
      ? Math.max(...expenses.map(e => e.id))
      : 0;

    const newExpense: Expense = {
      id: maxId + 1,
      tanggal: input.tanggal,
      kategori: input.kategori,
      deskripsi: input.deskripsi.trim(),
      jumlah: input.jumlah,
      metode: input.metode,
      catatan: input.catatan?.trim(),
      created_at: new Date().toISOString(),
      user_name: userName,
    };

    expenses.unshift(newExpense);
    data.expenses = expenses;

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/pengeluaran");

    return { success: true, expense: newExpense };
  } catch (error) {
    console.error("Error saving expense:", error);
    return { success: false, error: "Gagal menyimpan pengeluaran" };
  }
}

export async function deleteExpense(expenseId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.expenses) {
      return { success: false, error: "Data pengeluaran tidak ditemukan" };
    }

    const idx = data.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      return { success: false, error: "Pengeluaran tidak ditemukan" };
    }

    data.expenses.splice(idx, 1);

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/pengeluaran");

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Gagal menghapus pengeluaran" };
  }
}

// ─── Product History ───────────────────────────────────────────────────────────

export interface ProductHistoryEntry {
  id: string;
  tanggal: string;
  tipe: "penjualan" | "barang_masuk" | "penyesuaian_stok" | "transfer_rak" | "retur";
  kuantitas: number;
  stok_setelah?: number;
  referensi: string;
  detail: string;
}

export async function getProductHistory(sku: string): Promise<ProductHistoryEntry[]> {
  try {
    const data = await getAppData();
    const history: ProductHistoryEntry[] = [];

    // 1. Orders / Penjualan
    if (data.orders) {
      for (const order of data.orders) {
        const item = order.items.find((i) => i.sku === sku);
        if (item) {
          history.push({
            id: `order-${order.id}-${item.id}`,
            tanggal: order.tanggal_pesanan,
            tipe: "penjualan",
            kuantitas: -item.quantity,
            referensi: order.nomor_order,
            detail: `${item.nama_produk} x${item.quantity} — ${order.nama_pembeli}`,
          });
        }
      }
    }

    // 2. Goods Receipts / Barang Masuk
    if (data.goodsReceipts) {
      for (const receipt of data.goodsReceipts) {
        const item = receipt.items.find((i) => i.sku === sku);
        if (item) {
          history.push({
            id: `gr-${receipt.id}-${item.sku}`,
            tanggal: receipt.tanggal,
            tipe: "barang_masuk",
            kuantitas: item.quantity,
            referensi: `GR-${String(receipt.id).padStart(6, "0")}`,
            detail: `${item.nama_produk} x${item.quantity} dari ${receipt.supplier}`,
          });
        }
      }
    }

    // 3. Stock Adjustments
    if (data.stockAdjustments) {
      for (const adj of data.stockAdjustments) {
        if (adj.sku === sku) {
          history.push({
            id: `adj-${adj.id}`,
            tanggal: adj.tanggal,
            tipe: "penyesuaian_stok",
            kuantitas: adj.jenis === "tambah" ? adj.jumlah : -adj.jumlah,
            stok_setelah: adj.stok_sesudah,
            referensi: `Adj #${adj.id}`,
            detail: `${adj.alasan}${adj.catatan ? ` — ${adj.catatan}` : ""}`,
          });
        }
      }
    }

    // 4. Rack Transfers
    if (data.rackTransfers) {
      for (const transfer of data.rackTransfers) {
        if (transfer.sku === sku) {
          history.push({
            id: `transfer-${transfer.id}`,
            tanggal: transfer.tanggal,
            tipe: "transfer_rak",
            kuantitas: 0,
            referensi: `Transfer #${transfer.id}`,
            detail: `${transfer.dari_rak} → ${transfer.ke_rak}`,
          });
        }
      }
    }

    // 5. Goods Returns
    if (data.goodsReturns) {
      for (const ret of data.goodsReturns) {
        const item = ret.items.find((i) => i.sku === sku);
        if (item) {
          history.push({
            id: `retur-${ret.id}`,
            tanggal: ret.tanggal,
            tipe: "retur",
            kuantitas: ret.restocked ? item.quantity : 0,
            referensi: ret.nomor_retur,
            detail: `${item.nama_produk} x${item.quantity} — ${ret.alasan}${!ret.restocked ? " (tidak dikembalikan)" : ""}`,
          });
        }
      }
    }

    // Sort by tanggal descending
    history.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return history;
  } catch (error) {
    console.error("Error getting product history:", error);
    return [];
  }
}

// ─── Rack Transfer Types & Actions ─────────────────────────────────────────

export interface RackTransfer {
  id: number;
  tanggal: string;
  sku: string;
  nama_produk: string;
  dari_rak: string;
  ke_rak: string;
  catatan?: string;
  created_at: string;
  user_name?: string;
}

export async function getRackTransfers(): Promise<RackTransfer[]> {
  try {
    const data = await getAppData();
    return data.rackTransfers || [];
  } catch {
    return [];
  }
}

export async function saveRackTransfer(input: {
  sku: string;
  dari_rak: string;
  ke_rak: string;
  catatan?: string;
}): Promise<{ success: boolean; transfer?: RackTransfer; error?: string }> {
  try {
    const data = await getAppData();

    // Validate
    if (!input.sku) return { success: false, error: "Produk harus dipilih" };
    if (!input.dari_rak.trim()) return { success: false, error: "Rak asal wajib diisi" };
    if (!input.ke_rak.trim()) return { success: false, error: "Rak tujuan wajib diisi" };
    if (input.dari_rak.trim() === input.ke_rak.trim()) {
      return { success: false, error: "Rak asal dan tujuan tidak boleh sama" };
    }

    // Find product
    const productIndex = data.inventoryProducts.findIndex(p => p.sku === input.sku);
    if (productIndex === -1) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    const product = data.inventoryProducts[productIndex];

    // Get current user name
    let userName = "";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userName = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "";
      }
    } catch { /* noop */ }

    // Initialize array if not exists
    if (!data.rackTransfers) {
      data.rackTransfers = [];
    }

    const transfers = data.rackTransfers;
    const maxId = transfers.length > 0
      ? Math.max(...transfers.map(t => t.id))
      : 0;

    const newTransfer: RackTransfer = {
      id: maxId + 1,
      tanggal: new Date().toISOString().split("T")[0],
      sku: input.sku,
      nama_produk: product.name,
      dari_rak: input.dari_rak.trim(),
      ke_rak: input.ke_rak.trim(),
      catatan: input.catatan?.trim() || undefined,
      created_at: new Date().toISOString(),
      user_name: userName,
    };

    transfers.unshift(newTransfer);
    data.rackTransfers = transfers;

    // Update product's lokasiRak
    data.inventoryProducts[productIndex].lokasiRak = input.ke_rak.trim();

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");

    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/pos");
    revalidatePath("/transfer-rak");

    return { success: true, transfer: newTransfer };
  } catch (error) {
    console.error("Error saving rack transfer:", error);
    return { success: false, error: "Gagal menyimpan transfer rak" };
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
