'use client'

import { useContext, useMemo } from 'react'
import { type Permission, ROLE_PERMISSIONS, hasPermission, can, canDelete, canEditHpp, isAdmin } from '@/lib/permissions'
import { DashboardRoleContext } from '@/components/dashboard-shell'

export function usePermission() {
  const role = useContext(DashboardRoleContext)

  return useMemo(
    () => ({
      role,
      isAdmin: isAdmin(role),
      canDelete: canDelete(role),
      canEditHpp: canEditHpp(role),
      can: (permission: Permission) => hasPermission(role, permission),
      canAny: (...permissions: Permission[]) => can(role, ...permissions),
      permissions: role ? ROLE_PERMISSIONS[role] ?? [] : [],
    }),
    [role]
  )
}
