export type Role = 'Admin' | 'Manager' | 'Kasir' | 'Gudang' | 'Viewer'

export const ALL_ROLES: Role[] = ['Admin', 'Manager', 'Kasir', 'Gudang', 'Viewer']

export const ROLE_LABELS: Record<Role, string> = {
  Admin: 'Admin',
  Manager: 'Manager',
  Kasir: 'Kasir',
  Gudang: 'Gudang',
  Viewer: 'Viewer',
}

export const ROLE_COLORS: Record<Role, string> = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Kasir: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  Gudang: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  Viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
}

export type Permission =
  | 'dashboard.view'
  | 'inventory.view'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.hpp'
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.delete'
  | 'barang-masuk.view'
  | 'barang-masuk.create'
  | 'laporan.view'
  | 'laporan.profit-loss'
  | 'pos.access'
  | 'settings.access'
  | 'settings.users'
  | 'user.activate'
  | 'user.deactivate'
  | 'user.change-role'
  | 'customers.view'
  | 'customers.create'
  | 'inventory.adjust-stok'
  | 'returns.create'
  | 'expenses.view'
  | 'expenses.create'
  | 'inventory.transfer-rak'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'settings.backup-export'
  | 'activity.logs.view'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Admin: [
    'dashboard.view',
    'inventory.view',
    'inventory.edit',
    'inventory.delete',
    'inventory.hpp',
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.delete',
    'barang-masuk.view',
    'barang-masuk.create',
    'laporan.view',
    'laporan.profit-loss',
    'pos.access',
    'settings.access',
    'settings.users',
    'user.activate',
    'user.deactivate',
    'user.change-role',
    'customers.view',
    'customers.create',
    'inventory.adjust-stok',
    'returns.create',
    'expenses.view',
    'expenses.create',
    'inventory.transfer-rak',
    'suppliers.view',
    'suppliers.create',
    'settings.backup-export',
    'activity.logs.view',
  ],
  Manager: [
    'dashboard.view',
    'inventory.view',
    'inventory.edit',
    'orders.view',
    'orders.create',
    'orders.edit',
    'barang-masuk.view',
    'barang-masuk.create',
    'laporan.view',
    'laporan.profit-loss',
    'pos.access',
    'customers.view',
    'customers.create',
    'settings.access',
    'inventory.adjust-stok',
    'returns.create',
    'expenses.view',
    'expenses.create',
    'suppliers.view',
    'suppliers.create',
    'inventory.transfer-rak',
    'settings.backup-export',
    'activity.logs.view',
  ],
  Kasir: [
    'dashboard.view',
    'inventory.view',
    'orders.view',
    'orders.create',
    'pos.access',
    'laporan.view',
  ],
  Gudang: [
    'dashboard.view',
    'inventory.view',
    'inventory.edit',
    'barang-masuk.view',
    'barang-masuk.create',
    'orders.view',
    'laporan.view',
  ],
  Viewer: [
    'dashboard.view',
    'inventory.view',
    'orders.view',
    'laporan.view',
  ],
}

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  // Jika role belum diset (null/undefined), fallback unrestricted — tampilkan semua
  if (!role) return true
  const perms = ROLE_PERMISSIONS[role]
  return perms?.includes(permission) ?? false
}

export function can(role: Role | null | undefined, ...permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.some((p) => hasPermission(role, p))
}

export function canDelete(role: Role | null | undefined): boolean {
  return hasPermission(role, 'inventory.delete') || hasPermission(role, 'orders.delete')
}

export function canEditHpp(role: Role | null | undefined): boolean {
  return hasPermission(role, 'inventory.hpp')
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === 'Admin'
}
