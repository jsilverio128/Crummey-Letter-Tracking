"use client"

import * as React from "react"

type ToastMessage = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextValue = {
  toasts: ToastMessage[]
  toast: (message: Omit<ToastMessage, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const toast = React.useCallback((message: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...message, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 4000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
