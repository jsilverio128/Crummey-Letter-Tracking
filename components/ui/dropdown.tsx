"use client";
import React, { useState } from 'react';

export function Dropdown({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(v => !v)} className="px-2 py-1 border rounded">{label}</button>
      {open && <div className="absolute right-0 mt-2 bg-white border rounded shadow py-1">{children}</div>}
    </div>
  );
}
