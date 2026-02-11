"use client";
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalData } from '../../hooks/use-portal-data';
import { useActivity } from '../../hooks/use-activity';
import { useSettings } from '../../hooks/use-settings';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToaster } from '../../components/ui/toaster';

function getDaysFromToday(dateStr?: string): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateMMDD(dateStr?: string | null) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return 'N/A';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function DashboardPage() {
  const { policies, addMany, dashboardStats } = usePortalData();
  const { getRecent, log: logActivity } = useActivity();
  const { reminderLeadDays } = useSettings();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const toaster = useToaster();
  const recentActivities = getRecent(10);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      toaster.push({ id: Date.now().toString(), message: 'Please upload .xlsx files only', type: 'error' });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const form = new FormData();
    form.append('file', f);
    try {
      // Call the unified import endpoint
      const res = await fetch('/api/ilit/import', {
        method: 'POST',
        body: form
      });
      const json = await res.json();
      
      if (!res.ok) {
        toaster.push({
          id: Date.now().toString(),
          message: `Upload failed: ${json.error || 'Unknown error'}`,
          type: 'error'
        });
        return;
      }
      
      const inserted = json.insertedCount || 0;
      
      if (inserted > 0) {
        toaster.push({
          id: Date.now().toString(),
          message: `Successfully imported ${inserted} policies`,
          type: 'success'
        });
        // Refresh the data to show newly imported policies
        router.refresh();
      } else {
        toaster.push({
          id: Date.now().toString(),
          message: 'No data was imported',
          type: 'error'
        });
      }

      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      toaster.push({ id: Date.now().toString(), message: 'Upload failed', type: 'error' });
    }
  }

  function downloadTemplate() {
    const link = document.createElement('a');
    link.href = '/api/template/ilit';
    link.download = 'ILIT-Template.xlsx';
    link.click();
  }

  const metrics = useMemo(() => {
    return {
      dueIn30: dashboardStats.premiumsDue30Days,
      dueIn60: dashboardStats.premiumsDue60Days,
      lettersPending: dashboardStats.lettersToSend,
      outstanding: dashboardStats.totalOutstandingPremiums
    };
  }, [dashboardStats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
          <Button onClick={() => fileRef.current?.click()}>Upload Excel</Button>
          <Button onClick={downloadTemplate}>Download Template</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Due in 30 Days"
          value={metrics.dueIn30}
          icon="📅"
          color="blue"
        />
        <SummaryCard
          title="Due in 60 Days"
          value={metrics.dueIn60}
          icon="⏰"
          color="amber"
        />
        <SummaryCard
          title="Letters Pending"
          value={metrics.lettersPending}
          icon="✉️"
          color="orange"
        />
        <SummaryCard
          title="Outstanding Amount"
          value={`$${metrics.outstanding.toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      {/* Recent Activity Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-sm">No activity yet. Start by uploading a file or managing records.</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
              >
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 break-words">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'amber' | 'orange' | 'green';
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps) {
  const bgColors = {
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
  };

  const textColors = {
    blue: 'text-blue-900',
    amber: 'text-amber-900',
    orange: 'text-orange-900',
    green: 'text-green-900',
  };

  const valueColors = {
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    orange: 'text-orange-700',
    green: 'text-green-700',
  };

  return (
    <Card className={`p-6 border ${bgColors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColors[color]}`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 ${valueColors[color]}`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </Card>
  );
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    import: '📥',
    clear: '🗑️',
    letter_sent: '✉️',
    edit: '✏️',
    delete: '❌',
    upload: '📤',
  };
  return icons[type] || '📝';
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
