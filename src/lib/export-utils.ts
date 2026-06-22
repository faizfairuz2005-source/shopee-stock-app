// Import from columns file (no xlsx dependency)
import type { ExportColumn } from "./export-columns";
export type { ExportColumn };
export {
  INVENTORY_EXPORT_COLUMNS,
  ORDERS_EXPORT_COLUMNS,
  LAPORAN_SALES_EXPORT_COLUMNS,
  LAPORAN_STOK_EXPORT_COLUMNS,
  GOODS_RECEIPT_EXPORT_COLUMNS,
  LAPORAN_ADJUSTMENT_EXPORT_COLUMNS,
} from "./export-columns";

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

export async function exportToXlsx(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
) {
  const XLSX = await import("xlsx")
  const rows = buildRows(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  const colWidths = columns.map((col) => {
    const maxData = rows.reduce((max, r) => {
      const val = String(r[col.label] ?? "")
      return Math.max(max, val.length)
    }, 0)
    return { wch: Math.max(col.label.length, maxData, 10) }
  })
  ws["!cols"] = colWidths
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  const filename = getFilename(filenamePrefix, "xlsx")
  XLSX.writeFile(wb, filename)
}

export async function exportToCsv(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
) {
  const XLSX = await import("xlsx")
  const rows = buildRows(data, columns)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  const filename = getFilename(filenamePrefix, "csv")
  XLSX.writeFile(wb, filename, { bookType: "csv" })
}

export async function exportData(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  filenamePrefix: string,
  format: "xlsx" | "csv" = "xlsx",
) {
  if (format === "csv") {
    await exportToCsv(data, columns, filenamePrefix)
  } else {
    await exportToXlsx(data, columns, filenamePrefix)
  }
}
