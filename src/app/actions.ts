"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit";

// Type definitions for Order system
export interface InventoryProduct {
  sku: string;
  name: string;
  barcode?: string;
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
  /** Batas minimum stok untuk peringatan stok rendah (default 10) */
  minStok?: number;
  /** Tanggal produk pertama kali ditambahkan ke sistem (ISO string) */
  createdAt?: string;
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
  nama_toko: string;
  status_pesanan: 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  items: OrderItem[];
  subtotal: number;
  ongkir: number;
  grand_total: number;
  discount_note?: string;
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

// ─── Supplier Types ─────────────────────────────────────────────────────

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
  const data = await getAppData();
  return data.suppliers || [];
}

export async function addSupplier(input: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.suppliers) data.suppliers = [];

    // Validate
    if (!input.name.trim()) {
      return { success: false, error: "Nama supplier harus diisi" };
    }

    // Check duplicate name
    if (data.suppliers.some(s => s.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return { success: false, error: "Supplier dengan nama tersebut sudah ada" };
    }

    const maxId = data.suppliers.length > 0
      ? Math.max(...data.suppliers.map(s => s.id))
      : 0;

    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      id: maxId + 1,
      name: input.name.trim(),
      contact_person: input.contact_person?.trim() || "",
      phone: input.phone?.trim() || "",
      email: input.email?.trim() || "",
      address: input.address?.trim() || "",
      notes: input.notes?.trim() || "",
      created_at: now,
      updated_at: now,
    };

    data.suppliers.push(newSupplier);

    writeAppData(data);

    // Audit log
    auditLog({
      action: "supplier.create",
      entity_type: "supplier",
      entity_id: String(newSupplier.id),
      entity_name: newSupplier.name,
      details: { contact_person: input.contact_person, phone: input.phone },
    });

    revalidatePath("/supplier");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return { success: true, supplier: newSupplier };
  } catch (error) {
    console.error("Error adding supplier:", error);
    return { success: false, error: "Gagal menambahkan supplier" };
  }
}

export async function updateSupplier(input: Supplier): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.suppliers) {
      return { success: false, error: "Supplier tidak ditemukan" };
    }

    const idx = data.suppliers.findIndex(s => s.id === input.id);
    if (idx === -1) {
      return { success: false, error: "Supplier tidak ditemukan" };
    }

    // Check duplicate name (excluding self)
    if (data.suppliers.some(s => s.id !== input.id && s.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return { success: false, error: "Supplier dengan nama tersebut sudah ada" };
    }

    data.suppliers[idx] = {
      ...input,
      name: input.name.trim(),
      updated_at: new Date().toISOString(),
    };

    writeAppData(data);

    // Audit log
    auditLog({
      action: "supplier.update",
      entity_type: "supplier",
      entity_id: String(input.id),
      entity_name: input.name,
      details: { contact_person: input.contact_person, phone: input.phone },
    });

    revalidatePath("/supplier");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Gagal mengupdate supplier" };
  }
}

export async function deleteSupplier(supplierId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.suppliers) {
      return { success: false, error: "Supplier tidak ditemukan" };
    }

    const idx = data.suppliers.findIndex(s => s.id === supplierId);
    if (idx === -1) {
      return { success: false, error: "Supplier tidak ditemukan" };
    }

    const deletedSupplier = data.suppliers[idx];
    data.suppliers.splice(idx, 1);

    writeAppData(data);

    // Audit log
    auditLog({
      action: "supplier.delete",
      entity_type: "supplier",
      entity_id: String(supplierId),
      entity_name: deletedSupplier?.name,
    });

    revalidatePath("/supplier");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Gagal menghapus supplier" };
  }
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
  suppliers?: Supplier[];
  poinHistory?: PoinHistoryEntry[];
  kits?: ItemKit[];
}

const dataFilePath = path.join(process.cwd(), "data.json");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 150;

/** Busy-wait for a brief delay (used inside synchronous retry loops) */
function busyWait(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {
    /* busy-wait */
  }
}

/**
 * Read and parse data.json with retry on transient file errors (Windows file locking).
 */
function readDataFile(): { parsed: Record<string, unknown> } {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (!fs.existsSync(dataFilePath)) {
        throw new Error("data.json not found");
      }
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      return { parsed };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        busyWait(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError || new Error("Failed to read data.json after retries");
}

/**
 * Write data.json with retry on transient file errors (Windows file contention).
 */
function writeDataFile(data: AppData): void {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        busyWait(RETRY_DELAY_MS);
      }
    }
  }
  throw lastError || new Error("Failed to write data.json after retries");
}

