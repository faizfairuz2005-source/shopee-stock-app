"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

// Type definitions copied from sample-data for use here
export interface InventoryProduct {
  sku: string;
  name: string;
  price: number;
  totalStock: number;
  description: string;
  connectedStores: number;
  sales: number;
}

export interface SalesRecord {
  id: number;
  tanggal_penjualan: string;
  nama_produk: string;
  sku: string;
  harga: number;
  quantity: number;
  total: number;
  seller: string;
  email: string;
}

interface AppData {
  inventoryProducts: InventoryProduct[];
  salesRecords: SalesRecord[];
  sampleStoreCount: number;
}

const dataFilePath = path.join(process.cwd(), "data.json");

// Helper to read data
export async function getAppData(): Promise<AppData> {
  try {
    if (!fs.existsSync(dataFilePath)) {
      throw new Error("data.json not found");
    }
    const fileContents = fs.readFileSync(dataFilePath, "utf8");
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading data.json:", error);
    return {
      inventoryProducts: [],
      salesRecords: [],
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
    
    return { success: true };
  } catch (error) {
    console.error("Error saving inventory:", error);
    return { success: false, error: "Gagal menyimpan data" };
  }
}

// Action to add a new sales record
export async function addSalesRecord(newRecord: Omit<SalesRecord, "id">) {
  try {
    const data = await getAppData();
    
    // Auto-increment ID based on max existing ID
    const maxId = data.salesRecords.length > 0 
      ? Math.max(...data.salesRecords.map(r => r.id)) 
      : 0;
      
    const recordWithId = {
      ...newRecord,
      id: maxId + 1
    };
    
    data.salesRecords.push(recordWithId);
    
    // Update inventory stock based on the new sale
    const productIndex = data.inventoryProducts.findIndex(p => p.sku === newRecord.sku);
    if (productIndex !== -1) {
      data.inventoryProducts[productIndex].totalStock -= newRecord.quantity;
      data.inventoryProducts[productIndex].sales += newRecord.quantity;
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    
    // Revalidate paths so the UI updates globally
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath("/orders");
    
    return { success: true, record: recordWithId };
  } catch (error) {
    console.error("Error adding sales record:", error);
    return { success: false, error: "Gagal menambahkan pesanan" };
  }
}
