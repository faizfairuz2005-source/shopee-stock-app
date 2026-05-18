"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SupabaseProduct {
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

export interface GoodsReceiptItem {
  id: string;
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_beli: number;
  catatan: string;
}

export interface GoodsReceipt {
  id: string;
  receipt_number: string;
  tanggal: string;
  supplier: string;
  nomor_faktur: string;
  total_item: number;
  total_biaya: number;
  created_at: string;
  items: GoodsReceiptItem[];
}

export interface NewProductInput {
  name: string;
  sku: string;
  price: number;
  hpp?: number;
  description: string;
}

export interface ReceiptItemInput {
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_beli: number;
  catatan: string;
}

// ─── Get Products from Supabase ────────────────────────────────────────────

export async function getSupabaseProducts(): Promise<{
  success: boolean;
  products: SupabaseProduct[];
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error fetching products:", error);
      return { success: false, products: [], error: error.message };
    }

    return { success: true, products: data || [] };
  } catch (error) {
    console.error("Error in getSupabaseProducts:", error);
    return {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : "Gagal mengambil data produk",
    };
  }
}

// ─── Add Product to Supabase ───────────────────────────────────────────────

export async function addSupabaseProduct(
  product: NewProductInput
): Promise<{
  success: boolean;
  product?: SupabaseProduct;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        sku: product.sku,
        name: product.name,
        price: product.price,
        hpp: product.hpp || 0,
        description: product.description,
        stock_total: 0,
        connected_stores: 0,
        sales: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error adding product:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/inventory");
    revalidatePath("/barang-masuk");
    revalidatePath("/");

    return { success: true, product: data };
  } catch (error) {
    console.error("Error in addSupabaseProduct:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambahkan produk",
    };
  }
}

// ─── Get Goods Receipts from Supabase ──────────────────────────────────────

export async function getSupabaseGoodsReceipts(): Promise<{
  success: boolean;
  receipts: GoodsReceipt[];
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    // Call the stored procedure
    const { data, error } = await supabase.rpc("get_goods_receipts", {
      p_limit: 200,
      p_offset: 0,
    });

    if (error) {
      // Fallback: If RPC not available yet, manually query (for dev)
      console.warn("RPC get_goods_receipts not available, trying manual query:", error.message);

      const { data: receiptsData, error: receiptsError } = await supabase
        .from("goods_receipts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (receiptsError) {
        return { success: false, receipts: [], error: receiptsError.message };
      }

      // Fetch items for each receipt
      const receiptsWithItems: GoodsReceipt[] = [];
      for (const receipt of receiptsData || []) {
        const { data: itemsData } = await supabase
          .from("goods_receipt_items")
          .select("*")
          .eq("goods_receipt_id", receipt.id)
          .order("created_at", { ascending: true });

        receiptsWithItems.push({
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          tanggal: receipt.tanggal,
          supplier: receipt.supplier,
          nomor_faktur: receipt.nomor_faktur || "",
          total_item: receipt.total_item,
          total_biaya: receipt.total_biaya,
          created_at: receipt.created_at,
          items: (itemsData || []).map((item) => ({
            id: item.id,
            sku: item.sku,
            nama_produk: item.nama_produk,
            quantity: item.quantity,
            harga_beli: item.harga_beli,
            catatan: item.catatan || "",
          })),
        });
      }

      return { success: true, receipts: receiptsWithItems };
    }

    // Parse RPC result
    const result = data as unknown as {
      success: boolean;
      data: Array<{
        id: string;
        receipt_number: string;
        tanggal: string;
        supplier: string;
        nomor_faktur: string;
        total_item: number;
        total_biaya: number;
        created_at: string;
        items: Array<{
          id: string;
          sku: string;
          nama_produk: string;
          quantity: number;
          harga_beli: number;
          catatan: string;
        }>;
      }>;
      total: number;
    };

    if (result?.data) {
      return { success: true, receipts: result.data };
    }

    return { success: true, receipts: [] };
  } catch (error) {
    console.error("Error in getSupabaseGoodsReceipts:", error);
    return {
      success: false,
      receipts: [],
      error: error instanceof Error ? error.message : "Gagal mengambil riwayat barang masuk",
    };
  }
}

// ─── Save Goods Receipt to Supabase ────────────────────────────────────────

export async function saveGoodsReceiptSupabase(
  receiptData: {
    tanggal: string;
    supplier: string;
    nomor_faktur: string;
    items: ReceiptItemInput[];
  }
): Promise<{
  success: boolean;
  receipt?: GoodsReceipt;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User tidak terautentikasi" };
    }

    // Call the stored procedure
    const { data, error } = await supabase.rpc("save_goods_receipt", {
      p_tanggal: receiptData.tanggal,
      p_supplier: receiptData.supplier,
      p_nomor_faktur: receiptData.nomor_faktur,
      p_items: JSON.parse(JSON.stringify(receiptData.items)),
      p_user_id: user.id,
    });

    if (error) {
      console.error("Supabase RPC error saving goods receipt:", error);
      return { success: false, error: error.message };
    }

    const result = data as unknown as {
      success: boolean;
      receipt_id: string;
      receipt_number: string;
      total_item: number;
      total_biaya: number;
      error?: string;
    };

    if (!result.success) {
      return { success: false, error: result.error || "Gagal menyimpan barang masuk" };
    }

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/barang-masuk");
    revalidatePath("/pos");

    return {
      success: true,
      receipt: {
        id: result.receipt_id,
        receipt_number: result.receipt_number,
        tanggal: receiptData.tanggal,
        supplier: receiptData.supplier,
        nomor_faktur: receiptData.nomor_faktur,
        total_item: result.total_item,
        total_biaya: result.total_biaya,
        created_at: new Date().toISOString(),
        items: receiptData.items.map((item) => ({
          id: "",
          sku: item.sku,
          nama_produk: item.nama_produk,
          quantity: item.quantity,
          harga_beli: item.harga_beli,
          catatan: item.catatan,
        })),
      },
    };
  } catch (error) {
    console.error("Error in saveGoodsReceiptSupabase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan barang masuk",
    };
  }
}
