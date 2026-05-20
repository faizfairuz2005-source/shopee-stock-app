"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  Store,
  FileText,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDate,
  formatDateLong,
  generateWhatsAppText,
} from "@/lib/utils/invoice-utils";
import type { InvoiceData } from "@/lib/types/invoice";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData;
}

// ─── Generate standalone print HTML ──────────────────────────────────────
function generatePrintHtml(invoice: InvoiceData): string {
  const itemsSubtotal = invoice.items.reduce((sum, i) => sum + i.subtotal, 0);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=820">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @page {
      margin: 12mm 8mm;
      size: A4 portrait;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }

    /* ─── Header Banner ─── */
    .invoice-header {
      background: linear-gradient(135deg, #1e40af, #2563eb);
      color: #fff;
      padding: 32px 40px;
      border-radius: 0;
    }

    .invoice-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .invoice-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .invoice-brand-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .invoice-brand-text h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #fff;
    }

    .invoice-brand-text p {
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      margin-top: 1px;
    }

    .invoice-store-info {
      margin-top: 12px;
    }

    .invoice-store-info p {
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
    }

    .invoice-title-section {
      text-align: right;
    }

    .invoice-title-section h2 {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #fff;
    }

    .invoice-number-badge {
      display: inline-block;
      background: rgba(255,255,255,0.12);
      padding: 4px 16px;
      border-radius: 8px;
      margin-top: 8px;
    }

    .invoice-number-badge code {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 13px;
      letter-spacing: 1px;
      color: #fff;
    }

    .invoice-date {
      margin-top: 8px;
      font-size: 13px;
      color: rgba(255,255,255,0.75);
    }

    .invoice-date .time {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
    }

    /* ─── Body ─── */
    .invoice-body {
      padding: 36px 40px;
    }

    /* ─── Info Grid ─── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }

    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
    }

    .info-card h3 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }

    .info-row .label {
      color: #64748b;
    }

    .info-row .value {
      font-weight: 500;
      color: #1e293b;
    }

    .info-row .value-mono {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 12px;
    }

    .customer-name {
      font-weight: 600;
      font-size: 14px;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .customer-detail {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    /* ─── Section Title ─── */
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .section-title h3 {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }

    .section-title .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 20px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 600;
    }

    /* ─── Table ─── */
    .table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 28px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    thead th.right {
      text-align: right;
    }

    thead th.center {
      text-align: center;
    }

    tbody tr {
      border-bottom: 1px solid #f1f5f9;
    }

    tbody tr:last-child {
      border-bottom: none;
    }

    tbody td {
      padding: 12px 16px;
      color: #1e293b;
    }

    tbody td.no {
      color: #94a3b8;
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 12px;
      width: 36px;
    }

    tbody td.name {
      font-weight: 500;
    }

    tbody td.sku code {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    tbody td.right {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    tbody td.center {
      text-align: center;
    }

    .qty-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      background: #f1f5f9;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }

    /* ─── Payment Summary ─── */
    .payment-summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }

    .payment-card {
      width: 340px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 22px 24px;
      background: #f8fafc;
    }

    .payment-card h3 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-bottom: 14px;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }

    .payment-row .label {
      color: #64748b;
    }

    .payment-row .amount {
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .payment-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 10px 0;
    }

    .payment-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
    }

    .payment-total .label {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .payment-total .amount {
      font-size: 20px;
      font-weight: 700;
      color: #1d4ed8;
      font-variant-numeric: tabular-nums;
    }

    /* ─── Notes ─── */
    .notes-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      background: #f8fafc;
      margin-bottom: 24px;
    }

    .notes-box h3 {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .notes-box p {
      font-size: 13px;
      color: #1e293b;
      line-height: 1.6;
      white-space: pre-line;
    }

    /* ─── Footer ─── */
    .invoice-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
    }

    .invoice-footer .brand {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .invoice-footer .thanks {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin-top: 6px;
    }

    .invoice-footer .policy {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .invoice-footer .ref {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 10px;
    }

    /* ─── Print Only ─── */
    @media print {
      body { margin: 0; padding: 0; background: #fff; }
      .invoice-container { box-shadow: none; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="invoice-header-top">
        <div>
          <div class="invoice-brand">
            <div class="invoice-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M6 6h4v4H6z"/><path d="M14 6h4v4h-4z"/><path d="M6 14h4v4H6z"/><path d="M14 14h4v4h-4z"/></svg>
            </div>
            <div class="invoice-brand-text">
              <h1>MultiStore</h1>
              <p>Solusi Manajemen Stok &amp; Penjualan</p>
            </div>
          </div>
          <div class="invoice-store-info">
            <p>${invoice.storeInfo.address.replace(/\n/g, '<br>')}</p>
            <p>${invoice.storeInfo.phone} &nbsp;|&nbsp; ${invoice.storeInfo.email}</p>
          </div>
        </div>
        <div class="invoice-title-section">
          <h2>INVOICE</h2>
          <div class="invoice-number-badge">
            <code>${invoice.invoiceNumber}</code>
          </div>
          <p class="invoice-date">
            ${formatDateLong(invoice.date)}
            ${invoice.time ? `<br><span class="time">${invoice.time}</span>` : ''}
          </p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-card">
          <h3>Referensi Pesanan</h3>
          ${invoice.orderNumber ? `<div class="info-row"><span class="label">No. Order</span><span class="value value-mono">${invoice.orderNumber}</span></div>` : ''}
          <div class="info-row"><span class="label">Tanggal</span><span class="value">${formatDate(invoice.date)}</span></div>
          ${invoice.storeName ? `<div class="info-row"><span class="label">Toko</span><span class="value">${invoice.storeName}</span></div>` : ''}
          ${invoice.sellerName ? `<div class="info-row"><span class="label">Penjual</span><span class="value">${invoice.sellerName}</span></div>` : ''}
        </div>
        <div class="info-card">
          <h3>Informasi Pelanggan</h3>
          <p class="customer-name">${invoice.customer.name}</p>
          ${invoice.customer.address ? `<p class="customer-detail">${invoice.customer.address}</p>` : ''}
          ${invoice.customer.phone ? `<p class="customer-detail">${invoice.customer.phone}</p>` : ''}
          ${invoice.customer.email ? `<p class="customer-detail">${invoice.customer.email}</p>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <div class="section-title">
        <h3>Daftar Produk</h3>
        <span class="badge">${invoice.items.length} item</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Produk</th>
              <th>SKU</th>
              <th class="right">Harga</th>
              <th class="center">Qty</th>
              <th class="right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
            <tr>
              <td class="no">${String(index + 1).padStart(2, '0')}</td>
              <td class="name">${item.name}</td>
              <td class="sku"><code>${item.sku}</code></td>
              <td class="right">${formatCurrency(item.price)}</td>
              <td class="center"><span class="qty-badge">${item.quantity}</span></td>
              <td class="right" style="font-weight:600">${formatCurrency(item.subtotal)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment Summary -->
      <div class="payment-summary">
        <div class="payment-card">
          <h3>Ringkasan Pembayaran</h3>
          <div class="payment-row">
            <span class="label">Subtotal (${invoice.items.length} item)</span>
            <span class="amount">${formatCurrency(itemsSubtotal)}</span>
          </div>
          ${invoice.payment.shipping !== undefined && invoice.payment.shipping > 0 ? `
          <div class="payment-row">
            <span class="label">Ongkos Kirim</span>
            <span class="amount">${formatCurrency(invoice.payment.shipping)}</span>
          </div>` : ''}
          ${invoice.payment.discount !== undefined && invoice.payment.discount > 0 ? `
          <div class="payment-row">
            <span class="label">Diskon</span>
            <span class="amount" style="color:#dc2626">-${formatCurrency(invoice.payment.discount)}</span>
          </div>` : ''}
          ${invoice.payment.tax !== undefined && invoice.payment.tax > 0 ? `
          <div class="payment-row">
            <span class="label">Pajak (11%)</span>
            <span class="amount">${formatCurrency(invoice.payment.tax)}</span>
          </div>` : ''}
          <hr class="payment-divider">
          <div class="payment-total">
            <span class="label">Total Pembayaran</span>
            <span class="amount">${formatCurrency(invoice.payment.total)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
      <div class="notes-box">
        <h3>Catatan</h3>
        <p>${invoice.notes}</p>
      </div>` : ''}

      <!-- Footer -->
      <div class="invoice-footer">
        <div class="brand">MultiStore</div>
        <p class="thanks">Terima kasih telah berbelanja!</p>
        <p class="policy">Barang yang sudah dibeli tidak dapat dikembalikan kecuali ada cacat produksi</p>
        <p class="ref">Invoice ini dibuat secara otomatis oleh sistem MultiStore &bull; ${invoice.invoiceNumber}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Subtotal before discounts
  const itemsSubtotal = useMemo(
    () => invoice.items.reduce((sum, i) => sum + i.subtotal, 0),
    [invoice.items]
  );

  // Handle print — opens standalone window
  const handlePrint = () => {
    setIsPrinting(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups for this site");
      setIsPrinting(false);
      return;
    }

    const html = generatePrintHtml(invoice);
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for fonts/styles, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }, 600);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }
    }, 1200);

    setIsPrinting(false);
  };

  // Handle download as PDF (same as print but user can save as PDF)
  const handleDownloadPDF = () => {
    handlePrint();
  };

  // Handle WhatsApp share
  const handleWhatsAppShare = () => {
    const whatsappText = generateWhatsAppText({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      total: invoice.payment.total,
      items: invoice.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    const phone = invoice.customer.phone || "";
    const whatsappUrl = `https://wa.me/${phone}?text=${whatsappText}`;
    window.open(whatsappUrl, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-8 sm:pt-12 animate-in fade-in duration-200 overflow-y-auto print:hidden">
      <div className="relative w-full max-w-[860px] my-auto rounded-2xl bg-card/90 shadow-2xl animate-in zoom-in-95 duration-200 print:shadow-none print:rounded-none print:bg-white print:my-0">
        {/* ─── Modal Header / Toolbar ─── */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-6 py-3.5 rounded-t-2xl no-print">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <Receipt className="h-4 w-4" />
              {invoice.invoiceNumber}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting}
              className="gap-2 hidden sm:inline-flex"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-2 hidden sm:inline-flex"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="gap-2 hidden sm:inline-flex"
            >
              <Share2 className="h-4 w-4" />
              WhatsApp
            </Button>
            {/* Mobile action buttons */}
            <div className="sm:hidden flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrint} disabled={isPrinting}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ─── Invoice Content ─── */}
        <div ref={printRef} className="p-5 sm:p-8 print:p-0">
          <div className="mx-auto max-w-[820px] overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border print:shadow-none print:ring-0 print:rounded-none">
            {/* Blue Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 sm:px-10 py-8 sm:py-10 text-white print:bg-[#1e40af] print:px-8 print:py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Store className="h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">MultiStore</h1>
                      <p className="text-sm text-blue-100">Solusi Manajemen Stok & Penjualan</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-blue-100 leading-relaxed max-w-md">
                    {invoice.storeInfo.address}
                  </p>
                  <p className="text-sm text-blue-100">
                    {invoice.storeInfo.phone} &nbsp;|&nbsp; {invoice.storeInfo.email}
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold tracking-wider">INVOICE</h2>
                  <div className="mt-2 inline-block rounded-lg bg-white/10 px-4 py-1.5">
                    <p className="text-sm font-mono tracking-wider">{invoice.invoiceNumber}</p>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">
                    {formatDateLong(invoice.date)}
                  </p>
                  {invoice.time && (
                    <p className="text-xs text-blue-200">{invoice.time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="px-8 sm:px-10 py-8 sm:py-10 print:px-8 print:py-6 space-y-8">
              {/* ─── Reference Section: Order & Seller ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-5 print:border-gray-300 print:bg-white">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 print:text-gray-500">
                    Referensi Pesanan
                  </h3>
                  <div className="space-y-2">
                    {invoice.orderNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground print:text-gray-500">No. Order</span>
                        <span className="text-sm font-mono font-medium text-foreground print:text-gray-900">
                          {invoice.orderNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground print:text-gray-500">Tanggal Pesanan</span>
                      <span className="text-sm font-medium text-foreground print:text-gray-900">
                        {formatDate(invoice.date)}
                      </span>
                    </div>
                    {invoice.storeName && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground print:text-gray-500">Toko</span>
                        <span className="text-sm font-medium text-foreground print:text-gray-900">
                          {invoice.storeName}
                        </span>
                      </div>
                    )}
                    {invoice.sellerName && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground print:text-gray-500">Penjual</span>
                        <span className="text-sm font-medium text-foreground print:text-gray-900">
                          {invoice.sellerName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 print:border-gray-300 print:bg-white">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 print:text-gray-500">
                    Informasi Pelanggan
                  </h3>
                  <p className="font-semibold text-foreground print:text-gray-900">{invoice.customer.name}</p>
                  {invoice.customer.address && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed print:text-gray-600">
                      {invoice.customer.address}
                    </p>
                  )}
                  {invoice.customer.phone && (
                    <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">{invoice.customer.phone}</p>
                  )}
                  {invoice.customer.email && (
                    <p className="mt-1 text-sm text-muted-foreground print:text-gray-600">{invoice.customer.email}</p>
                  )}
                </div>
              </div>

              {/* ─── Items Table ─── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-semibold text-foreground print:text-gray-900">
                    Daftar Produk
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary print:bg-gray-100 print:text-gray-700">
                    {invoice.items.length} item
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-border print:border-gray-300">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted print:bg-gray-50">
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          No.
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          Produk
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          SKU
                        </th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          Harga
                        </th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          Qty
                        </th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border print:divide-gray-200">
                      {invoice.items.map((item, index) => (
                        <tr key={item.id} className="bg-card print:bg-white">
                          <td className="px-4 py-4 text-sm text-muted-foreground/70 font-mono print:text-gray-400">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-foreground print:text-gray-900">{item.name}</p>
                          </td>
                          <td className="px-4 py-4">
                            <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded print:bg-gray-100 print:text-gray-600">
                              {item.sku}
                            </code>
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-foreground/90 tabular-nums print:text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-md bg-muted px-2 text-sm font-medium text-foreground print:bg-white print:border print:border-gray-300 print:text-gray-900">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-semibold text-foreground tabular-nums print:text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── Payment Summary ─── */}
              <div className="flex justify-end">
                <div className="w-full sm:w-80 rounded-xl border border-border bg-muted/50 p-6 print:border-gray-300 print:bg-gray-50 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-500">
                    Ringkasan Pembayaran
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground print:text-gray-500">
                      Subtotal ({invoice.items.length} item)
                    </span>
                    <span className="font-medium text-foreground tabular-nums print:text-gray-900">
                      {formatCurrency(itemsSubtotal)}
                    </span>
                  </div>
                  {invoice.payment.shipping !== undefined &&
                    invoice.payment.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground print:text-gray-500">
                          Ongkos Kirim
                        </span>
                        <span className="font-medium text-foreground tabular-nums print:text-gray-900">
                          {formatCurrency(invoice.payment.shipping)}
                        </span>
                      </div>
                    )}
                  {invoice.payment.discount !== undefined &&
                    invoice.payment.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground print:text-gray-500">Diskon</span>
                        <span className="font-medium text-red-500 tabular-nums print:text-red-600">
                          -{formatCurrency(invoice.payment.discount)}
                        </span>
                      </div>
                    )}
                  {invoice.payment.tax !== undefined &&
                    invoice.payment.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground print:text-gray-500">Pajak (11%)</span>
                        <span className="font-medium text-foreground tabular-nums print:text-gray-900">
                          {formatCurrency(invoice.payment.tax)}
                        </span>
                      </div>
                    )}
                  <div className="border-t border-border pt-3 mt-3 print:border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-foreground print:text-gray-900">
                        Total Pembayaran
                      </span>
                      <span className="text-xl font-bold text-primary tabular-nums print:text-blue-700">
                        {formatCurrency(invoice.payment.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Notes ─── */}
              {invoice.notes && (
                <div className="rounded-xl border border-border bg-muted/50 p-5 print:border-gray-300 print:bg-gray-50">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 print:text-gray-500">
                    Catatan
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line print:text-gray-800">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {/* ─── Footer ─── */}
              <div className="border-t border-border pt-6 text-center print:border-gray-300">
                <span className="text-sm font-semibold text-foreground print:text-gray-900">MultiStore</span>
                <p className="mt-2 text-sm font-medium text-foreground print:text-gray-800">
                  Terima kasih telah berbelanja!
                </p>
                <p className="mt-1 text-xs text-muted-foreground print:text-gray-500">
                  Barang yang sudah dibeli tidak dapat dikembalikan kecuali ada cacat produksi
                </p>
                <p className="mt-3 text-xs text-muted-foreground/70 print:text-gray-400">
                  Invoice ini dibuat secara otomatis oleh sistem MultiStore &bull; {invoice.invoiceNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
