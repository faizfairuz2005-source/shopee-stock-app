"use client"

import { type ReactNode } from "react"
import { usePermission } from "@/lib/use-permission"
import { type Permission } from "@/lib/permissions"

export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission
  fallback?: ReactNode
  children: ReactNode
}) {
  const { can } = usePermission()

  if (can(permission)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

export function CanAny({
  permissions,
  fallback = null,
  children,
}: {
  permissions: Permission[]
  fallback?: ReactNode
  children: ReactNode
}) {
  const { canAny } = usePermission()

  if (canAny(...permissions)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

export function ProtectedButton({
  permission,
  children,
  ...props
}: {
  permission: Permission
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { can } = usePermission()

  if (!can(permission)) {
    return null
  }

  return <button {...props}>{children}</button>
}
