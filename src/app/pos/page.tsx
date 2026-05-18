"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
  Percent,
  Package,
  ScanLine,
  CreditCard,
  Banknote,
  CheckCircle2,
  Printer,
  Clock,
  RotateCcw,
  Receipt,
  Store,
  Users,
  History,
  ChevronDown,
  GripVertical,
  AlertCircle,
  Circle,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { InvoiceData } from "@/lib/types/invoice";
import { formatCurrency, formatDate, formatTime, generateInvoiceNumber } from "@/lib/utils/invoice-utils";
import { InvoiceModal } from "@/components/invoice/invoice-modal";
import { PaymentModal } from "./payment-modal";
import { savePosTransaction } from "@/app/actions";
import type { ProductCategory } from "@/app/actions";
import { getCustomersForPos } from "@/app/pelanggan/actions";

// ─── Types ────────────────────────────────────────────────────────────────

interface Product {
  sku: string;
  name: string;
  price: number;
  hpp: number;
  totalStock: number;
  description: string;
  connectedStores: number;
  sales: number;
  kategori?: string;
}

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  discountPercent?: number;
}

interface HeldBill {
  id: string;
  createdAt: string;
  customerName: string;
  items: CartItem[];
  transactionDiscount: number;
  grandTotal: number;
  itemCount: number;
  usePPN: boolean;
}

// ─── Load data ────────────────────────────────────────────────────────────

import dataJson from "../../../data.json";
const inventoryProducts: Product[] = (
  dataJson as { inventoryProducts: Product[] }
).inventoryProducts ?? [];
const rawCategories: ProductCategory[] = (
  dataJson as { categories?: ProductCategory[] }
).categories ?? [];

// ─── Constants ────────────────────────────────────────────────────────────

const PPN_RATE = 11; // Pajak Pertambahan Nilai 11%

