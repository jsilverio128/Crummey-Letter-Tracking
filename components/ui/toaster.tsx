"use client"

import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export const Toaster = () => {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-md border bg-background p-4 shadow-md",
            toast.variant === "destructive" && "border-destructive text-destructive"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {toast.title && <div className="text-sm font-semibold">{toast.title}</div>}
              {toast.description && (
                <div className="text-sm text-muted-foreground">{toast.description}</div>
              )}
            </div>
            <button
              className="text-xs text-muted-foreground"
              onClick={() => dismiss(toast.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
