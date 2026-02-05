"use client";
import React from 'react';

export function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const bg =
    color === 'red' ? 'bg-red-100 text-red-800' : color === 'orange' ? 'bg-orange-100 text-orange-800' : color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : color === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  return <span className={"px-2 py-0.5 rounded text-xs font-medium " + bg}>{children}</span>;
}
