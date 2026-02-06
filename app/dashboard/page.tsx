"use client";
import React, { useMemo } from 'react';
import { useILITData } from '../../hooks/use-ilit-data';
import { useActivity } from '../../hooks/use-activity';
import { Card } from '../../components/ui/card';

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
  const { records } = useILITData();
  const { getRecent } = useActivity();
  const recentActivities = getRecent(10);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueIn30 = 0;
    let dueIn60 = 0;
    let lettersPending = 0;
    let outstanding = 0;

    records.forEach((record: any) => {
      const daysUntilDue = getDaysFromToday(record.premiumDueDate);
      const status = record.status || 'Pending';
      const isPaid = status === 'Paid';

      // Due in 30 Days
      if (daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 30) {
        dueIn30++;
      }

      // Due in 60 Days & Outstanding Amount
      if (daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 60) {
        dueIn60++;

        // Outstanding: sum premiums where status != Paid and premiumDueDate within 60 days
        if (!isPaid && record.premiumAmount) {
          outstanding += record.premiumAmount;
        }
      }

      // Letters Pending: today >= crummeyLetterSendDate and status != "Letter Sent"
      if (status !== 'Letter Sent' && record.crummeyLetterSendDate) {
        const daysTillSendDate = getDaysFromToday(record.crummeyLetterSendDate);
        // If send date has passed or is today (daysTillSendDate <= 0)
        if (daysTillSendDate !== null && daysTillSendDate <= 0) {
          lettersPending++;
        }
      }
    });

    return { dueIn30, dueIn60, lettersPending, outstanding };
  }, [records]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>

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
