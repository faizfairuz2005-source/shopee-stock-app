"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Printer,
  X,
  CheckCircle2,
  Settings2,
  RotateCcw,
  AlertCircle,
  Usb,
  Wifi,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/invoice-utils";
import { useThermalPrinter } from "@/lib/use-thermal-printer";
import { buildEscposFromReceiptData } from "@/lib/escpos";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ThermalReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
  discountPercent?: number;
}

export interface ThermalReceiptData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  time: string;
  cashierName: string;
  customerName: string;
  items: ThermalReceiptItem[];
  subtotal: number;
  perItemDiscountTotal: number;
  transactionDiscountPercent: number;
  transactionDiscountAmount: number;
  dpp: number;
  ppnRate: number;
  ppnAmount: number;
  grandTotal: number;
  paymentMethod: string;
  cashAmount: number;
  transferAmount?: number;
  changeAmount: number;
  discountNote?: string;
}

// ─── Paper size presets ──────────────────────────────────────────────────

type PaperSize = "80mm" | "58mm";

const PAPER_PRESETS = {
  "80mm": { width: 80, charsPerLine: 42, name: "80mm (standar)" },
  "58mm": { width: 58, charsPerLine: 32, name: "58mm (kecil)" },
};

// ─── Generate thermal receipt print HTML ─────────────────────────────────

