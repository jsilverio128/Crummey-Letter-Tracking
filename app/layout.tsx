import type { Metadata } from "next"

import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/ui/use-toast"

import "./globals.css"

export const metadata: Metadata = {
  title: "ILIT Tracker",
  description: "ILIT Policy + Premium Due Date + Crummey Letter Tracker",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
