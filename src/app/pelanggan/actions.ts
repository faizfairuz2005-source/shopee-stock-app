"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  nama_lengkap: string;
  email: string;
  nomor_hp: string;
  alamat: string;
  catatan: string;
  total_transaksi: number;
  total_poin: number;
  terakhir_transaksi: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  nama_lengkap: string;
  nomor_hp: string;
  email?: string;
  alamat?: string;
  catatan?: string;
}

// ─── Get all customers ────────────────────────────────────────────────────

export async function getCustomers(): Promise<{
  success: boolean;
  customers: Customer[];
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("total_transaksi", { ascending: false })
      .order("nama_lengkap", { ascending: true });

    if (error) {
      console.error("Supabase error fetching customers:", error);
      return { success: false, customers: [], error: error.message };
    }

    return { success: true, customers: data || [] };
  } catch (error) {
    console.error("Error in getCustomers:", error);
    return {
      success: false,
      customers: [],
      error: error instanceof Error ? error.message : "Gagal mengambil data pelanggan",
    };
  }
}

// ─── Get customers for POS (lightweight, no pagination needed) ────────────

export async function getCustomersForPos(): Promise<{
  success: boolean;
  customers: Pick<Customer, "id" | "nama_lengkap" | "nomor_hp" | "total_transaksi">[];
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("customers")
      .select("id, nama_lengkap, nomor_hp, total_transaksi")
      .order("nama_lengkap", { ascending: true });

    if (error) {
      return { success: false, customers: [], error: error.message };
    }

    return { success: true, customers: data || [] };
  } catch (error) {
    return {
      success: false,
      customers: [],
      error: error instanceof Error ? error.message : "Gagal mengambil data pelanggan",
    };
  }
}

// ─── Add new customer ─────────────────────────────────────────────────────

export async function addCustomer(
  input: CustomerInput
): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  try {
    // Validate required fields
    if (!input.nama_lengkap.trim()) {
      return { success: false, error: "Nama lengkap harus diisi" };
    }
    if (!input.nomor_hp.trim()) {
      return { success: false, error: "Nomor HP harus diisi" };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        nama_lengkap: input.nama_lengkap.trim(),
        nomor_hp: input.nomor_hp.trim(),
        email: input.email?.trim() || "",
        alamat: input.alamat?.trim() || "",
        catatan: input.catatan?.trim() || "",
        total_transaksi: 0,
        total_poin: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error adding customer:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/pelanggan");
    revalidatePath("/pos");

    return { success: true, customer: data };
  } catch (error) {
    console.error("Error in addCustomer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambahkan pelanggan",
    };
  }
}

// ─── Update customer ──────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<{
  success: boolean;
  customer?: Customer;
  error?: string;
}> {
  try {
    if (!input.nama_lengkap.trim()) {
      return { success: false, error: "Nama lengkap harus diisi" };
    }
    if (!input.nomor_hp.trim()) {
      return { success: false, error: "Nomor HP harus diisi" };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("customers")
      .update({
        nama_lengkap: input.nama_lengkap.trim(),
        nomor_hp: input.nomor_hp.trim(),
        email: input.email?.trim() || "",
        alamat: input.alamat?.trim() || "",
        catatan: input.catatan?.trim() || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating customer:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/pelanggan");
    revalidatePath("/pos");

    return { success: true, customer: data };
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengupdate pelanggan",
    };
  }
}

// ─── Delete customer ──────────────────────────────────────────────────────

export async function deleteCustomer(
  id: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error deleting customer:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/pelanggan");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus pelanggan",
    };
  }
}

// ─── Get customer transaction history from orders ─────────────────────────
// Fetches orders from data.json that match the customer name

import { getAppData } from "@/app/actions";

export interface CustomerOrder {
  nomor_order: string;
  tanggal_pesanan: string;
  items: { nama_produk: string; quantity: number; harga: number; subtotal: number }[];
  grand_total: number;
  seller_name: string;
}

export async function getCustomerOrders(
  customerName: string
): Promise<{
  success: boolean;
  orders: CustomerOrder[];
  error?: string;
}> {
  try {
    const data = await getAppData();

    const customerOrders = data.orders
      .filter(
        (o) =>
          o.nama_pembeli.toLowerCase() === customerName.toLowerCase() ||
          o.nama_pembeli.toLowerCase().includes(customerName.toLowerCase())
      )
      .map((o) => ({
        nomor_order: o.nomor_order,
        tanggal_pesanan: o.tanggal_pesanan,
        items: o.items.map((item) => ({
          nama_produk: item.nama_produk,
          quantity: item.quantity,
          harga: item.harga,
          subtotal: item.subtotal,
        })),
        grand_total: o.grand_total,
        seller_name: o.seller_name,
      }))
      .sort(
        (a, b) =>
          new Date(b.tanggal_pesanan).getTime() -
          new Date(a.tanggal_pesanan).getTime()
      );

    return { success: true, orders: customerOrders };
  } catch (error) {
    console.error("Error in getCustomerOrders:", error);
    return {
      success: false,
      orders: [],
      error: error instanceof Error ? error.message : "Gagal mengambil riwayat transaksi",
    };
  }
}