// Helper to read data
export async function getAppData(): Promise<AppData> {
  try {
    const { parsed: data } = readDataFile();

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

    if (!data.suppliers) {
      data.suppliers = [];
    }

    if (!data.poinHistory) {
      data.poinHistory = [];
    }

    if (!data.kits) {
      data.kits = [];
    }

    // Ensure all products have a createdAt date (backfill for existing data)
    const products = data.inventoryProducts as InventoryProduct[];
    for (const product of products) {
      if (!product.createdAt) {
        product.createdAt = "2026-01-01T00:00:00.000Z";
      }
    }

    return data as unknown as AppData;
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

    writeAppData(data);

    // Audit log (generic inventory update — specific changes tracked via other actions)
    auditLog({
      action: "product.update",
      entity_type: "product",
      entity_id: "bulk",
      entity_name: `Updated ${newProducts.length} products`,
      details: { productCount: newProducts.length },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "category.create",
      entity_type: "category",
      entity_id: newCategory.id,
      entity_name: newCategory.name,
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "category.update",
      entity_type: "category",
      entity_id: category.id,
      entity_name: category.name,
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "category.delete",
      entity_type: "category",
      entity_id: categoryId,
      entity_name: category?.name,
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "rack.create",
      entity_type: "rack",
      entity_id: newRack.id,
      entity_name: newRack.name,
      details: { zone: rack.zone },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "rack.update",
      entity_type: "rack",
      entity_id: rack.id,
      entity_name: rack.name,
      details: { zone: rack.zone },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "rack.delete",
      entity_type: "rack",
      entity_id: rackId,
      entity_name: rack?.name,
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "goods_receipt.create",
      entity_type: "receipt",
      entity_id: String(newReceipt.id),
      entity_name: `GR-${String(newReceipt.id).padStart(6, "0")}`,
      details: { supplier: receiptData.supplier, total_items: totalItem, total_cost: totalBiaya },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "order.create",
      entity_type: "order",
      entity_id: orderNumber,
      entity_name: orderNumber,
      details: { customer: newOrder.nama_pembeli, total: newOrder.grand_total, items: newOrder.items.length },
    });

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
      items: returnInput.items.map((item) => ({
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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "goods_return.create",
      entity_type: "return",
      entity_id: newReturn.nomor_retur,
      entity_name: newReturn.nomor_retur,
      details: { order: returnInput.nomor_order, reason: returnInput.alasan, total_refund: newReturn.total_refund, restocked: newReturn.restocked },
    });

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
  transfer_amount?: number;
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
    /** Jika item adalah kit/paket, komponen untuk stock deduction */
    kitComponents?: { sku: string; quantity: number }[];
  }[];
  subtotal: number;
  per_item_discount_total: number;
  transaction_discount_percent: number;
  transaction_discount_amount: number;
  ppn_amount: number;
  ppn_rate: number;
  grand_total: number;
  cash_amount: number;
  transfer_amount?: number;
  change_amount: number;
  /** Jumlah poin yang digunakan/diredeem (1 poin = Rp1.000) */
  poin_used?: number;
  /** Catatan untuk diskon transaksi (opsional, untuk audit) */
  discount_note?: string;
}) {
  try {
    // ── Validation ──────────────────────────────────────────────
    if (!transaction.items || transaction.items.length === 0) {
      return { success: false, error: "Tidak ada item dalam transaksi" };
    }

    if (transaction.grand_total < 0) {
      return { success: false, error: "Grand total tidak boleh negatif" };
    }

    if (transaction.cash_amount < 0) {
      return { success: false, error: "Jumlah pembayaran tidak valid" };
    }

    if (transaction.change_amount < 0) {
      return { success: false, error: "Uang yang dibayarkan kurang dari total belanja" };
    }

    const data = await getAppData();
    if (!data.orders) {
      data.orders = [];
    }

    // ── Stock validation ────────────────────────────────────────
    const stockErrors: string[] = [];
    for (const item of transaction.items) {
      if (item.kitComponents && item.kitComponents.length > 0) {
        // Kit item: check stock for each component
        for (const comp of item.kitComponents) {
          const product = data.inventoryProducts.find(p => p.sku === comp.sku);
          if (!product) {
            stockErrors.push(`Komponen "${comp.sku}" tidak ditemukan di database`);
          } else {
            const neededQty = comp.quantity * item.quantity;
            if (product.totalStock < neededQty) {
              stockErrors.push(
                `Stok "${product.name}" tidak mencukupi: tersedia ${product.totalStock}, dibutuhkan ${neededQty} (untuk paket "${item.nama_produk}" x${item.quantity})`
              );
            }
          }
        }
      } else {
        // Regular product
        const product = data.inventoryProducts.find(p => p.sku === item.sku);
        if (!product) {
          stockErrors.push(`Produk "${item.nama_produk}" (SKU: ${item.sku}) tidak ditemukan di database`);
        } else {
          if (product.totalStock < item.quantity) {
            stockErrors.push(
              `Stok "${product.name}" tidak mencukupi: tersedia ${product.totalStock}, dibutuhkan ${item.quantity}`
            );
          }
        }
      }
    }

    if (stockErrors.length > 0) {
      return {
        success: false,
        error: `Stok tidak mencukupi:\n${stockErrors.join("\n")}`,
        stockErrors,
      };
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
      nama_toko: storeName,
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
      discount_note: transaction.discount_note,
    };

    data.orders.push(newOrder);

    // Update inventory stock — handle kit items by deducting components
    for (const item of transaction.items) {
      if (item.kitComponents && item.kitComponents.length > 0) {
        // Kit item: deduct stock from each component product
        for (const comp of item.kitComponents) {
          const productIndex = data.inventoryProducts.findIndex(p => p.sku === comp.sku);
          if (productIndex !== -1) {
            const qtyToDeduct = comp.quantity * item.quantity;
            data.inventoryProducts[productIndex].totalStock -= qtyToDeduct;
            data.inventoryProducts[productIndex].sales += qtyToDeduct;
          }
        }
      } else {
        // Regular product
        const productIndex = data.inventoryProducts.findIndex(p => p.sku === item.sku);
        if (productIndex !== -1) {
          data.inventoryProducts[productIndex].totalStock -= item.quantity;
          data.inventoryProducts[productIndex].sales += item.quantity;
        }
      }
    }

    writeAppData(data);

    // ── Update customer stats & poin in Supabase ──────────────────
    if (!isOffline) {
      try {
        const supabaseAdmin = createAdminClient();
        // Find customer by nama_lengkap
        const { data: existing, error: findError } = await supabaseAdmin
          .from("customers")
          .select("id, total_transaksi, total_orders, total_poin")
          .eq("nama_lengkap", transaction.customer_name.trim())
          .maybeSingle();

        if (!findError && existing) {
          // Hitung poin baru: 1 poin per Rp10.000 dari total belanja (sebelum diskon poin)
          const totalSebelumPoin = transaction.subtotal - transaction.per_item_discount_total - transaction.transaction_discount_amount + transaction.ppn_amount;
          const poinEarned = Math.max(0, Math.floor(totalSebelumPoin / 10000));
          const poinRedeemed = Math.min(transaction.poin_used || 0, existing.total_poin || 0);
          const poinBalance = Math.max(0, (existing.total_poin || 0) - poinRedeemed + poinEarned);

          await supabaseAdmin
            .from("customers")
            .update({
              total_transaksi: (existing.total_transaksi || 0) + transaction.grand_total,
              total_orders: (existing.total_orders || 0) + 1,
              total_poin: poinBalance,
              terakhir_transaksi: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          // ── Record poin history ──────────────────────────────
          if (!data.poinHistory) {
            data.poinHistory = [];
          }
          const now = new Date().toISOString();

          if (poinEarned > 0) {
            data.poinHistory.push({
              id: `poin-earn-${maxId + 1}-${Date.now()}`,
              tanggal: now,
              customer_name: transaction.customer_name.trim(),
              tipe: "earned",
              jumlah: poinEarned,
              saldo_setelah: poinBalance,
              referensi: transactionNumber,
              detail: `Poin dari transaksi ${transactionNumber} — belanja Rp ${(totalSebelumPoin).toLocaleString("id-ID")}`,
              created_at: now,
            });
          }

          if (poinRedeemed > 0) {
            data.poinHistory.push({
              id: `poin-redeem-${maxId + 1}-${Date.now()}`,
              tanggal: now,
              customer_name: transaction.customer_name.trim(),
              tipe: "redeemed",
              jumlah: -poinRedeemed,
              saldo_setelah: poinBalance,
              referensi: transactionNumber,
              detail: `Redemption ${poinRedeemed} poin di transaksi ${transactionNumber} (Rp ${(poinRedeemed * 1000).toLocaleString("id-ID")})`,
              created_at: now,
            });
          }

          // Save poin history to data.json
          writeAppData(data);
        }


      } catch (dbErr) {
        // Non-critical: don't fail the transaction if customer update fails
        console.error("Failed to update customer stats:", dbErr);
      }
    }

    // Audit log
    await auditLog({
      action: "pos.transaction",
      entity_type: "order",
      entity_id: transactionNumber,
      entity_name: transactionNumber,
      details: { customer: transaction.customer_name, payment: transaction.payment_method, total: transaction.grand_total, items: transaction.items.length, poin_used: transaction.poin_used, discount_note: transaction.discount_note },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "stock.adjust",
      entity_type: "adjustment",
      entity_id: input.sku,
      entity_name: product.name,
      details: { type: input.jenis, quantity: input.jumlah, before: stokSebelum, after: stokSesudah, reason: input.alasan, loss: input.nilai_kerugian },
    });

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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "expense.create",
      entity_type: "expense",
      entity_id: String(newExpense.id),
      entity_name: newExpense.deskripsi,
      details: { category: input.kategori, amount: input.jumlah, method: input.metode },
    });

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

    // Audit log
    auditLog({
      action: "expense.delete",
      entity_type: "expense",
      entity_id: String(expenseId),
      details: { deletedExpense: data.expenses[idx] },
    });

    data.expenses.splice(idx, 1);

    writeAppData(data);

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

// ─── Poin History Types ────────────────────────────────────────────────────────

export interface PoinHistoryEntry {
  id: string;
  tanggal: string;
  customer_name: string;
  tipe: "earned" | "redeemed" | "adjusted";
  jumlah: number;
  saldo_setelah: number;
  referensi: string;
  detail: string;
  created_at: string;
}

// ─── Item Kit Types ────────────────────────────────────────────────────────────

export interface KitComponent {
  sku: string;
  name: string;
  quantity: number;
}

export interface ItemKit {
  id: number;
  name: string;
  price: number;
  description: string;
  components: KitComponent[];
  created_at: string;
  updated_at: string;
}

export async function getItemKits(): Promise<ItemKit[]> {
  const data = await getAppData();
  return data.kits || [];
}

export async function addItemKit(input: {
  name: string;
  price: number;
  description?: string;
  components: { sku: string; quantity: number }[];
}): Promise<{ success: boolean; kit?: ItemKit; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.kits) data.kits = [];

    // Validate
    if (!input.name.trim()) return { success: false, error: "Nama paket harus diisi" };
    if (input.price <= 0) return { success: false, error: "Harga paket harus lebih dari 0" };
    if (!input.components || input.components.length === 0) {
      return { success: false, error: "Minimal satu produk harus dipilih" };
    }

    // Check duplicate name
    if (data.kits.some(k => k.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return { success: false, error: "Paket dengan nama tersebut sudah ada" };
    }

    // Validate all components exist
    for (const comp of input.components) {
      const product = data.inventoryProducts.find(p => p.sku === comp.sku);
      if (!product) {
        return { success: false, error: `Produk dengan SKU ${comp.sku} tidak ditemukan` };
      }
      if (comp.quantity <= 0) {
        return { success: false, error: "Kuantitas komponen harus lebih dari 0" };
      }
    }

    const maxId = data.kits.length > 0 ? Math.max(...data.kits.map(k => k.id)) : 0;
    const now = new Date().toISOString();

    const newKit: ItemKit = {
      id: maxId + 1,
      name: input.name.trim(),
      price: input.price,
      description: input.description?.trim() || "",
      components: input.components.map(comp => ({
        sku: comp.sku,
        name: data.inventoryProducts.find(p => p.sku === comp.sku)?.name || comp.sku,
        quantity: comp.quantity,
      })),
      created_at: now,
      updated_at: now,
    };

    data.kits.push(newKit);
    writeAppData(data);

    auditLog({
      action: "kit.create",
      entity_type: "kit",
      entity_id: String(newKit.id),
      entity_name: newKit.name,
      details: { components: newKit.components.length },
    });

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true, kit: newKit };
  } catch (error) {
    console.error("Error adding kit:", error);
    return { success: false, error: "Gagal menambahkan paket barang" };
  }
}

