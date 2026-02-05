"use client";
import React from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={(className ?? '') + ' bg-white p-4 rounded shadow'}>{children}</div>;
}
