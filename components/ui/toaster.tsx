"use client";
import React, { createContext, useContext, useState } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' };
const ToastContext = createContext<{ push: (t: Toast) => void }>({ push: () => {} });

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function push(t: Toast) {
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
  }
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded ${t.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToaster() {
  const ctx = useContext(ToastContext);
  return ctx;
}
