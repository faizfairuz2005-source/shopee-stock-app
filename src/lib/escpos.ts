/**
 * ESC/POS Command Builder untuk thermal printer.
 *
 * Membangun raw byte array yang bisa dikirim via WebUSB ke printer thermal
 * yang kompatibel dengan ESC/POS (Epson TM series, Star, dll).
 */

// ─── Character encoding table ────────────────────────────────────────────

/** Code page 37: Latin 1 (Western Europe) — support €, accented chars */
const CODE_PAGE_LATIN1 = 0x25;

// ─── ESC/POS Constants ───────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// ─── Text Alignment ──────────────────────────────────────────────────────

export type Align = "left" | "center" | "right";

function alignCmd(a: Align): number[] {
  const map: Record<Align, number> = { left: 0, center: 1, right: 2 };
  return [ESC, 0x61, map[a]];
}

// ─── Font Size ───────────────────────────────────────────────────────────

export interface FontSize {
  width?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  height?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function sizeCmd(size: FontSize): number[] {
  const w = Math.min(7, Math.max(0, size.width ?? 0));
  const h = Math.min(7, Math.max(0, size.height ?? 0));
  const n = (w << 4) | h;
  return [GS, 0x21, n];
}

// ─── Bold ────────────────────────────────────────────────────────────────

function boldCmd(on: boolean): number[] {
  return [ESC, 0x45, on ? 1 : 0];
}

// ─── Underline ───────────────────────────────────────────────────────────

function underlineCmd(on: boolean): number[] {
  return [ESC, 0x2d, on ? 1 : 0];
}

// ─── Character Encoding ──────────────────────────────────────────────────

function codePageCmd(page: number): number[] {
  return [ESC, 0x74, page];
}

// ─── Line Feeds ──────────────────────────────────────────────────────────

function feed(lines: number = 1): number[] {
  return Array(lines).fill(LF);
}

// ─── Paper Cut ───────────────────────────────────────────────────────────

export type CutMode = "full" | "partial";

function cutCmd(mode: CutMode = "full"): number[] {
  // GS V m
  const m = mode === "full" ? 0 : 1;
  return [GS, 0x56, m];
}

// ─── Barcode ─────────────────────────────────────────────────────────────

export type BarcodeType =
  | "UPC-A"
  | "UPC-E"
  | "EAN13"
  | "EAN8"
  | "CODE39"
  | "ITF"
  | "CODABAR"
  | "CODE93"
  | "CODE128";

const BARCODE_TYPE_MAP: Record<BarcodeType, number> = {
  "UPC-A": 0,
  "UPC-E": 1,
  "EAN13": 2,
  "EAN8": 3,
  "CODE39": 4,
  "ITF": 5,
  "CODABAR": 6,
  "CODE93": 72,
  "CODE128": 73,
};

function barcodeCmd(
  type: BarcodeType,
  data: string,
  hri: "none" | "above" | "below" | "both" = "below",
  height: number = 50,
  width: number = 2,
): number[] {
  const hriMap: Record<string, number> = { none: 0, above: 1, below: 2, both: 3 };
  const result: number[] = [];

  // Set barcode height
  result.push(GS, 0x68, Math.min(255, Math.max(1, height)));
  // Set barcode width (2-6)
  result.push(GS, 0x77, Math.min(6, Math.max(2, width)));
  // Set HRI position
  result.push(GS, 0x48, hriMap[hri] ?? 2);
  // Print barcode
  const typeCode = BARCODE_TYPE_MAP[type] ?? 73; // default CODE128
  result.push(GS, 0x6b, typeCode);
  // Data length + data bytes
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  result.push(encoded.length);
  result.push(...Array.from(encoded));
  // NUL terminator
  result.push(0x00);

  return result;
}

// ─── QR Code ─────────────────────────────────────────────────────────────

function qrCodeCmd(data: string, size: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 4): number[] {
  const result: number[] = [];
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const len = encoded.length;
  const pL = len & 0xff;
  const pH = (len >> 8) & 0xff;

  // Set QR code model
  result.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
  // Set QR code size
  result.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, Math.min(8, Math.max(1, size)));
  // Store QR code data
  result.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
  result.push(...Array.from(encoded));
  // Print QR code
  result.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

  return result;
}

