import { cn } from "@/lib/utils"
import { type Role, ROLE_COLORS, ROLE_LABELS } from "@/lib/permissions"

export function RoleBadge({
  role,
  className,
}: {
  role: Role | string | null | undefined
  className?: string
}) {
  if (!role) return null

  const colorClass = ROLE_COLORS[role as Role]
  const label = ROLE_LABELS[role as Role] || role

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
