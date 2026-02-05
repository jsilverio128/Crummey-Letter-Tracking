"use client";
import React from 'react';

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={(className ?? '') + ' text-sm font-medium'}>{children}</label>;
}
