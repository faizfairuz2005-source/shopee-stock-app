// ─── Column definitions per page ────────────────────────────────
// Separated from export-utils.ts to avoid bundling xlsx (~500KB) on pages
// that only reference column definitions, not the actual export functions.

export interface ExportColumn {
  key: string
  label: string
  format?: (value: unknown, row: Record<string, unknown>) => string | number
}

export const INVENTORY_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "sku", label: "SKU" },
  { key: "barcode", label: "Barcode", format: (v) => (v ? String(v) : "-") },
  { key: "name", label: "Nama Produk" },
  { key: "lokasiRak", label: "Lokasi Rak", format: (v) => (v ? String(v) : "-") },
  { key: "kategori", label: "Kategori", format: (v) => (v ? String(v) : "-") },
  { key: "price", label: "Harga", format: (v) => (typeof v === "number" ? v : 0) },
  { key: "hpp", label: "HPP", format: (v) => (v ? String(v) : "-") },
  { key: "totalStock", label: "Stok", format: (v) => String(v ?? 0) },
  { key: "connectedStores", label: "Toko Terhubung", format: (v) => String(v ?? 0) },
  { key: "sales", label: "Penjualan", format: (v) => String(v ?? 0) },
  { key: "description", label: "Deskripsi", format: (v) => (v ? String(v) : "-") },
]

export const ORDERS_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "nomor_order", label: "No. Order" },
  { key: "tanggal_pesanan", label: "Tanggal" },
  { key: "seller_name", label: "Penjual" },
  { key: "nama_pembeli", label: "Pembeli" },
  { key: "nama_toko", label: "Toko" },
  { key: "status_pesanan", label: "Status" },
  { key: "total_item", label: "Total Item", format: (v) => String(v ?? 0) },
  { key: "subtotal", label: "Subtotal", format: (v) => (typeof v === "number" ? v : 0) },
  { key: "ongkir", label: "Ongkir", format: (v) => (typeof v === "number" ? v : 0) },
  { key: "grand_total", label: "Grand Total", format: (v) => (typeof v === "number" ? v : 0) },
]

export const LAPORAN_SALES_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "orderNumber", label: "No. Order" },
  { key: "date", label: "Tanggal" },
  { key: "sku", label: "SKU" },
  { key: "nama_produk", label: "Produk" },
  { key: "seller", label: "Penjual" },
  { key: "quantity", label: "Kuantitas", format: (v) => String(v ?? 0) },
  { key: "harga", label: "Harga", format: (v) => (typeof v === "number" ? v : 0) },
  { key: "subtotal", label: "Subtotal", format: (v) => (typeof v === "number" ? v : 0) },
]

export const LAPORAN_STOK_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Nama Produk" },
  { key: "totalStock", label: "Stok", format: (v) => String(v ?? 0) },
  { key: "status", label: "Status" },
]

export const GOODS_RECEIPT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "receiptNumber", label: "No. Penerimaan" },
  { key: "tanggal", label: "Tanggal" },
  { key: "supplier", label: "Supplier" },
  { key: "nomorFaktur", label: "No. Faktur" },
  { key: "products", label: "Daftar Produk" },
  { key: "totalItem", label: "Total Item", format: (v) => String(v ?? 0) },
  { key: "totalBiaya", label: "Total Biaya", format: (v) => (typeof v === "number" ? v : 0) },
  { key: "userName", label: "Diinput Oleh" },
]

export const LAPORAN_ADJUSTMENT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "tanggal", label: "Tanggal" },
  { key: "nama_produk", label: "Nama Produk" },
  { key: "sku", label: "SKU" },
  { key: "jenis", label: "Jenis", format: (v) => (v === "tambah" ? "Tambah" : "Kurangi") },
  { key: "jumlah", label: "Jumlah", format: (v) => String(v ?? 0) },
  { key: "stok_sebelum", label: "Stok Sebelum", format: (v) => String(v ?? 0) },
  { key: "stok_sesudah", label: "Stok Sesudah", format: (v) => String(v ?? 0) },
  { key: "alasan", label: "Alasan" },
  { key: "nilai_kerugian", label: "Nilai Kerugian", format: (v) => (typeof v === "number" && v > 0 ? v : "-") },
  { key: "user_name", label: "User", format: (v) => (v ? String(v) : "-") },
]