function generateThermalHtml(
  data: ThermalReceiptData,
  paperSize: PaperSize,
  copies: number,
): string {
  const preset = PAPER_PRESETS[paperSize];
  const px = paperSize === "80mm" ? 80 : 58;
  const lineWidth = preset.charsPerLine;

  // ─── Text helpers ────────────────────────────────────────────
  const center = (text: string) =>
    `<div style="text-align:center">${text}</div>`;
  const divider = () =>
    `<div style="text-align:center;letter-spacing:2px">${"─".repeat(lineWidth)}</div>`;
  const doubleDivider = () =>
    `<div style="text-align:center;letter-spacing:2px">${"═".repeat(lineWidth)}</div>`;
  const spacer = () => `<div style="height:6px"></div>`;

  const leftRight = (left: string, right: string) => {
    const padding = lineWidth - left.length - right.length;
    const dots = padding > 0 ? " ".repeat(padding) : " ";
    return `<div style="display:flex;justify-content:space-between">${left}${dots}${right}</div>`;
  };

    // Generate copies HTML
  let copiesHtml = "";
  for (let c = 0; c < copies; c++) {
    copiesHtml += `
    <div class="receipt-page">
      ${c > 0 ? `<div style="text-align:center;color:#94a3b8;font-size:9px;margin-bottom:8px">— Copy ${c + 1} —</div>` : ""}

      ${center(`<div style="font-size:16px;font-weight:800;letter-spacing:1px">${data.storeName}</div>`)}
      ${data.storeAddress ? center(`<div style="font-size:9px;color:#64748b">${data.storeAddress}</div>`) : ""}
      ${data.storePhone ? center(`<div style="font-size:9px;color:#64748b">${data.storePhone}</div>`) : ""}
      ${data.storeEmail ? center(`<div style="font-size:9px;color:#64748b">${data.storeEmail}</div>`) : ""}

      ${spacer()}
      ${doubleDivider()}

      ${center(`<div style="font-size:11px;font-weight:700;letter-spacing:3px">STRUK PENJUALAN</div>`)}
      ${spacer()}

      <div style="font-size:9px">
        ${leftRight("No. Invoice", data.invoiceNumber)}
        ${data.orderNumber ? leftRight("No. Order", data.orderNumber) : ""}
        ${leftRight("Tanggal", formatDate(data.date))}
        ${leftRight("Jam", data.time)}
        ${data.cashierName ? leftRight("Kasir", data.cashierName) : ""}
        ${leftRight("Pelanggan", data.customerName || "Umum")}
      </div>

      ${divider()}

      <div style="font-size:9px;font-weight:700">
        <div style="display:flex;justify-content:space-between">
          <span style="flex:3">Produk</span>
          <span style="flex:1;text-align:center">Qty</span>
          <span style="flex:2;text-align:right">Subtotal</span>
        </div>
      </div>

      ${data.items.map((item) => `
      <div style="font-size:9px;margin-top:2px">
        <div>${item.name}</div>
        <div style="display:flex;justify-content:space-between;color:#64748b">
          <span style="flex:3">${formatCurrency(item.price)}${item.discountPercent ? ` (${item.discountPercent}%)` : ""}</span>
          <span style="flex:1;text-align:center">${item.quantity}</span>
          <span style="flex:2;text-align:right;font-weight:500">${formatCurrency(item.subtotal)}</span>
        </div>
      </div>
      `).join("")}

      ${divider()}

      <div style="font-size:9px">
        <div style="display:flex;justify-content:space-between">
          <span>Total Item</span>
          <span>${data.items.reduce((s, i) => s + i.quantity, 0)} item</span>
        </div>
        ${leftRight("Subtotal", formatCurrency(data.subtotal))}
        ${data.perItemDiscountTotal > 0 ? leftRight("Diskon Produk", `-${formatCurrency(data.perItemDiscountTotal)}`) : ""}
        ${data.transactionDiscountPercent > 0
          ? leftRight(`Diskon Trans. (${data.transactionDiscountPercent}%)`, `-${formatCurrency(data.transactionDiscountAmount)}`)
          : ""}
        ${data.ppnAmount > 0 ? leftRight(`PPN ${data.ppnRate}%`, formatCurrency(data.ppnAmount)) : ""}
      </div>

      ${doubleDivider()}

      ${center(`<div style="font-size:14px;font-weight:800">${formatCurrency(data.grandTotal)}</div>`)}

      ${divider()}

      <div style="font-size:9px">
        ${data.paymentMethod === "split"
          ? `<div>
              ${leftRight("Metode Bayar", "Split (Tunai + Transfer)")}
              ${leftRight("  Tunai", formatCurrency(data.cashAmount))}
              ${data.transferAmount ? leftRight("  Transfer", formatCurrency(data.transferAmount)) : ""}
              ${leftRight("Total Bayar", formatCurrency((data.cashAmount || 0) + (data.transferAmount || 0)))}
            </div>`
          : `<div>
              ${leftRight("Metode Bayar", data.paymentMethod === "cash" ? "Tunai" : data.paymentMethod === "qris" ? "QRIS" : "Transfer")}
              ${data.cashAmount > 0 ? leftRight("Jumlah Bayar", formatCurrency(data.cashAmount)) : ""}
            </div>`
        }
        ${data.changeAmount > 0 ? leftRight("Kembalian", formatCurrency(data.changeAmount)) : data.changeAmount < 0 ? leftRight("Kekurangan", formatCurrency(Math.abs(data.changeAmount))) : ""}
      </div>

      ${spacer()}

      ${data.discountNote ? `${center(`<div style="font-size:8px;color:#64748b;margin-top:4px">Catatan Diskon: ${data.discountNote}</div>`)}` : ""}

      ${center(`<div style="font-size:10px;font-weight:600">Terima kasih telah berbelanja!</div>`)}
      ${center(`<div style="font-size:8px;color:#94a3b8">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>`)}
      ${center(`<div style="font-size:7px;color:#cbd5e1;margin-top:4px">${data.invoiceNumber} | ${formatDate(data.date)} ${data.time}</div>`)}

      ${spacer()}
      ${center(`<div style="font-size:8px;color:#cbd5e1">Powered by MultiStore</div>`)}

      ${c < copies - 1 ? `<div style="page-break-after:always"></div>` : ""}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${px}mm">
  <title>Struk ${data.invoiceNumber}</title>
  <style>
    @page {
      margin: 0;
      size: ${px}mm auto;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Courier New', 'Consolas', 'SF Mono', 'Fira Code', monospace;
      font-size: 9px;
      line-height: 1.4;
      color: #000;
      background: #fff;
      width: ${px}mm;
      padding: 2mm 3mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-page {
      width: 100%;
    }

    @media print {
      body {
        padding: 2mm 3mm;
        background: #fff;
      }
      .receipt-page {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${copiesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() {
          window.close();
        }, 500);
      }, 300);
    };
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  THERMAL RECEIPT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ThermalReceiptProps {
  data: ThermalReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}

export function ThermalReceiptModal({
  data,
  isOpen,
  onClose,
  onNewTransaction,
}: ThermalReceiptProps) {
  const [paperSize, setPaperSize] = useState<PaperSize>("80mm");
  const [copies, setCopies] = useState(1);
  const [autoPrint, setAutoPrint] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "done" | "error">("idle");
  const [directPrint, setDirectPrint] = useState(false); // true = WebUSB, false = browser print
  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebUSB Thermal Printer hook
  const printer = useThermalPrinter();

  // ─── Auto-connect saved printer on mount ────────────────────
  useEffect(() => {
    if (isOpen && printer.isSupported) {
      printer.reconnectSaved();
    }
  }, [isOpen, printer]);

  // Auto-print on mount
  useEffect(() => {
    if (isOpen && autoPrint && !directPrint) {
      const timer = setTimeout(() => {
        handleBrowserPrint();
      }, 500);
      return () => clearTimeout(timer);
    }
    // We intentionally only auto-print once on modal open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, printer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (printTimerRef.current) {
        clearTimeout(printTimerRef.current);
      }
    };
  }, []);

  // ─── Browser Print (HTML popup) ─────────────────────────────
  const handleBrowserPrint = useCallback(() => {
    setPrintStatus("printing");

    try {
      const html = generateThermalHtml(data, paperSize, copies);
      const printWindow = window.open("", "_blank", `width=400,height=600,menubar=no,toolbar=no,location=no,status=no`);

      if (!printWindow) {
        // Popup blocked
        setPrintStatus("error");
        setTimeout(() => setPrintStatus("idle"), 2000);
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      printTimerRef.current = setTimeout(() => {
        if (!printWindow.closed) {
          setPrintStatus("done");
        }
      }, 2000);
    } catch (err) {
      console.error("Thermal print error:", err);
      setPrintStatus("error");
      setTimeout(() => setPrintStatus("idle"), 2000);
    }
  }, [data, paperSize, copies]);

  // ─── Direct Print via WebUSB ────────────────────────────────
  const handleDirectPrint = useCallback(async () => {
    setPrintStatus("printing");

    try {
      // Build ESC/POS bytes from receipt data
      const escposBytes = buildEscposFromReceiptData(data);
      await printer.print(escposBytes);

      if (printer.error) {
        setPrintStatus("error");
        setTimeout(() => setPrintStatus("idle"), 3000);
      } else {
        setPrintStatus("done");
      }
    } catch (err) {
      console.error("Direct print error:", err);
      setPrintStatus("error");
      setTimeout(() => setPrintStatus("idle"), 3000);
    }
  }, [data, printer]);

  // ─── Main Print handler (chooses method) ────────────────────
  const handlePrint = useCallback(() => {
    if (directPrint && printer.isSupported && printer.status.connected) {
      handleDirectPrint();
    } else {
      handleBrowserPrint();
    }
  }, [directPrint, printer.isSupported, printer.status.connected, handleDirectPrint, handleBrowserPrint]);

  const handleReprint = useCallback(() => {
    setPrintStatus("idle");
    setTimeout(() => handlePrint(), 300);
  }, [handlePrint]);

  // ─── Connect printer ────────────────────────────────────────
  const handleConnectPrinter = useCallback(async () => {
    await printer.connect();
  }, [printer]);

  const handleDisconnectPrinter = useCallback(async () => {
    await printer.disconnect();
    setDirectPrint(false);
  }, [printer]);

  if (!isOpen) return null;

  const paperOptions: PaperSize[] = ["80mm", "58mm"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl bg-card shadow-2xl ring-1 ring-border/60 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/20">
              <Printer className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Cetak Struk</h2>
              <p className="text-[11px] text-muted-foreground">
                {data.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Print Status */}
          {printStatus === "printing" && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center space-y-2">
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm font-medium text-foreground">Mencetak struk...</p>
              <p className="text-xs text-muted-foreground">
                Silakan tunggu, struk sedang dicetak
              </p>
            </div>
          )}

          {printStatus === "done" && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Struk berhasil dicetak!
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70">
                {paperSize === "80mm" ? "Kertas 80mm" : "Kertas 58mm"} &bull; {copies} kopi
              </p>
            </div>
          )}

          {printStatus === "error" && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Gagal mencetak
              </p>
              <p className="text-xs text-red-600/70 dark:text-red-500/70">
                {directPrint && printer.status.connected
                  ? "Pastikan printer terhubung dengan benar dan coba lagi."
                  : printer.error || "Izinkan popup untuk website ini, atau cetak manual"}
              </p>
            </div>
          )}

          {/* Receipt Preview */}
          {printStatus === "idle" && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div
                className="mx-auto bg-white rounded-lg shadow-sm overflow-hidden"
                style={{ maxWidth: paperSize === "80mm" ? "320px" : "240px" }}
              >
                <div className="px-3 py-3 text-[9px] text-black font-mono leading-relaxed">
                  {/* Preview Header */}
                  <div className="text-center">
                    <div className="text-xs font-bold">{data.storeName}</div>
                    {data.storeAddress && (
                      <div className="text-[8px] text-gray-500">{data.storeAddress}</div>
                    )}
                    {data.storePhone && (
                      <div className="text-[8px] text-gray-500">{data.storePhone}</div>
                    )}
                  </div>

                  <div className="text-center text-[7px] text-gray-400 mt-1">
                    {"─".repeat(paperSize === "80mm" ? 35 : 26)}
                  </div>

                  <div className="text-[8px] mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>No. Invoice</span>
                      <span className="font-medium">{data.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal</span>
                      <span>{formatDate(data.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pelanggan</span>
                      <span>{data.customerName || "Umum"}</span>
                    </div>
                  </div>

                  <div className="text-center text-[7px] text-gray-400 mt-1">
                    {"─".repeat(paperSize === "80mm" ? 35 : 26)}
                  </div>

                  {/* Preview Items (first 3) */}
                  <div className="mt-1 text-[7px]">
                    {data.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[60%]">{item.name}</span>
                        <span>{item.quantity}x {formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    {data.items.length > 3 && (
                      <div className="text-center text-gray-400">
                        ...dan {data.items.length - 3} item lainnya
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[7px] text-gray-400 mt-1">
                    {"─".repeat(paperSize === "80mm" ? 35 : 26)}
                  </div>

                  {/* Preview Total */}
                  <div className="mt-1 text-[8px] font-bold text-center">
                    {formatCurrency(data.grandTotal)}
                  </div>

                  <div className="text-center text-[7px] mt-2">
                    Terima kasih telah berbelanja!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {showSettings ? "Sembunyikan Pengaturan" : "Pengaturan Cetak"}
          </button>

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-3 animate-in slide-in-from-top-1 fade-in duration-150">
              {/* Paper Size */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Ukuran Kertas
                </label>
                <div className="flex gap-2">
                  {paperOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => setPaperSize(size)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                        paperSize === size
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {PAPER_PRESETS[size].name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Copies */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Jumlah Kopi
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCopies(n)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all",
                        copies === n
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Print */}
              <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Cetak Otomatis</p>
                  <p className="text-[10px] text-muted-foreground">
                    Cetak struk langsung setelah pembayaran
                  </p>
                </div>
                <button
                  onClick={() => setAutoPrint(!autoPrint)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    autoPrint ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                      autoPrint ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Separator */}
              <Separator className="bg-border/30" />

              {/* Printer Thermal Langsung via WebUSB */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Usb className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">Printer Thermal Langsung</p>
                  </div>
                  {printer.status.connected ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Terhubung
                    </span>
                  ) : printer.isSupported ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                      Putus
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500">
                      <AlertCircle className="h-3 w-3" />
                      Tidak didukung
                    </span>
                  )}
                </div>

                {!printer.isSupported ? (
                  <div className="rounded-xl border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        Cetak langsung thermal hanya didukung di Chrome/Edge. Gunakan browser print sebagai alternatif.
                      </p>
                    </div>
                  </div>
                ) : printer.status.connected ? (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                          <p className="text-xs font-medium text-foreground">
                            {printer.status.deviceName}
                          </p>
                        </div>
                        {printer.status.manufacturer && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                            {printer.status.manufacturer}
                          </p>
                        )}
                        {printer.printProgress && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 ml-5.5">
                            {printer.printProgress}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 rounded-lg text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={handleDisconnectPrinter}
                        disabled={printer.printing}
                      >
                        Putuskan
                      </Button>
                    </div>

                    {/* Direct print toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-foreground">
                          Cetak Langsung via USB
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          Kirim ESC/POS langsung ke printer — tanpa dialog print
                        </p>
                      </div>
                      <button
                        onClick={() => setDirectPrint(!directPrint)}
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors",
                          directPrint ? "bg-primary" : "bg-input",
                        )}
                      >
                        <span
                          className={cn(
                            "block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                            directPrint ? "translate-x-4" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>

                    {printer.error && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {printer.error}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl gap-2 text-xs"
                      onClick={handleConnectPrinter}
                      disabled={printer.connecting}
                    >
                      {printer.connecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Menghubungkan...
                        </>
                      ) : (
                        <>
                          <Usb className="h-4 w-4" />
                          Hubungkan Printer Thermal (USB)
                        </>
                      )}
                    </Button>
                    <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">
                      Hubungkan printer thermal Epson/kompatibel via USB. Browser akan meminta izin.
                    </p>
                    {printer.error && (
                      <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {printer.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border/50 px-5 py-4 space-y-2">
          {printStatus === "done" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl gap-2"
                onClick={handleReprint}
              >
                <RotateCcw className="h-4 w-4" />
                Cetak Ulang
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl gap-2"
                onClick={() => {
                  onNewTransaction();
                  onClose();
                }}
              >
                <Printer className="h-4 w-4" />
                Transaksi Baru
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {printStatus === "printing" ? (
                <Button
                  disabled
                  className="flex-1 h-11 rounded-xl gap-2"
                >
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Mencetak...
                </Button>
              ) : printStatus === "error" ? (
                <Button
                  className="flex-1 h-11 rounded-xl gap-2"
                  onClick={handleReprint}
                >
                  <RotateCcw className="h-4 w-4" />
                  Coba Lagi
                </Button>
              ) : (
                <Button
                  className="flex-1 h-11 rounded-xl gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Cetak Sekarang
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-11 rounded-xl text-xs text-muted-foreground"
                onClick={() => {
                  onNewTransaction();
                  onClose();
                }}
              >
                Lewati
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
