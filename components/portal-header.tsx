"use client";
import React from 'react';
import { Button } from './ui/button';

interface PortalHeaderProps {
  onMenuClick?: () => void;
}

export function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      {/* Hamburger Menu (Mobile Only) */}
      <Button
        onClick={onMenuClick}
        className="md:hidden px-2 py-1 text-lg bg-gray-100 hover:bg-gray-200"
        title="Toggle menu"
      >
        ☰
      </Button>

      {/* Title */}
      <h1 className="hidden md:block text-xl font-semibold text-slate-900">
        ILIT & Crummey Letter Portal
      </h1>

      {/* Mobile Title (Smaller) */}
      <h1 className="md:hidden text-lg font-semibold text-slate-900">Portal</h1>

      {/* Right Side Spacer */}
      <div className="flex-1"></div>
    </header>
  );
}
