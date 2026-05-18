/**
 * Invoice types and interfaces
 */

export interface InvoiceCustomer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  id: string | number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface InvoicePayment {
  subtotal: number;
  shipping?: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time?: string;
  orderNumber?: string;
  sellerName?: string;
  storeName?: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  payment: InvoicePayment;
  storeInfo: StoreInfo;
  notes?: string;
}

export interface StoreInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}
