"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Plus,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  MoreHorizontal,
  PackageOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/toast";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Supplier } from "@/app/actions";
import {
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/app/actions";

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLIENT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SupplierClientProps {
  initialSuppliers: Supplier[];
}

export function SupplierClient({ initialSuppliers }: SupplierClientProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // ─── Computed ──────────────────────────────────────────────────

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contact_person.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  // ─── Form handlers ──────────────────────────────────────────────

  const openAddForm = () => {
    setEditingSupplier(null);
    setFormData({ name: "", contact_person: "", phone: "", email: "", address: "", notes: "" });
    setShowForm(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Nama supplier harus diisi");
      return;
    }

    startTransition(async () => {
      if (editingSupplier) {
        const result = await updateSupplier({
          ...editingSupplier,
          name: formData.name.trim(),
          contact_person: formData.contact_person.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
        });
        if (result.success) {
          setSuppliers((prev) =>
            prev.map((s) =>
              s.id === editingSupplier.id
                ? { ...s, ...formData, name: formData.name.trim(), updated_at: new Date().toISOString() }
                : s
            )
          );
          toast.success("Supplier berhasil diupdate");
          setShowForm(false);
        } else {
          toast.error(result.error || "Gagal mengupdate supplier");
        }
      } else {
        const result = await addSupplier(formData);
        if (result.success && result.supplier) {
          setSuppliers((prev) => [result.supplier!, ...prev]);
          toast.success("Supplier baru berhasil ditambahkan");
          setShowForm(false);
        } else {
          toast.error(result.error || "Gagal menambahkan supplier");
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deletingSupplier) return;

    startTransition(async () => {
      const result = await deleteSupplier(deletingSupplier.id);
      if (result.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id));
        toast.success("Supplier berhasil dihapus");
        setShowDelete(false);
        setDeletingSupplier(null);
      } else {
        toast.error(result.error || "Gagal menghapus supplier");
      }
    });
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supplier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data supplier untuk penerimaan barang
          </p>
        </div>
        <Button className="gap-2" onClick={openAddForm}>
          <Plus className="h-4 w-4" />
          Tambah Supplier Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{suppliers.length}</p>
            <p className="text-xs text-muted-foreground">Supplier terdaftar</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supplier Aktif</CardTitle>
            <PackageOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{suppliers.length}</p>
            <p className="text-xs text-muted-foreground">
              Semua supplier terdaftar
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontak Tersimpan</CardTitle>
            <Phone className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {suppliers.filter((s) => s.phone || s.email).length}
            </p>
            <p className="text-xs text-muted-foreground">
              Dengan nomor telepon atau email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Supplier</CardTitle>
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, kontak, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Tidak ada supplier ditemukan"
              description={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada supplier terdaftar. Tambahkan supplier baru untuk mulai mencatat penerimaan barang."
              }
              action={
                search ? (
                  <Button variant="outline" className="gap-2" onClick={() => setSearch("")}>
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                ) : (
                  <Button className="gap-2" onClick={openAddForm}>
                    <Plus className="h-4 w-4" />
                    Tambah Supplier
                  </Button>
                )
              }
            />
          ) : (
            <div className="rounded-md border table-responsive">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>No. Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="transition-colors hover:bg-muted/50">
                      <TableCell data-label="Nama">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{supplier.name}</p>
                            {supplier.contact_person && (
                              <p className="text-[11px] text-muted-foreground/70">
                                Kontak: {supplier.contact_person}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-label="Kontak">
                        {supplier.contact_person ? (
                          <span className="text-sm">{supplier.contact_person}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Telepon">
                        {supplier.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 text-muted-foreground/50" />
                            {supplier.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Email">
                        {supplier.email ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground/50" />
                            {supplier.email}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Alamat">
                        {supplier.address ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            <span className="truncate max-w-[150px]">{supplier.address}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/40 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell data-label="Aksi" className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => openEditForm(supplier)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Supplier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-600 focus:text-red-600"
                              onClick={() => {
                                setDeletingSupplier(supplier);
                                setShowDelete(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  ADD / EDIT SUPPLIER MODAL                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "Tambah Supplier Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Ubah data supplier yang sudah terdaftar"
                : "Masukkan data supplier baru untuk dicatat dalam sistem"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Nama Supplier
              </Label>
              <Input
                id="name"
                placeholder="PT. Supplier Maju Jaya"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Kontak Person</Label>
                <Input
                  id="contact"
                  placeholder="Budi Santoso"
                  value={formData.contact_person}
                  onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  placeholder="021-1234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="supplier@example.com"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <textarea
                id="address"
                rows={2}
                placeholder="Jl. Raya Industri No. 123, Jakarta"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Catatan khusus tentang supplier ini..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : editingSupplier ? "Simpan Perubahan" : "Tambah Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════ */}
      {/*  DELETE CONFIRMATION                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Hapus Supplier</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-medium text-foreground">{deletingSupplier?.name}</span>
              ? Tindakan ini tidak dapat dibatalkan. Riwayat barang masuk dari supplier
              ini akan tetap tersimpan di laporan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDelete(false);
                setDeletingSupplier(null);
              }}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
