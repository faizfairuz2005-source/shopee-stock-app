import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
          "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
          "focus-visible:outline-none focus-visible:border-ring/90 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:shadow-sm",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        suppressHydrationWarning
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
