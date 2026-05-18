import * as XLSX from "xlsx"

export interface ExportColumn {
  key: string
  label: string
  format?: (value: unknown, row: Record<string, unknown>) => string | number
}

function getFilename(prefix: string, ext: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${prefix}-${y}-${m}-${d}.${ext}`
}

function buildRows(data: Record<string, unknown>[], columns: ExportColumn[]): Record<string, string | number>[] {
  return data.map((row) => {
    const r: Record<string, string | number> = {}
    for (const col of columns) {
      const raw = row[col.key]
      r[col.label] = col.format ? col.format(raw, row) : (String(raw ?? ""))
    }
    return r
  })
}

function setColWidths(ws: XLSX.WorkSheet, columns: ExportColumn[], rows: Record<string, string | number>[]) {
  const colWidths = columns.map((col) => {
    const maxData = rows.reduce((max, r) => {
      const val = String(r[col.label] ?? "")
      return Math.max(max, val.length)
    }, 0)
    return { wch: Math.max(col.label.length, maxData, 10) }
  })
  ws["!cols"] = colWidths
}

export function exportToXlsx(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
) {
  const rows = buildRows(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  setColWidths(ws, columns, rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  const filename = getFilename(filenamePrefix, "xlsx")
  XLSX.writeFile(wb, filename)
}

export function exportToCsv(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
) {
  const rows = buildRows(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  const filename = getFilename(filenamePrefix, "csv")
  XLSX.writeFile(wb, filename, { bookType: "csv" })
}

export function exportData(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
  format: "xlsx" | "csv" = "xlsx",
) {
  if (format === "csv") {
    exportToCsv(data, columns, filenamePrefix)
  } else {
    exportToXlsx(data, columns, filenamePrefix)
  }
}

// ─── Column definitions per page ────────────────────────────────

export const INVENTORY_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "sku", label: "SKU" },
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
  { key: "nama_toko_shopee", label: "Toko" },
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
