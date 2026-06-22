"use client"

import { useState, type ReactNode } from "react"
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/toast"
import { exportData, type ExportColumn } from "@/lib/export-utils"

interface ExportButtonProps {
  data: Record<string, unknown>[]
  columns: ExportColumn[]
  filenamePrefix: string
  label?: string
  variant?: "default" | "outline"
  disabled?: boolean
  icon?: ReactNode
}

export function ExportButton({
  data,
  columns,
  filenamePrefix,
  label = "Export",
  variant = "outline",
  disabled = false,
  icon,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null)

  const handleExport = async (format: "xlsx" | "csv") => {
    setExporting(format)
    try {
      // Use setTimeout to let the UI update before the potentially blocking export
      await new Promise((r) => setTimeout(r, 50))
      await exportData(data, columns, filenamePrefix, format)
      const ext = format === "xlsx" ? "Excel" : "CSV"
      toast.success(`${filenamePrefix}.${format === "xlsx" ? "xlsx" : "csv"} berhasil di-export`, {
        description: `Format ${ext} — ${data.length} baris data`,
      })
    } catch (err) {
      console.error("Export failed:", err)
      toast.error("Export gagal", { description: "Terjadi kesalahan saat mengexport data" })
    } finally {
      setExporting(null)
    }
  }

  const isLoading = exporting !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant={variant} disabled={disabled || isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : icon ? (
              icon
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isLoading
              ? `Mengexport ${exporting === "xlsx" ? "Excel" : "CSV"}...`
              : label}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => handleExport("xlsx")}
          disabled={isLoading}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-sm font-medium">Excel (.xlsx)</p>
            <p className="text-xs text-muted-foreground">Microsoft Excel format</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3"
          onClick={() => handleExport("csv")}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium">CSV (.csv)</p>
            <p className="text-xs text-muted-foreground">Comma-separated values</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SimpleExportButton({
  data,
  columns,
  filenamePrefix,
  label = "Export Excel",
  disabled = false,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await new Promise((r) => setTimeout(r, 50))
      await exportData(data, columns, filenamePrefix, "xlsx")
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      disabled={disabled || exporting}
      onClick={handleExport}
      className="gap-2"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {exporting ? "Mengexport..." : label}
    </Button>
  )
}
