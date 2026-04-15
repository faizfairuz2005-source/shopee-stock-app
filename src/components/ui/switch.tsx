"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = checked ?? internalChecked

  const toggle = React.useCallback(() => {
    if (disabled) return
    const nextChecked = !isChecked
    if (checked === undefined) {
      setInternalChecked(nextChecked)
    }
    onCheckedChange?.(nextChecked)
  }, [checked, disabled, isChecked, onCheckedChange])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-slot="switch"
      data-state={isChecked ? "checked" : "unchecked"}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-6 w-11 items-center rounded-full border border-transparent p-0.5 transition-[background-color,box-shadow] duration-200 ease-out",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={toggle}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={isChecked ? "checked" : "unchecked"}
        className={cn(
          "block size-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
