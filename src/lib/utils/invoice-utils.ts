import { format } from "date-fns";

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMM-XXXX (e.g., INV-202604-0001)
 */
export function generateInvoiceNumber(orderId: string | number): string {
  const now = new Date();
  const datePart = format(now, "yyyyMM");
  
  // Use order ID to create a sequential number (4 digits)
  const sequence = typeof orderId === "string" 
    ? orderId.padStart(4, "0") 
    : orderId.toString().padStart(4, "0");
  
  return `INV-${datePart}-${sequence}`;
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian format
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMMM yyyy");
}

/**
 * Format date with day name
 */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE, dd MMMM yyyy");
}

/**
 * Format date short (dd/MM/yyyy)
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy");
}

/**
 * Format time to HH:mm:ss
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm:ss");
}

/**
 * Generate WhatsApp share text for invoice
 */
export function generateWhatsAppText(invoice: {
  invoiceNumber: string;
  customerName: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}): string {
  let text = `*INVOICE ${invoice.invoiceNumber}*\n\n`;
  text += `*Pelanggan:* ${invoice.customerName}\n`;
  text += `*Tanggal:* ${formatDate(new Date())}\n\n`;
  text += `*Detail Pesanan:*\n`;
  
  invoice.items.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n`;
    text += `   ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.quantity * item.price)}\n`;
  });
  
  text += `\n*Total: ${formatCurrency(invoice.total)}*\n\n`;
  text += `Terima kasih telah berbelanja!`;
  
  return encodeURIComponent(text);
}