interface PosCustomer {
  id: string;
  nama_lengkap: string;
  nomor_hp: string;
  total_transaksi: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function itemSubtotal(item: CartItem): number {
  const disc = (item.discountPercent ?? 0) / 100;
  return Math.round(item.price * item.quantity * (1 - disc));
}

function itemDiscountAmount(item: CartItem): number {
  return Math.round(item.price * item.quantity * ((item.discountPercent ?? 0) / 100));
}

function generateBillId(): string {
  return `HOLD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCT CARD - Extracted for cleaner virtual scrolling preparation
// ═══════════════════════════════════════════════════════════════════════════

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (p: Product) => void;
}) {
  const isOutOfStock = product.totalStock === 0;
  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-4 text-left",
        "transition-all duration-200 ease-out",
        "hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        "active:scale-[0.97] active:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        isOutOfStock
          ? "cursor-not-allowed opacity-45 border-dashed border-muted-foreground/20"
          : "cursor-pointer border-border/60 shadow-sm hover:bg-accent/30",
        isLowStock && !isOutOfStock && "border-amber-200/50 dark:border-amber-800/30",
      )}
    >
      {/* Quick-add floating button */}
      {!isOutOfStock && (
        <div
          className={cn(
            "absolute -top-1.5 -right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
            "opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
        </div>
      )}

      {/* Product icon + stock badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            isOutOfStock
              ? "bg-muted"
              : "bg-gradient-to-br from-primary/10 to-primary/5",
          )}
        >
          <Package
            className={cn(
              "h-5 w-5",
              isOutOfStock ? "text-muted-foreground/40" : "text-primary/70",
            )}
          />
        </div>
        <div className="flex items-center gap-1">
          {isOutOfStock ? (
            <Badge
              variant="destructive"
              className="px-2 py-0.5 text-[9px] font-semibold rounded-full"
            >
              <X className="h-2.5 w-2.5 mr-0.5 inline" />
              Habis
            </Badge>
          ) : isLowStock ? (
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[9px] font-semibold rounded-full border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
            >
              <Circle className="h-2 w-2 mr-1 inline fill-amber-400 text-amber-400" />
              {product.totalStock}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              stok {product.totalStock}
            </span>
          )}
        </div>
      </div>

      {/* Product Name */}
      <p className="mb-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground min-h-[2.5rem]">
        {product.name}
      </p>

      {/* SKU */}
      <p className="mb-2 text-[10px] text-muted-foreground/40 font-mono tracking-tight">
        {product.sku}
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Price */}
      <div className="flex items-baseline gap-1 pt-2 border-t border-border/40">
        <span className="text-sm font-bold text-primary tabular-nums tracking-tight">
          {formatCurrency(product.price)}
        </span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PosPage() {
  // ─── State ──────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [kategoriFilter, setKategoriFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("Umum");
  const [transactionDiscount, setTransactionDiscount] = useState(0);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [lastTransaction, setLastTransaction] = useState<InvoiceData | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [addedToast, setAddedToast] = useState<{ sku: string; name: string }[]>([]);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [usePPN, setUsePPN] = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const customerBtnRef = useRef<HTMLDivElement>(null);
  const [customerPickerPos, setCustomerPickerPos] = useState({ top: 0, right: 0 });
  const [dbCustomers, setDbCustomers] = useState<PosCustomer[]>([]);

  // ─── Fetch customers from database ───────────────────────────
  useEffect(() => {
    getCustomersForPos().then((result) => {
      if (result.success) {
        setDbCustomers(result.customers);
      }
    });
  }, []);

  // ─── Load held bills from localStorage ─────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pos-held-bills");
      if (stored) {
        setHeldBills(JSON.parse(stored));
      }
    } catch { /* noop */ }
  }, []);

  const saveHeldBills = useCallback((bills: HeldBill[]) => {
    try {
      localStorage.setItem("pos-held-bills", JSON.stringify(bills));
    } catch { /* noop */ }
  }, []);

  // ─── Unique categories from products ────────────────────────────
  const uniqueProductCategories = useMemo(() => {
    const cats = new Set<string>();
    inventoryProducts.forEach(p => { if (p.kategori) cats.add(p.kategori); });
    return Array.from(cats).sort();
  }, []);

  // ─── Filtered Products ──────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = inventoryProducts;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }
    if (kategoriFilter) {
      result = result.filter(p => p.kategori === kategoriFilter);
    }
    return result;
  }, [search, kategoriFilter]);

  // ─── Cart Totals ────────────────────────────────────────────────
  const totalItems = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );

  const perItemDiscountTotal = useMemo(
    () => cart.reduce((sum, i) => sum + itemDiscountAmount(i), 0),
    [cart],
  );

  const subtotalAfterItemDiscount = subtotal - perItemDiscountTotal;

  const transactionDiscountAmount = useMemo(
    () => Math.round(subtotalAfterItemDiscount * (transactionDiscount / 100)),
    [subtotalAfterItemDiscount, transactionDiscount],
  );

  const dpp = subtotalAfterItemDiscount - transactionDiscountAmount;

  const ppnAmount = useMemo(
    () => (usePPN ? Math.round(dpp * (PPN_RATE / 100)) : 0),
    [dpp, usePPN],
  );

  const grandTotal = dpp + ppnAmount;

  // ─── Cart Actions ───────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      return existing
        ? prev.map((i) =>
            i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [
            ...prev,
            {
              sku: product.sku,
              name: product.name,
              price: product.price,
              quantity: 1,
            },
          ];
    });

    setAddedToast((prev) =>
      [{ sku: product.sku, name: product.name }, ...prev].slice(0, 3),
    );
    setTimeout(() => {
      setAddedToast((prev) => prev.filter((i) => i.sku !== product.sku));
    }, 2400);
  }, []);

  const updateQuantity = useCallback((sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.sku === sku
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((sku: string) => {
    setCart((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const handleItemDiscount = useCallback(
    (sku: string, percent: number) => {
      setCart((prev) =>
        prev.map((i) =>
          i.sku === sku
            ? { ...i, discountPercent: percent > 0 ? percent : undefined }
            : i,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setTransactionDiscount(0);
    setUsePPN(true);
  }, []);

  // ─── Hold Bill ──────────────────────────────────────────────────
  const handleHoldBill = useCallback(() => {
    if (cart.length === 0) return;
    const bill: HeldBill = {
      id: generateBillId(),
      createdAt: new Date().toISOString(),
      customerName: selectedCustomer,
      items: [...cart],
      transactionDiscount,
      grandTotal,
      itemCount: totalItems,
      usePPN,
    };
    const updated = [bill, ...heldBills].slice(0, 20);
    setHeldBills(updated);
    saveHeldBills(updated);
    clearCart();
    setShowHeldBills(true);
  }, [cart, selectedCustomer, transactionDiscount, grandTotal, totalItems, heldBills, saveHeldBills, clearCart]);

  const handleRestoreBill = useCallback((bill: HeldBill) => {
    setCart(bill.items);
    setTransactionDiscount(bill.transactionDiscount);
    setSelectedCustomer(bill.customerName);
    setUsePPN(bill.usePPN);
    const updated = heldBills.filter((b) => b.id !== bill.id);
    setHeldBills(updated);
    saveHeldBills(updated);
    setShowHeldBills(false);
  }, [heldBills, saveHeldBills]);

  const handleDeleteHeldBill = useCallback((billId: string) => {
    const updated = heldBills.filter((b) => b.id !== billId);
    setHeldBills(updated);
    saveHeldBills(updated);
  }, [heldBills, saveHeldBills]);

  // ─── Payment & Transaction ──────────────────────────────────────
  const handlePaymentConfirm = useCallback(
    async (data: {
      paymentMethod: "cash" | "qris" | "transfer" | "split";
      cashAmount: number;
      changeAmount: number;
    }) => {
      setIsProcessingPayment(true);
      try {
        const result = await savePosTransaction({
          customer_name: selectedCustomer,
          payment_method: data.paymentMethod,
          items: cart.map((item) => ({
            sku: item.sku,
            nama_produk: item.name,
            harga: item.price,
            quantity: item.quantity,
            discount_percent: item.discountPercent ?? 0,
            subtotal: itemSubtotal(item),
          })),
          subtotal,
          per_item_discount_total: perItemDiscountTotal,
          transaction_discount_percent: transactionDiscount,
          transaction_discount_amount: transactionDiscountAmount,
          ppn_amount: ppnAmount,
          ppn_rate: usePPN ? PPN_RATE : 0,
          grand_total: grandTotal,
          cash_amount: data.cashAmount,
          change_amount: data.changeAmount,
        });

        if (result.success) {
          const txn = result.transaction!;
          const invoice: InvoiceData = {
            invoiceNumber: generateInvoiceNumber(txn.id),
            date: new Date().toISOString(),
            time: formatTime(new Date()),
            orderNumber: txn.nomor_order,
            sellerName: txn.seller_name,
            storeName: txn.nama_toko_shopee,
            customer: {
              name: selectedCustomer,
            },
            items: cart.map((item, idx) => ({
              id: idx + 1,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              subtotal: itemSubtotal(item),
            })),
            payment: {
              subtotal,
              discount: perItemDiscountTotal + transactionDiscountAmount,
              tax: ppnAmount,
              total: grandTotal,
            },
            storeInfo: {
              name: "MultiStock",
              address: "Jl. Raya Utama No. 123",
              phone: "021-12345678",
              email: "info@multistock.com",
            },
          };
          setLastTransaction(invoice);
          setShowPayment(false);
          setShowSuccess(true);
        } else {
          alert(result.error || "Gagal menyimpan transaksi");
        }
      } catch (err) {
        alert("Terjadi kesalahan saat memproses pembayaran");
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [cart, selectedCustomer, subtotal, perItemDiscountTotal, transactionDiscount, transactionDiscountAmount, grandTotal],
  );

  const handleNewTransaction = useCallback(() => {
    clearCart();
    setShowSuccess(false);
    setLastTransaction(null);
    setSearch("");
    setSelectedCustomer("Umum");
    // Refocus search
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [clearCart]);

  // ─── Barcode handler ────────────────────────────────────────────
  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeValue.trim().toUpperCase();
    if (!code) return;

    const product = inventoryProducts.find(
      (p) => p.sku.toUpperCase() === code || p.name.toUpperCase() === code,
    );
    if (product && product.totalStock > 0) {
      addToCart(product);
      setBarcodeValue("");
      setAddedToast((prev) =>
        [{ sku: product.sku, name: `📦 ${product.name}` }, ...prev].slice(0, 3),
      );
      setTimeout(() => {
        setAddedToast((prev) => prev.filter((i) => i.sku !== product.sku));
      }, 2400);
    } else {
      setAddedToast((prev) =>
        [{ sku: "not-found", name: `"${code}" tidak ditemukan` }, ...prev].slice(0, 3),
      );
      setTimeout(() => {
        setAddedToast((prev) => prev.filter((i) => i.sku !== "not-found"));
      }, 2400);
      setBarcodeValue("");
    }
  }, [barcodeValue, addToCart]);

  // ─── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPayment(false);
        setShowCustomerPicker(false);
        setShowHeldBills(false);
        setShowBarcodeInput(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setShowBarcodeInput((prev) => !prev);
        if (!showBarcodeInput) {
          setTimeout(() => barcodeRef.current?.focus(), 100);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showBarcodeInput]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // ════════════════════════════════════════════════════════════════════════
  //  SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════

  if (showSuccess && lastTransaction) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-background dark:via-background dark:to-primary/5">
        <div className="mx-auto max-w-md text-center px-6">
          {/* Success animation */}
          <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
            {/* Inner circle */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>

          <h2 className="mb-1 text-2xl font-bold text-foreground tracking-tight">
            Pembayaran Berhasil!
          </h2>
          <p className="text-sm text-muted-foreground mb-2 font-mono">
            {lastTransaction.orderNumber}
          </p>

          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Total Dibayar</p>
            <p className="text-4xl font-bold text-primary tracking-tight">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="gap-2 h-12 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
              onClick={handleNewTransaction}
            >
              <RotateCcw className="h-5 w-5" />
              Transaksi Baru
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 h-12 px-6 rounded-xl"
              onClick={() => setShowInvoice(true)}
            >
              <Receipt className="h-5 w-5" />
              Lihat Invoice
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="gap-2 h-12 px-6 rounded-xl"
              onClick={() => setShowInvoice(true)}
            >
              <Printer className="h-5 w-5" />
              Cetak Struk
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground/60">
            Transaksi dicatat pada {formatDate(new Date())} pukul {formatTime(new Date())}
          </p>
        </div>

        {showInvoice && lastTransaction && (
          <InvoiceModal
            isOpen={showInvoice}
            onClose={() => setShowInvoice(false)}
            invoice={lastTransaction}
          />
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  //  MAIN LAYOUT
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden bg-gradient-to-br from-sky-50/30 via-background to-indigo-50/20 dark:from-background dark:via-background dark:to-primary/[0.02]">
      {/* ─── Toast Notifications ─────────────────────────────────── */}
      <div className="pointer-events-none fixed top-20 right-6 z-50 flex flex-col items-end gap-2">
        {addedToast.map((item) => (
          <div
            key={item.sku + item.name}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
              "animate-in slide-in-from-right fade-in zoom-in-95 duration-200",
              item.sku === "not-found"
                ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/60 dark:text-red-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
            )}
          >
            {item.sku === "not-found" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                <Plus className="h-3 w-3" />
              </div>
            )}
            {item.name}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  TOP BAR                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-30 flex items-center gap-2 border-b border-border/60 bg-card/95 backdrop-blur-sm px-4 py-2.5 shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/20">
            <Store className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-foreground tracking-tight">
              POS
            </span>
            <span className="text-[10px] text-muted-foreground/60 ml-1.5 font-medium">
              MultiStock
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border/60 mr-1" />

        {/* Search */}
        <div className="relative flex-1 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU...  "
            className={cn(
              "h-9 pl-9 pr-8 text-sm rounded-xl",
              "border-muted-foreground/20 bg-muted/30",
              "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10",
              "placeholder:text-muted-foreground/40",
            )}
            autoComplete="off"
          />
          {/* Keyboard shortcut badge */}
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60 shadow-sm">
            ⌘K
          </kbd>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground sm:hidden"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Barcode Toggle */}
          <Button
            variant={showBarcodeInput ? "default" : "ghost"}
            size="sm"
            className={cn(
              "gap-1.5 h-9 rounded-xl",
              showBarcodeInput
                ? "shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => {
              setShowBarcodeInput(!showBarcodeInput);
              if (!showBarcodeInput) {
                setTimeout(() => barcodeRef.current?.focus(), 100);
              }
            }}
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden md:inline text-xs">Scan</span>
            <kbd className="hidden lg:inline-flex items-center rounded-md border border-border/50 bg-muted/80 px-1 py-0.5 text-[9px] font-mono text-muted-foreground/60">
              ⌘B
            </kbd>
          </Button>

          {/* Customer Selector */}
          <div ref={customerBtnRef}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 h-9 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (!showCustomerPicker) {
                  const el = customerBtnRef.current;
                  if (el) {
                    const rect = el.getBoundingClientRect();
                    setCustomerPickerPos({
                      top: rect.bottom + 4,
                      right: window.innerWidth - rect.right,
                    });
                  }
                }
                setShowCustomerPicker((prev) => !prev);
              }}
            >
              <Users className="h-4 w-4" />
              <span className="hidden md:inline text-xs max-w-[80px] truncate">
                {selectedCustomer}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
            </Button>
            {showCustomerPicker && (
              <>
                {/* Transparent overlay for click-outside */}
                <div className="fixed inset-0 z-[99]" onClick={() => setShowCustomerPicker(false)} />
                {/* Dropdown positioned right below the button */}
                <div
                  className="fixed z-[100] w-64 rounded-2xl border border-border/60 bg-popover p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{ top: customerPickerPos.top, right: customerPickerPos.right }}
                >
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-semibold text-foreground">
                      Pilih Pelanggan
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {/* Always show "Umum" first */}
                    <button
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        "Umum" === selectedCustomer
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-popover-foreground hover:bg-accent",
                      )}
                      onClick={() => {
                        setSelectedCustomer("Umum");
                        setShowCustomerPicker(false);
                      }}
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-lg",
                          "Umum" === selectedCustomer
                            ? "bg-primary-foreground/20"
                            : "bg-muted",
                        )}
                      >
                        <Users className="h-3 w-3" />
                      </div>
                      Umum
                    </button>

                    {/* Divider when there are DB customers */}
                    {dbCustomers.length > 0 && (
                      <div className="my-1 border-t border-border/30" />
                    )}

                    {/* Customers from database */}
                    {dbCustomers.map((c) => (
                      <button
                        key={c.id}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                          c.nama_lengkap === selectedCustomer
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-popover-foreground hover:bg-accent",
                        )}
                        onClick={() => {
                          setSelectedCustomer(c.nama_lengkap);
                          setShowCustomerPicker(false);
                        }}
                      >
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg",
                            c.nama_lengkap === selectedCustomer
                              ? "bg-primary-foreground/20"
                              : "bg-muted",
                          )}
                        >
                          <Users className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{c.nama_lengkap}</p>
                          <p className="text-[10px] text-left opacity-60 truncate">{c.nomor_hp}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Held Bills */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 h-9 rounded-xl",
                heldBills.length > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setShowHeldBills(!showHeldBills)}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden md:inline text-xs">Hold</span>
              {heldBills.length > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {heldBills.length}
                </span>
              )}
            </Button>
            {showHeldBills && (
              <>
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowHeldBills(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 rounded-2xl border border-border/60 bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-semibold text-foreground">
                        Pesanan Ditahan
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {heldBills.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {heldBills.length} pesanan
                        </span>
                      )}
                      <button
                        className="text-muted-foreground/40 hover:text-foreground transition-colors"
                        onClick={() => setShowHeldBills(false)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {heldBills.length === 0 ? (
                      <div className="p-8 text-center">
                        <History className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Belum ada pesanan ditahan
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1">
                          Gunakan tombol Hold untuk menyimpan pesanan sementara
                        </p>
                      </div>
                    ) : (
                      heldBills.map((bill) => (
                        <div
                          key={bill.id}
                          className="flex items-center gap-3 p-3.5 border-b border-border/30 hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 shrink-0">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {bill.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {bill.itemCount} item &bull; {formatCurrency(bill.grandTotal)}
                            </p>
                            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                              {formatDate(bill.createdAt)} {formatTime(bill.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 text-xs rounded-lg shadow-sm"
                              onClick={() => handleRestoreBill(bill)}
                            >
                              Pulihkan
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleDeleteHeldBill(bill.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  BARCODE INPUT BAR                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showBarcodeInput && (
        <form
          onSubmit={handleBarcodeSubmit}
          className="flex items-center gap-3 border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/[0.02] px-4 py-2.5 animate-in slide-in-from-top-1 duration-150"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ScanLine className="h-4 w-4 text-primary" />
          </div>
          <input
            ref={barcodeRef}
            type="text"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
            placeholder="Scan barcode... (ketik SKU atau nama produk lalu Enter)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
            autoComplete="off"
          />
          {barcodeValue && (
            <button
              type="button"
              onClick={() => setBarcodeValue("")}
              className="text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button type="submit" size="sm" className="h-8 px-4 rounded-lg text-xs gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Cari
          </Button>
          <button
            type="button"
            onClick={() => setShowBarcodeInput(false)}
            className="text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            Tutup
            <kbd className="ml-1 rounded border border-border/50 bg-background/80 px-1 py-0.5 text-[9px] font-mono">
              Esc
            </kbd>
          </button>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  MAIN LAYOUT — Produk (kiri) | Keranjang + Ringkasan (kanan) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══ LEFT PANEL: Product Grid ═══ */}
        <main className="flex flex-1 flex-col overflow-hidden bg-gradient-to-r from-background to-muted/20">
          {/* Category Filter Bar */}
          {uniqueProductCategories.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 shrink-0 bg-card/60 border-b border-border/30 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-medium text-muted-foreground/60 mr-1 shrink-0">Kategori:</span>
              <Badge
                variant={!kategoriFilter ? "default" : "outline"}
                className="cursor-pointer px-2.5 py-1 text-[10px] font-medium shrink-0"
                onClick={() => setKategoriFilter(null)}
              >
                Semua
              </Badge>
              {uniqueProductCategories.map((cat) => {
                const catColor = rawCategories.find(c => c.name === cat)?.color || '#6B7280';
                const isActive = kategoriFilter === cat;
                return (
                  <Badge
                    key={cat}
                    variant={isActive ? "default" : "outline"}
                    className="cursor-pointer px-2.5 py-1 text-[10px] font-medium shrink-0"
                    style={isActive ? { backgroundColor: catColor, borderColor: catColor, color: '#fff' } : { borderColor: `${catColor}40`, color: catColor }}
                    onClick={() => setKategoriFilter(kategoriFilter === cat ? null : cat)}
                  >
                    <span className="mr-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                    {cat}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Grid Header */}
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0 bg-card/40">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/80">
                <strong className="text-foreground font-semibold">
                  {filteredProducts.length}
                </strong>{" "}
                produk
                {search && (
                  <>
                    {" "}
                    untuk "<span className="text-foreground font-medium">{search}</span>"
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Stock summary */}
              {!search && (
                <span className="text-[10px] text-muted-foreground/40">
                  {inventoryProducts.filter((p) => p.totalStock <= 5 && p.totalStock > 0).length} stok menipis
                </span>
              )}
              {search && (
                <button
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  onClick={() => setSearch("")}
                >
                  Reset filter
                </button>
              )}
            </div>
          </div>

          {/* Product Cards */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Package className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-base font-semibold text-muted-foreground">
                  {search ? "Produk tidak ditemukan" : "Tidak ada produk"}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">
                  {search
                    ? `Tidak ada hasil untuk "${search}". Coba kata kunci lain.`
                    : "Belum ada produk tersedia untuk dijual."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.sku}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ═══ RIGHT SIDEBAR: Cart + Summary ═══ */}
        <aside className="relative z-20 flex w-[22rem] shrink-0 flex-col border-l-2 border-border/40 bg-card shadow-[-4px_0_12px_-6px_rgba(0,0,0,0.08)]">
          {/* ═══ CART ═══ */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b-2 border-border/40 bg-gradient-to-r from-primary/[0.02] to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">
                    Keranjang
                  </span>
                  {cart.length > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({totalItems} item)
                    </span>
                  )}
                </div>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                  onClick={clearCart}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Kosongkan
                </Button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Keranjang kosong
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/50 max-w-[12rem] leading-relaxed">
                    Pilih produk dari daftar di samping atau scan barcode untuk memulai transaksi
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const discAmt = itemDiscountAmount(item);
                  const afterDisc = itemSubtotal(item);
                  return (
                    <div
                      key={item.sku}
                      className="group/cart rounded-2xl border border-border/50 bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate leading-snug">
                              {item.name}
                            </p>
                            <button
                              className="shrink-0 opacity-0 group-hover/cart:opacity-100 transition-opacity text-muted-foreground/40 hover:text-red-400"
                              onClick={() => removeItem(item.sku)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">
                            @ {formatCurrency(item.price)}
                          </p>

                          {/* Per-item Discount */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="Diskon %"
                                className="h-7 w-16 rounded-lg border border-border/50 bg-background/80 px-2 text-[10px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                                value={item.discountPercent ?? ""}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                  handleItemDiscount(item.sku, val);
                                }}
                              />
                              {item.discountPercent ? (
                                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-bold text-white">
                                  %
                                </span>
                              ) : null}
                            </div>
                            {item.discountPercent ? (
                              <span className="text-[10px] font-medium text-emerald-500">
                                -{formatCurrency(discAmt)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <div className="flex items-center rounded-lg border border-border/60 overflow-hidden shadow-sm">
                            <button
                              className="flex h-7 w-7 items-center justify-center bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:bg-muted-foreground/20"
                              onClick={() => updateQuantity(item.sku, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="flex h-7 w-8 items-center justify-center text-xs font-bold tabular-nums text-foreground bg-background">
                              {item.quantity}
                            </span>
                            <button
                              className="flex h-7 w-7 items-center justify-center bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:bg-muted-foreground/20"
                              onClick={() => updateQuantity(item.sku, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p
                            className={cn(
                              "text-xs font-semibold tabular-nums",
                              item.discountPercent ? "text-emerald-500" : "text-foreground",
                            )}
                          >
                            {formatCurrency(afterDisc)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ═══ SUMMARY ═══ */}
          <div className="relative z-10 border-t-2 border-border/40 bg-card shrink-0 shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.06)]">
            {/* Totals */}
            <div className="px-4 py-3 space-y-2.5">
              <SummaryRow label="Total Barang" value={`${totalItems} item`} />
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />

              {perItemDiscountTotal > 0 && (
                <SummaryRow
                  label="Diskon Produk"
                  value={`-${formatCurrency(perItemDiscountTotal)}`}
                  valueClass="text-emerald-500"
                />
              )}

              <Separator className="bg-border/30" />

              <SummaryRow
                label="Subtotal Setelah Diskon"
                value={formatCurrency(subtotalAfterItemDiscount)}
                labelClass="text-xs text-muted-foreground"
                valueClass="text-sm font-semibold"
              />

              {/* Transaction Discount */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2 border border-border/30">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Diskon"
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    value={transactionDiscount || ""}
                    onChange={(e) =>
                      setTransactionDiscount(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      )
                    }
                  />
                  {transactionDiscount > 0 && (
                    <span className="text-[10px] text-muted-foreground">%</span>
                  )}
                </div>
                {transactionDiscount > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] text-muted-foreground">
                      Diskon {transactionDiscount}%
                    </span>
                    <span className="text-xs font-semibold text-emerald-500">
                      -{formatCurrency(transactionDiscountAmount)}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* PPN Toggle */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2" onClick={() => dpp > 0 && setUsePPN(!usePPN)}>
                  <div
                    className={cn(
                      "relative flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      usePPN
                        ? "bg-primary"
                        : "bg-input",
                    )}
                    role="switch"
                    aria-checked={usePPN}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
                        usePPN ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    PPN {PPN_RATE}%
                  </span>
                </div>
                {usePPN && ppnAmount > 0 && (
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {formatCurrency(ppnAmount)}
                  </span>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Grand Total */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-sm font-bold text-foreground">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-primary tabular-nums tracking-tight">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 pt-1 space-y-2">
              <Button
                className={cn(
                  "w-full h-14 text-base font-bold gap-2.5 rounded-2xl",
                  "bg-gradient-to-r from-emerald-500 to-emerald-600",
                  "hover:from-emerald-600 hover:to-emerald-700",
                  "text-white shadow-xl shadow-emerald-500/20",
                  "transition-all duration-200 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.98]",
              "disabled:opacity-30 disabled:shadow-none disabled:active:scale-100",
              "group relative overflow-hidden",
                )}
                disabled={cart.length === 0}
                onClick={() => setShowPayment(true)}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Banknote className="h-6 w-6" />
                Bayar {formatCurrency(grandTotal)}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl text-xs font-medium gap-2 border-border/60 hover:bg-accent"
                  disabled={cart.length === 0}
                  onClick={handleHoldBill}
                >
                  <Clock className="h-4 w-4" />
                  Hold
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 h-11 rounded-xl text-xs font-medium gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  disabled={cart.length === 0}
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4" />
                  Batal
                </Button>
              </div>

              {heldBills.length > 0 && (
                <button
                  className="w-full text-center text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                  onClick={() => setShowHeldBills(true)}
                >
                  {heldBills.length} pesanan ditahan · Klik untuk lihat
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ PAYMENT MODAL ═══ */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        cartItems={cart.map((item) => ({
          ...item,
          subtotal: itemSubtotal(item),
        }))}
        subtotal={subtotal}
        perItemDiscountTotal={perItemDiscountTotal}
        transactionDiscountPercent={transactionDiscount}
        transactionDiscountAmount={transactionDiscountAmount}
        grandTotal={grandTotal}
        ppnAmount={ppnAmount}
        customerName={selectedCustomer}
        onConfirm={handlePaymentConfirm}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
}

// ─── Summary Row Component ─────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClass,
  labelClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
  labelClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-xs text-muted-foreground", labelClass)}>
        {label}
      </span>
      <span className={cn("text-xs font-medium text-foreground tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}
