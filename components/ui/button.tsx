"use client";
import React from 'react';
import clsx from 'clsx';

export function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; className?: string }) {
  return (
    <button
      {...props}
      className={clsx('px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50', className)}
    >
      {children}
    </button>
  );
}
