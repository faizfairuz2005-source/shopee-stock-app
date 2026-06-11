"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  Smartphone,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/invoice-utils";

// ─── Types ─────────────────────────────────────────────────

type PaymentTab = "cash" | "qris" | "transfer" | "split";

interface CartItemForPayment {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  discountPercent?: number;
  subtotal: number;
}

// ─── Props ──────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemForPayment[];
  subtotal: number;
  perItemDiscountTotal: number;
  transactionDiscountPercent: number;
  transactionDiscountAmount: number;
  ppnAmount: number;
  grandTotal: number;
  customerName: string;
  onConfirm: (data: {
    paymentMethod: PaymentTab;
    cashAmount: number;
    changeAmount: number;
    transferAmount?: number;
  }) => void;
  isProcessing: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
}

// ─── Payment Modal ───────────────────────────────────────────

export function PaymentModal({
  isOpen,
  onClose,
  cartItems,
  perItemDiscountTotal,
  transactionDiscountPercent,
  ppnAmount,
  grandTotal,
  customerName,
  onConfirm,
  isProcessing,
  error,
  onErrorDismiss,
}: PaymentModalProps) {
  const [tab, setTab] = useState<PaymentTab>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitTransfer, setSplitTransfer] = useState("");

  if (!isOpen) return null;

  const cash = parseInt(cashAmount.replace(/\D/g, ""), 10) || 0;
  const cashChange = cash - grandTotal;
  const cashShort = cashChange < 0;

  const transferVal = parseInt(transferAmount.replace(/\D/g, ""), 10) || 0;
  const splitCashVal = parseInt(splitCash.replace(/\D/g, ""), 10) || 0;
  const splitTransferVal = parseInt(splitTransfer.replace(/\D/g, ""), 10) || 0;
  const splitTotal = splitCashVal + splitTransferVal;
  const splitChange = splitTotal - grandTotal;
  const splitShort = splitChange < 0;

  // ─── Handle Confirm ───────────────────────────────────────

  const handleConfirm = () => {
    if (tab === "cash") {
      if (cash < grandTotal) return;
      onConfirm({
        paymentMethod: "cash",
        cashAmount: cash,
        changeAmount: cash - grandTotal,
      });
    } else if (tab === "qris") {
      onConfirm({
        paymentMethod: "qris",
        cashAmount: grandTotal,
        changeAmount: 0,
      });
    } else if (tab === "transfer") {
      if (transferVal < grandTotal) return;
      onConfirm({
        paymentMethod: "transfer",
        cashAmount: transferVal,
        changeAmount: transferVal - grandTotal,
      });
    } else if (tab === "split") {
      if (splitTotal < grandTotal) return;
      onConfirm({
        paymentMethod: "split",
        cashAmount: splitCashVal,
        changeAmount: splitTotal - grandTotal,
        transferAmount: splitTransferVal,
      });
    }
  };

  const isPayReady =
    tab === "qris" ||
    (tab === "cash" && cash >= grandTotal) ||
    (tab === "transfer" && transferVal >= grandTotal) ||
    (tab === "split" && splitTotal >= grandTotal);

  const tabs: { key: PaymentTab; label: string; icon: typeof CreditCard }[] = [
    { key: "cash", label: "Tunai", icon: Banknote },
    { key: "qris", label: "QRIS", icon: QrCode },
    { key: "transfer", label: "Transfer", icon: Smartphone },
    { key: "split", label: "Split", icon: ArrowLeftRight },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl ring-1 ring-border/60 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 shrink-0 bg-card/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/20">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Pembayaran</h2>
              <p className="text-[11px] text-muted-foreground">
                {customerName || "Pelanggan Umum"}
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

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Transaksi Gagal
                </p>
                <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-1 whitespace-pre-line">
                  {error}
                </p>
              </div>
              <button
                onClick={onErrorDismiss}
                className="shrink-0 rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <X className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Grand Total Display */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Total Pembayaran
            </p>
            <p className="text-3xl font-bold text-primary tracking-tight">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Cash Payment */}
          {tab === "cash" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Jumlah Tunai
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashAmount}
                    onChange={(e) =>
                      setCashAmount(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    autoFocus
                    className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-right text-2xl font-bold tracking-wider tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
              </div>

              {cashAmount && cash > 0 && (
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    cashShort
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kembalian</span>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        cashShort ? "text-red-500" : "text-emerald-500",
                      )}
                    >
                      {formatCurrency(Math.abs(cashChange))}
                      {cashShort && (
                        <span className="text-[11px] font-normal ml-1">(kurang)</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashAmount(String(amt))}
                    className={cn(
                      "flex-1 rounded-xl border border-border/60 bg-muted/20 px-2 py-2.5 text-xs font-medium transition-all",
                      cash === amt
                        ? "border-primary/50 bg-primary/5 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QRIS */}
          {tab === "qris" && (
            <div className="space-y-4 text-center animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-gradient-to-br from-muted/50 to-muted/20">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-xl bg-primary/5">
                    <QrCode className="h-16 w-16 text-primary/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Scan QRIS
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(grandTotal)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60">
                Buka aplikasi pembayaran, scan QRIS, dan konfirmasi pembayaran
              </p>
            </div>
          )}

          {/* Transfer */}
          {tab === "transfer" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Jumlah Transfer
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={transferAmount}
                    onChange={(e) =>
                      setTransferAmount(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    autoFocus
                    className="h-14 w-full rounded-2xl border border-border bg-background pl-12 pr-4 text-right text-2xl font-bold tracking-wider tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
              </div>

              {transferAmount && transferVal > 0 && (
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    transferVal < grandTotal
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      : "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {transferVal >= grandTotal ? "Kembalian" : "Kekurangan"}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        transferVal < grandTotal ? "text-red-500" : "text-emerald-500",
                      )}
                    >
                      {transferVal >= grandTotal
                        ? formatCurrency(transferVal - grandTotal)
                        : formatCurrency(grandTotal - transferVal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Bank Info */}
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/30 to-muted/10 p-5 text-center">
                <p className="font-bold text-foreground text-base mb-1">
                  BCA — 1234567890
                </p>
                <p className="text-xs text-muted-foreground">
                  a.n. MultiStore Indonesia
                </p>
              </div>
            </div>
          )}

          {/* Split Payment */}
          {tab === "split" && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <p className="text-xs text-muted-foreground text-center">
                Bagi pembayaran menjadi Tunai + Transfer
              </p>

              {/* Cash Portion */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  <Banknote className="h-3.5 w-3.5 inline mr-1" />
                  Tunai
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={splitCash}
                    onChange={(e) =>
                      setSplitCash(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    autoFocus
                    className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-right text-xl font-bold tracking-wider tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
              </div>

              {/* Transfer Portion */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  <Smartphone className="h-3.5 w-3.5 inline mr-1" />
                  Transfer
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={splitTransfer}
                    onChange={(e) =>
                      setSplitTransfer(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-right text-xl font-bold tracking-wider tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  />
                </div>
              </div>

              {/* Summary */}
              {(splitCash || splitTransfer) && (
                <div
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    splitShort
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                      : splitTotal >= grandTotal
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tunai</span>
                      <span className="font-medium text-foreground">{formatCurrency(splitCashVal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transfer</span>
                      <span className="font-medium text-foreground">{formatCurrency(splitTransferVal)}</span>
                    </div>
                    <Separator className="my-2 bg-border/40" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <span
                        className={cn(
                          "text-lg font-bold tabular-nums",
                          splitTotal >= grandTotal ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {formatCurrency(splitTotal)}
                      </span>
                    </div>
                    {!splitShort && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Kembalian: {formatCurrency(splitTotal - grandTotal)}
                      </p>
                    )}
                    {splitShort && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Kurang: {formatCurrency(grandTotal - splitTotal)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-5 py-4 space-y-3 shrink-0 bg-card/80">
          {/* Mini Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground/80">
            <span>
              {cartItems.reduce((s, i) => s + i.quantity, 0)} item
            </span>
            <div className="flex items-center gap-3">
              {perItemDiscountTotal > 0 && (
                <span>Diskon: -{formatCurrency(perItemDiscountTotal)}</span>
              )}
              {transactionDiscountPercent > 0 && (
                <span>Diskon Trans: {transactionDiscountPercent}%</span>
              )}
              {ppnAmount > 0 && (
                <span>PPN 11%: {formatCurrency(ppnAmount)}</span>
              )}
            </div>
          </div>

          <Button
            className={cn(
              "w-full h-14 text-base font-bold gap-2.5 rounded-2xl",
              "bg-gradient-to-r from-emerald-500 to-emerald-600",
              "hover:from-emerald-600 hover:to-emerald-700",
              "text-white shadow-lg shadow-emerald-500/20",
              "transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30",
              "disabled:opacity-35 disabled:shadow-none",
            )}
            disabled={!isPayReady || isProcessing}
            onClick={handleConfirm}
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                {tab === "cash"
                  ? `Bayar Tunai ${formatCurrency(grandTotal)}`
                  : tab === "qris"
                    ? `Bayar QRIS ${formatCurrency(grandTotal)}`
                    : tab === "transfer"
                      ? `Bayar Transfer ${formatCurrency(grandTotal)}`
                      : `Bayar ${formatCurrency(grandTotal)}`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