export async function updateItemKit(input: ItemKit): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.kits) return { success: false, error: "Data paket tidak ditemukan" };

    const idx = data.kits.findIndex(k => k.id === input.id);
    if (idx === -1) return { success: false, error: "Paket tidak ditemukan" };

    // Check duplicate name (excluding self)
    if (data.kits.some(k => k.id !== input.id && k.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return { success: false, error: "Paket dengan nama tersebut sudah ada" };
    }

    data.kits[idx] = {
      ...input,
      name: input.name.trim(),
      components: input.components.map(comp => ({
        sku: comp.sku,
        name: data.inventoryProducts.find(p => p.sku === comp.sku)?.name || comp.sku,
        quantity: comp.quantity,
      })),
      updated_at: new Date().toISOString(),
    };

    writeAppData(data);

    auditLog({
      action: "kit.update",
      entity_type: "kit",
      entity_id: String(input.id),
      entity_name: input.name,
    });

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error updating kit:", error);
    return { success: false, error: "Gagal mengupdate paket barang" };
  }
}

export async function deleteItemKit(kitId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await getAppData();
    if (!data.kits) return { success: false, error: "Data paket tidak ditemukan" };

    const idx = data.kits.findIndex(k => k.id === kitId);
    if (idx === -1) return { success: false, error: "Paket tidak ditemukan" };

    const deletedName = data.kits[idx]?.name;
    data.kits.splice(idx, 1);

    writeAppData(data);

    auditLog({
      action: "kit.delete",
      entity_type: "kit",
      entity_id: String(kitId),
      entity_name: deletedName,
    });

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting kit:", error);
    return { success: false, error: "Gagal menghapus paket barang" };
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

    writeAppData(data);

    // Audit log
    auditLog({
      action: "stock.transfer_rack",
      entity_type: "rack",
      entity_id: newTransfer.sku,
      entity_name: product.name,
      details: { from: input.dari_rak.trim(), to: input.ke_rak.trim() },
    });

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

// ─── Auto-Backup Configuration ───────────────────────────────────────────

export interface AutoBackupConfig {
  /** Interval in hours between automatic backups. 0 = disabled. */
  intervalHours: number;
  /** Unix timestamp of last auto-backup */
  lastBackupAt: number | null;
  /** Whether auto-backup is enabled */
  enabled: boolean;
}

const AUTO_BACKUP_META_FILE = path.join(process.cwd(), "backups", ".autobackup-meta.json");
const DEFAULT_BACKUP_CONFIG: AutoBackupConfig = {
  intervalHours: 6,
  lastBackupAt: null,
  enabled: false,
};

function getAutoBackupConfig(): AutoBackupConfig {
  try {
    if (fs.existsSync(AUTO_BACKUP_META_FILE)) {
      const raw = fs.readFileSync(AUTO_BACKUP_META_FILE, "utf8");
      return { ...DEFAULT_BACKUP_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_BACKUP_CONFIG };
}

function saveAutoBackupMeta(config: AutoBackupConfig): void {
  try {
    const dir = path.dirname(AUTO_BACKUP_META_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AUTO_BACKUP_META_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch {
    // non-critical, ignore
  }
}

/**
 * Check if an auto-backup is due and create one if needed.
 * Reads the last backup timestamp and compares with configured interval.
 */
function maybeAutoBackup(): void {
  try {
    const config = getAutoBackupConfig();
    if (!config.enabled || config.intervalHours <= 0) return;

    const now = Date.now();
    const elapsed = config.lastBackupAt ? (now - config.lastBackupAt) / (1000 * 60 * 60) : Infinity;

    if (elapsed < config.intervalHours) return;

    // Create backup
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const filename = `autobackup-${y}-${m}-${d}_${h}-${min}.json`;

    const content = fs.readFileSync(dataFilePath, "utf8");
    fs.writeFileSync(path.join(BACKUP_DIR, filename), content, "utf8");

    // Update last backup timestamp
    config.lastBackupAt = now;
    saveAutoBackupMeta(config);

    console.log(`[AutoBackup] Created: ${filename}`);
  } catch (error) {
    console.error("[AutoBackup] Failed:", error);
  }
}

/**
 * Centralized write function that saves data to data.json and triggers auto-backup.
 * Uses retry-safe write to handle Windows file contention.
 * Use this instead of fs.writeFileSync(dataFilePath, ...) throughout the codebase.
 */
function writeAppData(data: AppData): void {
  writeDataFile(data);
  maybeAutoBackup();
}

/**
 * Update the auto-backup configuration.
 */
export async function updateAutoBackupConfig(
  config: Partial<Pick<AutoBackupConfig, "intervalHours" | "enabled">>
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = getAutoBackupConfig();
    const updated: AutoBackupConfig = {
      ...current,
      ...config,
      lastBackupAt: current.lastBackupAt,
    };

    // Validate
    if (updated.enabled && (updated.intervalHours < 1 || updated.intervalHours > 168)) {
      return { success: false, error: "Interval harus antara 1-168 jam (1 jam - 7 hari)" };
    }

    saveAutoBackupMeta(updated);

    // If enabling and no lastBackup yet, trigger an immediate backup
    if (updated.enabled && !updated.lastBackupAt) {
      maybeAutoBackup();
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating auto-backup config:", error);
    return { success: false, error: "Gagal menyimpan konfigurasi backup" };
  }
}

/**
 * Get current auto-backup configuration and status.
 */
export async function getAutoBackupStatus(): Promise<{
  success: boolean;
  config?: AutoBackupConfig;
  nextBackupIn?: string;
  totalBackups?: number;
  error?: string;
}> {
  try {
    const config = getAutoBackupConfig();

    let nextBackupIn: string | undefined;
    if (config.enabled && config.lastBackupAt) {
      const nextTime = config.lastBackupAt + config.intervalHours * 60 * 60 * 1000;
      const remaining = Math.max(0, nextTime - Date.now());
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          nextBackupIn = `${hours}j ${minutes}m`;
        } else {
          nextBackupIn = `${minutes}m`;
        }
      } else {
        nextBackupIn = "Sebentar lagi";
      }
    }

    let totalBackups: number | undefined;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      totalBackups = files.filter((f) => f.endsWith(".json") && f.startsWith("autobackup-")).length;
    }

    return { success: true, config, nextBackupIn, totalBackups };
  } catch (error) {
    console.error("Error getting auto-backup status:", error);
    return { success: false, error: "Gagal mengambil status backup" };
  }
}

// ─── Backup & Export Actions ──────────────────────────────────────────────

const BACKUP_DIR = path.join(process.cwd(), "backups");

const ENTITY_COLUMNS: Record<string, { key: string; label: string }[]> = {
  products: [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Nama Produk" },
    { key: "price", label: "Harga Jual" },
    { key: "hpp", label: "HPP" },
    { key: "totalStock", label: "Stok" },
    { key: "sales", label: "Penjualan" },
    { key: "kategori", label: "Kategori" },
    { key: "lokasiRak", label: "Lokasi Rak" },
    { key: "minStok", label: "Min. Stok" },
    { key: "connectedStores", label: "Toko Terhubung" },
    { key: "description", label: "Deskripsi" },
  ],
  orders: [
    { key: "nomor_order", label: "No. Order" },
    { key: "tanggal_pesanan", label: "Tanggal" },
    { key: "seller_name", label: "Penjual" },
    { key: "nama_pembeli", label: "Pembeli" },
    { key: "nama_toko", label: "Toko" },
    { key: "status_pesanan", label: "Status" },
    { key: "subtotal", label: "Subtotal" },
    { key: "ongkir", label: "Ongkir" },
    { key: "grand_total", label: "Grand Total" },
  ],
  suppliers: [
    { key: "name", label: "Nama Supplier" },
    { key: "contact_person", label: "Kontak Person" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "address", label: "Alamat" },
    { key: "notes", label: "Catatan" },
  ],
  expenses: [
    { key: "tanggal", label: "Tanggal" },
    { key: "kategori", label: "Kategori" },
    { key: "deskripsi", label: "Deskripsi" },
    { key: "jumlah", label: "Jumlah" },
    { key: "metode", label: "Metode" },
    { key: "user_name", label: "User" },
  ],
  returns: [
    { key: "nomor_retur", label: "No. Retur" },
    { key: "tanggal", label: "Tanggal" },
    { key: "nomor_order", label: "No. Order" },
    { key: "customer_name", label: "Pelanggan" },
    { key: "alasan", label: "Alasan" },
    { key: "total_refund", label: "Total Refund" },
    { key: "restocked", label: "Restok" },
  ],
  adjustments: [
    { key: "tanggal", label: "Tanggal" },
    { key: "nama_produk", label: "Produk" },
    { key: "sku", label: "SKU" },
    { key: "jenis", label: "Jenis" },
    { key: "jumlah", label: "Jumlah" },
    { key: "alasan", label: "Alasan" },
    { key: "user_name", label: "User" },
  ],
  kits: [
    { key: "name", label: "Nama Paket" },
    { key: "price", label: "Harga Jual" },
    { key: "description", label: "Deskripsi" },
    { key: "components", label: "Komponen" },
  ],
  goodsReceipts: [
    { key: "tanggal", label: "Tanggal" },
    { key: "supplier", label: "Supplier" },
    { key: "nomor_faktur", label: "No. Faktur" },
    { key: "total_item", label: "Total Item" },
    { key: "total_biaya", label: "Total Biaya" },
    { key: "user_name", label: "User" },
  ],
};

function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",");
  const body = rows
    .map((row) => {
      return columns
        .map((c) => {
          const val = row[c.key];
          if (c.key === "components" && Array.isArray(val)) {
            return escapeCsvValue(val.map((v: { name: string; quantity: number }) => `${v.name} x${v.quantity}`).join("; "));
          }
          if (c.key === "items" && Array.isArray(val)) {
            return escapeCsvValue(val.map((v: { nama_produk: string; quantity: number }) => `${v.nama_produk} x${v.quantity}`).join("; "));
          }
          return escapeCsvValue(val);
        })
        .join(",");
    })
    .join("\n");
  return `${header}\n${body}`;
}

