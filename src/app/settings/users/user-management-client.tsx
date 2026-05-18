"use client";

import { useState, useTransition } from "react";
import {
  Search,
  UserPlus,
  X,
  Shield,
  Ban,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/role-badge";
import { ALL_ROLES, type Role } from "@/lib/permissions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { UserManagementItem } from "./actions";
import { updateUserRole, inviteUser } from "./actions";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface UserManagementClientProps {
  initialUsers: UserManagementItem[];
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Kasir");

  // Role edit modal
  const [showRoleEdit, setShowRoleEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null);
  const [editingRole, setEditingRole] = useState<Role>("Kasir");

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error("Email harus diisi");
      return;
    }

    startTransition(async () => {
      const result = await inviteUser(inviteEmail.trim(), inviteName.trim(), inviteRole);
      if (result.success) {
        toast.success(`Undangan berhasil dikirim ke ${inviteEmail}`);
        setShowInvite(false);
        setInviteEmail("");
        setInviteName("");
        setInviteRole("Kasir");
      } else {
        toast.error(result.error || "Gagal mengundang user");
      }
    });
  };

  const handleRoleChange = () => {
    if (!editingUser) return;

    startTransition(async () => {
      const result = await updateUserRole(editingUser.id, editingRole);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, role: editingRole } : u))
        );
        toast.success(`Role ${editingUser.full_name || editingUser.email} diubah ke ${editingRole}`);
        setShowRoleEdit(false);
        setEditingUser(null);
      } else {
        toast.error(result.error || "Gagal mengubah role");
      }
    });
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pengguna dan hak akses mereka
          </p>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger render={<Button className="gap-2"><UserPlus className="h-4 w-4" />Tambah User Baru</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Kirim undangan ke email pengguna baru
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nama Lengkap</Label>
                <Input
                  id="invite-name"
                  placeholder="Nama pengguna"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role / Hak Akses</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Batal
              </Button>
              <Button onClick={handleInvite} disabled={isPending}>
                {isPending ? "Mengirim..." : "Kirim Undangan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pengguna</CardTitle>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-border/60 bg-background/60 pl-9 shadow-none placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Tidak ada pengguna ditemukan"
              description={
                search
                  ? `Tidak ada hasil untuk "${search}"`
                  : "Belum ada pengguna terdaftar"
              }
              action={
                search ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Bergabung</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="font-medium">{user.full_name || "—"}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email || (
                        <span className="text-xs italic">Email tidak tersedia</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <Ban className="mr-1 h-3 w-3" />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setEditingUser(user);
                              setEditingRole(user.role);
                              setShowRoleEdit(true);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Edit Modal */}
      {showRoleEdit && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95">
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Edit Role</h2>
                <p className="text-sm text-muted-foreground">
                  Ubah hak akses untuk <span className="font-medium">{editingUser.full_name || editingUser.email}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role Baru</Label>
                <select
                  id="edit-role"
                  value={editingRole}
                  onChange={(e) => setEditingRole(e.target.value as Role)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleEdit(false);
                    setEditingUser(null);
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button onClick={handleRoleChange} disabled={isPending} className="flex-1">
                  {isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
