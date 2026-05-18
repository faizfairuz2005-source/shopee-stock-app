"use client";

import { Toaster } from "sonner";

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "rounded-lg border shadow-sm",
            title: "text-sm font-medium",
          },
        }}
      />
    </>
  );
}

// Re-export useToast from sonner for compatibility
export { toast } from "sonner";
export { useSonner as useToast } from "sonner";