/**
 * Export full database as downloadable JSON string.
 */
export async function exportDatabaseJSON(): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return { success: false, error: "File database tidak ditemukan" };
    }
    const content = fs.readFileSync(dataFilePath, "utf8");
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const filename = `multistore-backup-${y}-${m}-${d}_${h}-${min}.json`;

    // Make sure backup dir exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Save a copy to backups folder
    fs.writeFileSync(path.join(BACKUP_DIR, filename), content, "utf8");

    auditLog({
      action: "backup.export_json",
      entity_type: "backup",
      entity_id: filename,
      entity_name: filename,
    });

    return { success: true, data: content, filename };
  } catch (error) {
    console.error("Error exporting database:", error);
    return { success: false, error: "Gagal mengexport database" };
  }
}

/**
 * Export a specific entity as CSV string.
 */
export async function exportEntityCSV(
  entityType: string
): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const columns = ENTITY_COLUMNS[entityType];
    if (!columns) {
      return { success: false, error: `Tipe data "${entityType}" tidak dikenal` };
    }

    const appData = await getAppData();
    let rows: Record<string, unknown>[] = [];

    switch (entityType) {
      case "products":
        rows = appData.inventoryProducts as unknown as Record<string, unknown>[];
        break;
      case "orders":
        rows = appData.orders as unknown as Record<string, unknown>[];
        break;
      case "suppliers":
        rows = appData.suppliers as unknown as Record<string, unknown>[];
        break;
      case "expenses":
        rows = appData.expenses as unknown as Record<string, unknown>[];
        break;
      case "returns":
        rows = (appData.goodsReturns || []).map((r) => ({
          ...r,
          restocked: r.restocked ? "Ya" : "Tidak",
        })) as unknown as Record<string, unknown>[];
        break;
      case "adjustments":
        rows = appData.stockAdjustments as unknown as Record<string, unknown>[];
        break;
      case "kits":
        rows = (appData.kits || []).map((k) => ({
          ...k,
          components: k.components || [],
        })) as unknown as Record<string, unknown>[];
        break;
      case "goodsReceipts":
        rows = (appData.goodsReceipts || []).map((r) => ({
          ...r,
          items: r.items || [],
        })) as unknown as Record<string, unknown>[];
        break;
      default:
        return { success: false, error: `Tipe data "${entityType}" tidak dikenal` };
    }

    const csv = generateCsv(rows, columns);
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const filename = `${entityType}-${y}-${m}-${d}.csv`;

    auditLog({
      action: "backup.export_csv",
      entity_type: "backup",
      entity_id: filename,
      entity_name: `${entityType} CSV export`,
      details: { entityType, rowCount: rows.length },
    });

    return { success: true, data: csv, filename };
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return { success: false, error: "Gagal mengexport CSV" };
  }
}

