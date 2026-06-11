"use client"

import { ExportButton } from "@/components/export-button"
import {
  LAPORAN_SALES_EXPORT_COLUMNS,
  LAPORAN_STOK_EXPORT_COLUMNS,
  LAPORAN_ADJUSTMENT_EXPORT_COLUMNS,
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

interface StockAdjustmentExport {
  tanggal: string
  nama_produk: string
  sku: string
  jenis: string
  jumlah: number
  stok_sebelum: number
  stok_sesudah: number
  alasan: string
  nilai_kerugian?: number
  user_name?: string
}

interface LaporanExportActionsProps {
  flattenedSales: FlattenedSale[]
  stockItems: StockStatusItem[]
  stockAdjustments?: StockAdjustmentExport[]
}

export function LaporanExportActions({
  flattenedSales,
  stockItems,
  stockAdjustments,
}: LaporanExportActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
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
      {stockAdjustments && stockAdjustments.length > 0 && (
        <ExportButton
          data={stockAdjustments as unknown as Record<string, unknown>[]}
          columns={LAPORAN_ADJUSTMENT_EXPORT_COLUMNS}
          filenamePrefix="Laporan-Adjust-Stok"
          label="Export Adjust Stok"
          variant="outline"
        />
      )}
    </div>
  )
}
