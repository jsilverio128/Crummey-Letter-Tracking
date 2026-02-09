"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/ilit-tracker', label: 'ILIT Tracker', icon: '📋' },
  { href: '/reminders', label: 'Reminders', icon: '🔔' },
  { href: '/crummey-letters', label: 'Crummey Letters', icon: '✉️' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } min-h-screen border-r border-slate-700`}
      >
        {/* Header with Logo */}
        <div className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            {!collapsed && <h1 className="font-bold text-sm truncate">ILIT & Crummey</h1>}
            <Button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '→' : '←'}
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer ${
                  isActive(item.href)
                    ? 'bg-slate-700 border-l-4 border-blue-500'
                    : 'hover:bg-slate-800'
                }`}
              >
                {collapsed ? (
                  <Tooltip content={item.label} side="right">
                    <span className="text-lg">{item.icon}</span>
                  </Tooltip>
                ) : (
                  <span className="text-lg">{item.icon}</span>
                )}
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 text-xs text-slate-400">
          {!collapsed && <p>© 2026 Estate Planning Tools</p>}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 transform transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="border-b border-slate-700 p-4 flex items-center justify-between">
          <h1 className="font-bold text-sm">ILIT & Crummey</h1>
          <Button
            onClick={onClose}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600"
            title="Close"
          >
            ✕
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="overflow-y-auto py-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors cursor-pointer ${
                  isActive(item.href)
                    ? 'bg-slate-700 border-l-4 border-blue-500'
                    : 'hover:bg-slate-800'
                }`}
                onClick={onClose}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