/**
 * Download a specific backup file from the backups directory.
 */
export async function downloadBackupFile(
  filename: string
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    // Security: prevent path traversal
    const sanitized = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, sanitized);

    if (!fs.existsSync(filepath)) {
      return { success: false, error: "File backup tidak ditemukan" };
    }

    // Verify it's within BACKUP_DIR
    if (!filepath.startsWith(BACKUP_DIR)) {
      return { success: false, error: "Akses file ditolak" };
    }

    const content = fs.readFileSync(filepath, "utf8");

    auditLog({
      action: "backup.download",
      entity_type: "backup",
      entity_id: sanitized,
      entity_name: sanitized,
    });

    return { success: true, data: content };
  } catch (error) {
    console.error("Error downloading backup:", error);
    return { success: false, error: "Gagal mengunduh file backup" };
  }
}

/**
 * Delete a specific backup file from the backups directory.
 */
export async function deleteBackupFile(
  filename: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Security: prevent path traversal
    const sanitized = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, sanitized);

    if (!fs.existsSync(filepath)) {
      return { success: false, error: "File backup tidak ditemukan" };
    }

    // Verify it's within BACKUP_DIR
    if (!filepath.startsWith(BACKUP_DIR)) {
      return { success: false, error: "Akses file ditolak" };
    }

    fs.unlinkSync(filepath);

    auditLog({
      action: "backup.delete",
      entity_type: "backup",
      entity_id: sanitized,
      entity_name: sanitized,
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting backup:", error);
    return { success: false, error: "Gagal menghapus file backup" };
  }
}

