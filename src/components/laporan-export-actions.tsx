"use client"

import { Download } from "lucide-react"
import { ExportButton } from "@/components/export-button"
import {
  LAPORAN_SALES_EXPORT_COLUMNS,
  LAPORAN_STOK_EXPORT_COLUMNS,
} from "@/lib/export-utils"

interface FlattenedSale {
  orderNumber: string
  date: string
  sku: string
  nama_produk: string
  quantity: number
  harga: number
  subtotal: number
  seller: string
}

interface StockStatusItem {
  sku: string
  name: string
  totalStock: number
  status: string
}

interface LaporanExportActionsProps {
  flattenedSales: FlattenedSale[]
  stockItems: StockStatusItem[]
  lowStockItems: StockStatusItem[]
  outOfStockItems: StockStatusItem[]
}

export function LaporanExportActions({
  flattenedSales,
  stockItems,
  lowStockItems,
  outOfStockItems,
}: LaporanExportActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ExportButton
        data={flattenedSales.slice().reverse() as unknown as Record<string, unknown>[]}
        columns={LAPORAN_SALES_EXPORT_COLUMNS}
        filenamePrefix="Laporan-Penjualan"
        label="Export Penjualan"
        variant="outline"
      />
      <ExportButton
        data={stockItems as unknown as Record<string, unknown>[]}
        columns={LAPORAN_STOK_EXPORT_COLUMNS}
        filenamePrefix="Laporan-Stok"
        label="Export Stok"
        variant="outline"
      />
    </div>
  )
}
