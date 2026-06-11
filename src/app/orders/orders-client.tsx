"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceModal } from "@/components/invoice/invoice-modal";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { toast } from "@/components/toast";
import { ExportButton } from "@/components/export-button";
import { ORDERS_EXPORT_COLUMNS } from "@/lib/export-utils";
import {
  ShoppingCart,
  CheckCircle,
  DollarSign,
  Plus,
  FileText,
  Eye,
  X,
  Truck,
  Package,
  XCircle,
  Search,
  RefreshCw,
  Store,
  ChevronDown,
} from "lucide-react";
import { InventoryProduct, Order, OrderItem, addOrder } from "@/app/actions";
import { generateInvoiceNumber } from "@/lib/utils/invoice-utils";
import type { InvoiceData, StoreInfo } from "@/lib/types/invoice";

interface OrdersClientProps {
  initialOrders: Order[];
  products: InventoryProduct[];
  defaultSellerName?: string;
  userId?: string;
  storeSuggestions?: string[];
}

// ─── Store Combobox Component ──────────────────────────────────────────
// Searchable dropdown + free-text input for picking/typing a store name.

function StoreCombobox({
  stores,
  value,
  onChange,
  placeholder,
  required,
}: {
  stores: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = stores.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && open) {
              e.preventDefault();
              setOpen(false);
            }
          }}
          placeholder={placeholder || "Cari atau ketik nama toko..."}
          required={required}
          className="pr-8"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 origin-top"
        >
          {stores.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {value
                ? "Nama toko akan langsung digunakan"
                : "Ketik nama toko secara manual"}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada toko ditemukan. Nama toko &quot;{value}&quot; akan langsung digunakan.
            </div>
          ) : (
            <div className="p-1 max-h-[200px] overflow-y-auto">
              {filtered.map((store) => (
                <button
                  key={store}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                  onClick={() => {
                    onChange(store);
                    setOpen(false);
                    // Refocus input after selection
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                >
                  <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{store}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Format Rupiah ──────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// ─── Store Name Cell ────────────────────────────────────────────────────
// Renders "Toko Offline" (blue badge) for POS offline orders,
// "Online" (indigo badge) for POS orders with a named customer,
// or the actual store name for Shopee-sourced/manual orders.

function StoreCell({ name }: { name: string }) {
  // POS offline — default customer "Umum" or empty
  if (name === "POS Direct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 text-xs font-medium">
        <Store className="h-3 w-3" />
        Toko Offline
      </span>
    );
  }
  // POS online — customer name was entered, treat as online order
  if (name === "Online") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-medium">
        <Store className="h-3 w-3" />
        Online
      </span>
    );
  }
  // Shopee or manually entered store name
  return (
    <span className="inline-flex items-center gap-1">
      <Store className="h-3 w-3 text-muted-foreground" />
      <span>{name}</span>
    </span>
  );
}

const statusConfig = {
  diproses: { label: "Diproses", color: "bg-yellow-100 text-yellow-800", icon: Package },
  dikirim: { label: "Dikirim", color: "bg-blue-100 text-blue-800", icon: Truck },
  selesai: { label: "Selesai", color: "bg-green-100 text-green-800", icon: CheckCircle },
  dibatalkan: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function OrdersClient({
  initialOrders,
  products,
  defaultSellerName,
  userId,
  storeSuggestions = [],
}: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(!initialOrders.length);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("semua");

  // Form states for adding new order
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [storeName, setStoreName] = useState("");
  const [orderItems, setOrderItems] = useState<Array<{ sku: string; quantity: number }>>([
    { sku: "", quantity: 1 },
  ]);
  const [shippingCost, setShippingCost] = useState(15000);

  // Auto-fill seller name from logged in user (read-only) — guaranteed non-empty by parent
  const sellerName = defaultSellerName || "";

  // Simulate initial loading if no data
  useEffect(() => {
    if (!initialOrders.length) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [initialOrders.length]);

  // Filter orders by search and date
  const filteredOrders = React.useMemo(() => {
    let result = orders.slice().reverse();

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.nomor_order.toLowerCase().includes(q) ||
          o.nama_pembeli.toLowerCase().includes(q) ||
          o.seller_name.toLowerCase().includes(q) ||
          o.nama_toko.toLowerCase().includes(q)
      );
    }

    // Date filter
    if (dateFilter !== "semua") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateFilter === "hari_ini") {
        result = result.filter((o) => {
          const d = new Date(o.tanggal_pesanan);
          return d >= today && d < new Date(today.getTime() + 86400000);
        });
      } else if (dateFilter === "minggu_ini") {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
        result = result.filter((o) => {
          const d = new Date(o.tanggal_pesanan);
          return d >= weekStart && d < weekEnd;
        });
      } else if (dateFilter === "bulan_ini") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        result = result.filter((o) => {
          const d = new Date(o.tanggal_pesanan);
          return d >= monthStart && d < monthEnd;
        });
      }
    }

    return result;
  }, [orders, search, dateFilter]);

  const totalRevenue = orders
    .filter((o) => o.status_pesanan === "selesai")
    .reduce((sum, order) => sum + order.grand_total, 0);

  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

  // Prepare invoice data from selected order
  const getInvoiceData = (order: Order): InvoiceData => {
    const storeInfo: StoreInfo = {
      name: "MultiStore",
      address: "Jl. Raya Contoh No. 123, Bandung, Jawa Barat 40123",
      phone: "+62 812-3456-7890",
      email: "hello@multistore.id",
      website: "www.multistore.id",
    };

    return {
      invoiceNumber: generateInvoiceNumber(order.id),
      date: order.tanggal_pesanan,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      orderNumber: order.nomor_order,
      sellerName: order.seller_name,
      storeName: order.nama_toko,
      customer: {
        name: order.nama_pembeli,
        phone: "",
        address: order.alamat_pengiriman,
      },
      items: order.items.map((item) => ({
        id: item.id,
        name: item.nama_produk,
        sku: item.sku,
        quantity: item.quantity,
        price: item.harga,
        subtotal: item.subtotal,
      })),
      payment: {
        subtotal: order.subtotal,
        shipping: order.ongkir,
        total: order.grand_total,
      },
      storeInfo,
      notes: `Terima kasih telah berbelanja di MultiStore.\n\nPesanan akan diproses dan dikirimkan ke alamat tujuan.`,
    };
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleCloseInvoice = () => {
    setIsInvoiceOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };

  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { sku: "", quantity: 1 }]);
  };

  const removeOrderItemRow = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: "sku" | "quantity", value: string | number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => {
      const product = products.find((p) => p.sku === item.sku);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate items
    const validItems = orderItems.filter((item) => item.sku && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Tambahkan minimal satu produk");
      setIsSubmitting(false);
      return;
    }

    if (!buyerName || !storeName || !sellerName) {
      toast.error("Nama pembeli, nama toko, dan nama penjual harus diisi");
      setIsSubmitting(false);
      return;
    }

    const items: OrderItem[] = validItems.map((item, index) => {
      const product = products.find((p) => p.sku === item.sku)!;
      return {
        id: Date.now() + index,
        sku: product.sku,
        nama_produk: product.name,
        harga: product.price,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    const newOrder: Omit<Order, "id" | "nomor_order"> = {
      tanggal_pesanan: new Date().toISOString().split("T")[0],
      user_id: userId || "",
      seller_name: sellerName,
      nama_pembeli: buyerName,
      alamat_pengiriman: buyerAddress || "Alamat belum diisi",
      nama_toko: storeName,
      status_pesanan: "diproses",
      items,
      subtotal,
      ongkir: shippingCost,
      grand_total: subtotal + shippingCost,
    };

    const result = await addOrder(newOrder);

    if (result.success && result.order) {
      setOrders([...orders, result.order]);
      setIsAddDialogOpen(false);
      toast.success("Pesanan berhasil ditambahkan");

      // Reset form
      setBuyerName("");
      setBuyerAddress("");
      setStoreName("");
      setOrderItems([{ sku: "", quantity: 1 }]);
      setShippingCost(15000);
    } else {
      toast.error("Gagal menambahkan pesanan");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Orders", href: "/orders" },
        ]}
        className="mb-2"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-40" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} cols={8} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content (shown when not loading) */}
      {!isLoading && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola pesanan dari semua toko Shopee terhubung
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ExportButton
                data={orders.map((o) => ({
                  ...o,
                  total_item: o.items.reduce((s, i) => s + i.quantity, 0),
                })) as unknown as Record<string, unknown>[]}
                columns={ORDERS_EXPORT_COLUMNS}
                filenamePrefix="Orders"
                label="Export Daftar Pesanan"
              />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Pesanan
                  </Button>
                }
              />
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Pesanan Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan detail pesanan dengan multiple produk.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Seller Info (Auto-filled from logged in user) */}
                  <div className="space-y-2">
                    <Label htmlFor="sellerName">Nama Penjual</Label>
                    <Input
                      id="sellerName"
                      value={sellerName}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Otomatis terisi dari akun yang sedang login
                    </p>
                  </div>

                  {/* Buyer Info */}
                  <div className="space-y-2">
                    <Label htmlFor="buyerName">Nama Pembeli *</Label>
                    <Input
                      id="buyerName"
                      placeholder="Nama lengkap"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyerAddress">Alamat Pengiriman</Label>
                    <Input
                      id="buyerAddress"
                      placeholder="Alamat lengkap"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Nama Toko *</Label>
                      <StoreCombobox
                        stores={storeSuggestions}
                        value={storeName}
                        onChange={setStoreName}
                        placeholder="Cari atau ketik nama toko..."
                        required
                      />
                      {storeSuggestions.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {storeSuggestions.length} toko tersedia — ketik untuk mencari atau pilih dari daftar
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">Ongkos Kirim (Rp)</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Daftar Produk *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOrderItemRow}>
                        <Plus className="h-3 w-3 mr-1" />
                        Tambah Produk
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={item.sku}
                              onChange={(e) => updateOrderItem(index, "sku", e.target.value)}
                              required
                            >
                              <option value="" disabled>
                                Pilih Produk
                              </option>
                              {products.map((p) => (
                                <option key={p.sku} value={p.sku}>
                                  {p.name} - {formatRupiah(p.price)} (Stok: {p.totalStock})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderItem(index, "quantity", Number(e.target.value))
                              }
                              required
                            />
                          </div>
                          {orderItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeOrderItemRow(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal Display */}
                  <div className="rounded-md bg-muted p-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Subtotal Produk</p>
                      <p className="text-lg font-bold">{formatRupiah(calculateSubtotal())}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-medium">Ongkir</p>
                      <p className="text-lg font-bold">{formatRupiah(shippingCost)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <p className="text-base font-semibold">Grand Total</p>
                      <p className="text-xl font-bold text-primary">
                        {formatRupiah(calculateSubtotal() + shippingCost)}
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Menyimpan..." : "Simpan Pesanan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Semua pesanan</p>
              </CardContent>
            </Card>
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Selesai</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600 transition-transform duration-200 ease-out group-hover/card:scale-110" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => o.status_pesanan === "selesai").length}
                </p>
                <p className="text-xs text-muted-foreground">Berhasil dikirim</p>
              </CardContent>
            </Card>
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Dari pesanan selesai</p>
              </CardContent>
            </Card>
            <Card className="card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out group-hover/card:scale-110" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Jenis barang terjual</p>
              </CardContent>
            </Card>
          </div>

          <Card className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle>Daftar Pesanan</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {filteredOrders.length} dari {orders.length} pesanan
                </span>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nomor order atau nama pembeli..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-1">
                  {[
                    { key: "semua", label: "Semua" },
                    { key: "hari_ini", label: "Hari Ini" },
                    { key: "minggu_ini", label: "Minggu Ini" },
                    { key: "bulan_ini", label: "Bulan Ini" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setDateFilter(f.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                        dateFilter === f.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="Belum ada pesanan"
                  description="Mulai kelola pesanan Anda dengan menambahkan pesanan pertama melalui tombol &quot;Tambah Pesanan&quot; di atas."
                  action={
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Pesanan Pertama
                    </Button>
                  }
                />
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-base font-medium text-muted-foreground">
                    Tidak ada hasil untuk pencarian ini
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Coba ubah kata kunci atau filter tanggal
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => {
                      setSearch("");
                      setDateFilter("semua");
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset Filter
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border max-h-[500px] overflow-auto table-responsive">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead>No. Order</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Nama Pembeli</TableHead>
                        <TableHead>Nama Penjual</TableHead>
                        <TableHead>Toko</TableHead>
                        <TableHead className="text-center">Jumlah Item</TableHead>
                        <TableHead className="text-right">Total Harga</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                          const StatusIcon = statusConfig[order.status_pesanan].icon;
                          return (
                            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell data-label="Order" className="font-mono text-xs whitespace-nowrap">
                                {order.nomor_order}
                              </TableCell>
                              <TableCell data-label="Tanggal" className="whitespace-nowrap">
                                {new Date(order.tanggal_pesanan).toLocaleDateString("id-ID")}
                              </TableCell>
                              <TableCell data-label="Pembeli" className="font-medium">{order.nama_pembeli}</TableCell>
                              <TableCell data-label="Penjual">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                                  {order.seller_name}
                                </span>
                              </TableCell>
                              <TableCell data-label="Toko">
                                <StoreCell name={order.nama_toko} />
                              </TableCell>
                              <TableCell data-label="Item" className="text-center">
                                <span className="inline-flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {order.items.length} barang
                                </span>
                              </TableCell>
                              <TableCell data-label="Total" className="text-right font-medium tabular-nums">
                                {formatRupiah(order.grand_total)}
                              </TableCell>
                              <TableCell data-label="Status" className="text-center">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig[order.status_pesanan].color}`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[order.status_pesanan].label}
                                </span>
                              </TableCell>
                              <TableCell data-label="Aksi">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetail(order);
                                    }}
                                    className="gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Detail
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewInvoice(order);
                                    }}
                                    className="gap-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    Invoice
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && isDetailOpen && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pesanan {selectedOrder.nomor_order}</DialogTitle>
              <DialogDescription>
                Informasi lengkap pesanan dan daftar produk
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nomor Order</p>
                  <p className="font-medium font-mono">{selectedOrder.nomor_order}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tanggal Pesanan</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.tanggal_pesanan).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nama Penjual</p>
                  <p className="font-medium">{selectedOrder.seller_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nama Pembeli</p>
                  <p className="font-medium">{selectedOrder.nama_pembeli}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Toko</p>
                  <StoreCell name={selectedOrder.nama_toko} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig[selectedOrder.status_pesanan].color}`}
                  >
                    {React.createElement(statusConfig[selectedOrder.status_pesanan].icon, {
                      className: "h-3 w-3",
                    })}
                    {statusConfig[selectedOrder.status_pesanan].label}
                  </span>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Alamat Pengiriman</p>
                  <p className="font-medium">{selectedOrder.alamat_pengiriman}</p>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Daftar Produk ({selectedOrder.items.length} barang)</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead className="text-right">Harga Satuan</TableHead>
                        <TableHead className="text-center">Jumlah</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.sku}
                          </TableCell>
                          <TableCell className="font-medium">{item.nama_produk}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatRupiah(item.harga)}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatRupiah(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal ({selectedOrder.items.length} item)</span>
                  <span className="font-medium tabular-nums">
                    {formatRupiah(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Ongkos Kirim</span>
                  <span className="font-medium tabular-nums">
                    {formatRupiah(selectedOrder.ongkir)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-base font-semibold">Grand Total</span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {formatRupiah(selectedOrder.grand_total)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDetail}>
                Tutup
              </Button>
              <Button
                onClick={() => {
                  handleCloseDetail();
                  handleViewInvoice(selectedOrder);
                }}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Lihat Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={handleCloseInvoice}
          invoice={getInvoiceData(selectedOrder)}
        />
      )}
    </div>
  );
}