// ─── Text Encoding ───────────────────────────────────────────────────────

function textBytes(text: string, maxLen?: number): number[] {
  const encoder = new TextEncoder();
  let encoded = Array.from(encoder.encode(text));
  if (maxLen && encoded.length > maxLen) {
    encoded = encoded.slice(0, maxLen);
  }
  return encoded;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUBLIC API: Build complete receipt bytes
// ═══════════════════════════════════════════════════════════════════════════

export interface EscposReceiptLine {
  text: string;
  align?: Align;
  bold?: boolean;
  size?: FontSize;
  underline?: boolean;
}

export interface EscposReceiptConfig {
  lines: EscposReceiptLine[];
  qrData?: string;          // Optional QR code at bottom (e.g. payment link)
  barcode?: {               // Optional barcode (e.g. invoice number)
    type: BarcodeType;
    data: string;
  };
  cut?: CutMode;            // Paper cut mode (default: full)
  charset?: number;         // Code page
  lineSpacing?: number;     // Default line spacing
}

/**
 * Build a complete ESC/POS byte array from receipt configuration.
 */
export function buildEscposReceipt(config: EscposReceiptConfig): Uint8Array {
  const bytes: number[] = [];

  // ── Init printer ────────────────────────────────────────────
  bytes.push(ESC, 0x40);              // ESC @ — initialize printer
  bytes.push(...codePageCmd(config.charset ?? CODE_PAGE_LATIN1));
  if (config.lineSpacing !== undefined) {
    bytes.push(ESC, 0x32);            // ESC 2 — default line spacing
  }

  // ── Receipt lines ───────────────────────────────────────────
  for (const line of config.lines) {
    if (line.align) bytes.push(...alignCmd(line.align));
    if (line.bold) bytes.push(...boldCmd(true));
    if (line.underline) bytes.push(...underlineCmd(true));
    if (line.size) bytes.push(...sizeCmd(line.size));

    bytes.push(...textBytes(line.text));
    bytes.push(LF);

    // Reset formatting
    if (line.bold) bytes.push(...boldCmd(false));
    if (line.underline) bytes.push(...underlineCmd(false));
    if (line.size) bytes.push(...sizeCmd({}));
  }

  // ── Barcode (if any) ────────────────────────────────────────
  if (config.barcode) {
    bytes.push(...barcodeCmd(config.barcode.type, config.barcode.data));
    bytes.push(LF);
  }

  // ── QR Code (if any) ────────────────────────────────────────
  if (config.qrData) {
    bytes.push(...qrCodeCmd(config.qrData));
    bytes.push(LF);
  }

  // ── Feed + Cut ──────────────────────────────────────────────
  bytes.push(...feed(4));
  bytes.push(...cutCmd(config.cut ?? "full"));

  return new Uint8Array(bytes);
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONVENIENCE: Convert ThermalReceiptData to ESC/POS bytes
// ═══════════════════════════════════════════════════════════════════════════

import type { ThermalReceiptData } from "@/components/pos/thermal-receipt";

function fmtCurrency(num: number): string {
  return `Rp${num.toLocaleString("id-ID")}`;
}

function padRight(s: string, len: number): string {
  if (s.length >= len) return s.slice(0, len);
  return s + " ".repeat(len - s.length);
}

function padLeft(s: string, len: number): string {
  if (s.length >= len) return s.slice(0, len);
  return " ".repeat(len - s.length) + s;
}

const LINE_WIDTH = 42; // 80mm default

/**
 * Convert ThermalReceiptData to ESC/POS byte array for direct printing.
 */
export function buildEscposFromReceiptData(data: ThermalReceiptData): Uint8Array {
  const lines: EscposReceiptLine[] = [];

  function add(text: string, opts?: Partial<EscposReceiptLine>) {
    lines.push({ text, align: opts?.align, bold: opts?.bold, size: opts?.size, underline: opts?.underline });
  }

  function divider(char: string = "-") {
    add(char.repeat(LINE_WIDTH));
  }

  function doubleDivider() {
    add("=".repeat(LINE_WIDTH));
  }

  function empty() {
    add("");
  }

  // ── Header ─────────────────────────────────────────────────
  add(data.storeName, { align: "center", bold: true, size: { width: 1, height: 1 } });
  empty();
  if (data.storeAddress) add(data.storeAddress, { align: "center" });
  if (data.storePhone) add(data.storePhone, { align: "center" });
  if (data.storeEmail) add(data.storeEmail, { align: "center" });

  empty();
  doubleDivider();

  add("STRUK PENJUALAN", { align: "center", bold: true });
  empty();

  add(`No. Invoice: ${data.invoiceNumber}`);
  if (data.orderNumber) add(`No. Order: ${data.orderNumber}`);
  add(`Tanggal: ${data.date}`);
  add(`Jam: ${data.time}`);
  if (data.cashierName) add(`Kasir: ${data.cashierName}`);
  add(`Pelanggan: ${data.customerName || "Umum"}`);

  divider();

  // ── Items Header ────────────────────────────────────────────
  add(padRight("Produk", 20) + padRight("Qty", 5) + padLeft("Subtotal", 17), { bold: true });

  // ── Items ──────────────────────────────────────────────────
  for (const item of data.items) {
    const name = item.name.length > 18 ? item.name.slice(0, 16) + ".." : item.name;
    const qty = `${item.quantity}x`;
    const sub = fmtCurrency(item.subtotal);
    add(padRight(name, 18) + padRight(qty, 7) + padLeft(sub, 17));
    if (item.discountPercent) {
      add(`  diskon ${item.discountPercent}%`, { align: "right" });
    }
  }

  divider();

  // ── Totals ─────────────────────────────────────────────────
  const totalItems = data.items.reduce((s, i) => s + i.quantity, 0);
  add(padRight("Total Item", 20) + padLeft(`${totalItems} item`, 22));

  function row(label: string, value: string) {
    const valStr = value;
    add(padRight(label, 20) + padLeft(valStr, 22));
  }

  const subtotal = data.subtotal;
  row("Subtotal", fmtCurrency(subtotal));
  if (data.perItemDiscountTotal > 0) {
    row("Diskon Produk", `-${fmtCurrency(data.perItemDiscountTotal)}`);
  }
  if (data.transactionDiscountPercent > 0) {
    row(`Diskon Trans. (${data.transactionDiscountPercent}%)`, `-${fmtCurrency(data.transactionDiscountAmount)}`);
  }
  if (data.ppnAmount > 0) {
    row(`PPN ${data.ppnRate}%`, fmtCurrency(data.ppnAmount));
  }

  doubleDivider();
  add(fmtCurrency(data.grandTotal), { align: "center", bold: true, size: { width: 0, height: 0 } });

  divider();

  // ── Payment ────────────────────────────────────────────────
  if (data.paymentMethod === "split") {
    add("Metode Bayar: Split (Tunai + Transfer)");
    add(`  Tunai: ${fmtCurrency(data.cashAmount)}`);
    if (data.transferAmount) add(`  Transfer: ${fmtCurrency(data.transferAmount)}`);
    add("Total Bayar: " + fmtCurrency((data.cashAmount || 0) + (data.transferAmount || 0)));
  } else {
    const methodLabel =
      data.paymentMethod === "cash"
        ? "Tunai"
        : data.paymentMethod === "qris"
          ? "QRIS"
          : "Transfer";
    add(`Metode Bayar: ${methodLabel}`);
    if (data.cashAmount > 0) add(`Jumlah Bayar: ${fmtCurrency(data.cashAmount)}`);
  }
  if (data.changeAmount > 0) {
    add(`Kembalian: ${fmtCurrency(data.changeAmount)}`);
  } else if (data.changeAmount < 0) {
    add(`Kekurangan: ${fmtCurrency(Math.abs(data.changeAmount))}`);
  }

  empty();

  if (data.discountNote) {
    add(`Catatan Diskon: ${data.discountNote}`);
    empty();
  }

  doubleDivider();

  // ── Footer ─────────────────────────────────────────────────
  add("Terima kasih telah berbelanja!", { align: "center", bold: true });
  add("Barang yang sudah dibeli tidak dapat", { align: "center" });
  add("ditukar/dikembalikan", { align: "center" });
  empty();
  add(`${data.invoiceNumber} | ${data.date} ${data.time}`, { align: "center" });
  empty();
  add("Powered by MultiStore", { align: "center" });

  return buildEscposReceipt({ lines });
}
