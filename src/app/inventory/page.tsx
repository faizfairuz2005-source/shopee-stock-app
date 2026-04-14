"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Package } from "lucide-react";

interface Product {
  item_id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  stock_info_v2?: {
    total_reserved_stock: number;
  };
  sales: number;
  historical_sold: number;
  item_status: string;
  item_sku?: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shopee/products");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengambil data produk");
        return;
      }

      setProducts(data.products || []);
    } catch {
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditStock = (itemId: number, currentStock: number) => {
    setEditingStock(itemId);
    setNewStock(currentStock);
  };

  const handleUpdateStock = async (itemId: number) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/shopee/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, stock: newStock }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal update stok");
        return;
      }

      // Refresh products
      await fetchProducts();
      setEditingStock(null);
    } catch {
      setError("Terjadi kesalahan saat update stok");
    } finally {
      setUpdating(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.item_sku && p.item_sku.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStock = products.reduce(
    (sum, p) => sum + (p.stock_info_v2?.total_reserved_stock || 0),
    0
  );

  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Inventory
          </h1>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            Kelola stok produk Shopee Anda
          </p>
        </div>
        <Button onClick={fetchProducts} disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Sync Produk
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal">Total Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal">Total Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-indigo-600">{totalStock}</div>
          </CardContent>
        </Card>
        <Card className="card-hover border-blue-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal">Total Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-purple-600">{totalSales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-blue-200/50 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
              <Input
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
              <Package className="mb-3 h-12 w-12 text-blue-300" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Tidak ada produk yang sesuai dengan pencarian"
                  : "Belum ada data produk. Klik \"Sync Produk\" untuk menarik data dari Shopee."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-blue-200 bg-blue-50">
                  <tr className="text-left text-blue-700">
                    <th className="pb-3 pt-3 font-medium">Produk</th>
                    <th className="pb-3 pt-3 font-medium">SKU</th>
                    <th className="pb-3 pt-3 font-medium text-right">Harga</th>
                    <th className="pb-3 pt-3 font-medium text-right">Stok</th>
                    <th className="pb-3 pt-3 font-medium text-right">Terjual</th>
                    <th className="pb-3 pt-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.item_id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="max-w-[200px] truncate font-medium">
                            {product.name}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {product.item_sku || "-"}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        Rp {product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {editingStock === product.item_id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={newStock}
                              onChange={(e) => setNewStock(Number(e.target.value))}
                              className="h-7 w-20 text-right"
                              min={0}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStock(product.item_id)}
                              disabled={updating}
                              className="h-7 px-2"
                            >
                              {updating ? "..." : "✓"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingStock(null)}
                              className="h-7 px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleEditStock(
                                product.item_id,
                                product.stock_info_v2?.total_reserved_stock || 0
                              )
                            }
                            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors hover:opacity-80 ${
                              (product.stock_info_v2?.total_reserved_stock || 0) > 10
                                ? "bg-green-100 text-green-700"
                                : (product.stock_info_v2?.total_reserved_stock || 0) > 0
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.stock_info_v2?.total_reserved_stock || 0}
                          </button>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {product.sales || product.historical_sold || 0}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            product.item_status === "NORMAL"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.item_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