/**
 * List available backup files in the backups directory.
 */
export async function listBackups(): Promise<{
  success: boolean;
  backups?: { name: string; size: number; date: string }[];
  error?: string;
}> {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return { success: true, backups: [] };
    }
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: stat.size,
          date: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // last 20 backups

    return { success: true, backups };
  } catch (error) {
    console.error("Error listing backups:", error);
    return { success: false, error: "Gagal mengambil daftar backup" };
  }
}

/**
 * Restore database from uploaded JSON string.
 * Validates the data structure before restoring.
 */
export async function restoreDatabase(
  jsonString: string
): Promise<{
  success: boolean;
  report?: { tables: string[]; totalProducts: number; totalOrders: number };
  error?: string;
}> {
  try {
    // Parse and validate
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { success: false, error: "File JSON tidak valid" };
    }

    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Format data tidak valid" };
    }

    const data = parsed as Record<string, unknown>;

    // Validate required fields
    if (!Array.isArray(data.inventoryProducts)) {
      return { success: false, error: "Data tidak mengandung daftar produk yang valid" };
    }

    // Validate each product has required fields
    for (const p of data.inventoryProducts) {
      if (!p || typeof p !== "object") {
        return { success: false, error: "Terdapat data produk yang tidak valid" };
      }
      const product = p as Record<string, unknown>;
      if (!product.sku || !product.name) {
        return { success: false, error: "Setiap produk harus memiliki SKU dan Nama" };
      }
    }

    // Create auto-backup before restoring
    const currentData = fs.readFileSync(dataFilePath, "utf8");
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const autoBackupName = `pre-restore-${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, autoBackupName), currentData, "utf8");

    // Write restored data
    writeAppData(parsed as AppData);

    const report = {
      tables: Object.keys(data).filter((k) => Array.isArray(data[k])),
      totalProducts: data.inventoryProducts.length,
      totalOrders: Array.isArray(data.orders) ? data.orders.length : 0,
    };

    auditLog({
      action: "backup.restore",
      entity_type: "backup",
      entity_id: autoBackupName,
      entity_name: "Database restored from backup",
      details: report,
    });

    // Revalidate all paths
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");
    revalidatePath("/pos");
    revalidatePath("/barang-masuk");
    revalidatePath("/pelanggan");
    revalidatePath("/supplier");
    revalidatePath("/pengeluaran");
    revalidatePath("/retur");
    revalidatePath("/adjust-stok");
    revalidatePath("/transfer-rak");
    revalidatePath("/settings");

    return { success: true, report };
  } catch (error) {
    console.error("Error restoring database:", error);
    return { success: false, error: "Gagal merestore database" };
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
