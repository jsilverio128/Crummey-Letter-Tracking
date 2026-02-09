"use client";
import React, { useMemo, useState } from 'react';
import { usePortalData } from '../../hooks/use-portal-data';
import { useActivity } from '../../hooks/use-activity';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, THead, TBody } from '../../components/ui/table';

type FilterDays = 7 | 30 | 60;

function getDaysFromToday(dateStr?: string): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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

function statusBadge(status?: string) {
  const statusColorMap: Record<string, string> = {
    'Paid': 'green',
    'Letter Sent': 'green',
    'Due Soon': 'orange',
    'Overdue': 'red',
    'Pending': 'blue',
    'Not Started': 'gray'
  };
  const displayStatus = status || 'Pending';
  const color = statusColorMap[displayStatus] || 'blue';
  return <Badge color={color}>{displayStatus}</Badge>;
}

export default function RemindersPage() {
  const { reminders, update } = usePortalData();
  const { log: logActivity } = useActivity();
  const [crummeyFilterDays, setCrummeyFilterDays] = useState<FilterDays>(30);
  const [premiumFilterDays, setPremiumFilterDays] = useState<FilterDays>(30);

  const crummeyLettersTodo = useMemo(() => {
    return reminders
      .filter(r => r.type === 'letter' && r.daysUntilAction === 0)
      .sort((a, b) => a.actionDate.localeCompare(b.actionDate));
  }, [reminders]);

  const premiumsDueSoon = useMemo(() => {
    return reminders
      .filter(r => r.type === 'premium' && r.daysUntilAction <= premiumFilterDays)
      .sort((a, b) => a.actionDate.localeCompare(b.actionDate));
  }, [reminders, premiumFilterDays]);

  function handleMarkLetterSent(id: string, ilitName: string) {
    update(id, {
      crummeyLetterSentDate: new Date().toISOString().slice(0, 10),
      status: 'Letter Sent'
    });
    logActivity('letter_sent', `Marked letter sent for ${ilitName}`);
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-900">Reminders</h2>

      {/* Section 1: Crummey Letters to Send */}
      <div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-4">📧 Crummey Letters to Send</h3>
        <Card className="p-6">
          {crummeyLettersTodo.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No Crummey letters need to be sent right now. Great job! ✅</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <th className="p-2 text-left">ILIT Name</th>
                    <th className="p-2 text-left">Insured</th>
                    <th className="p-2 text-left">Premium Due</th>
                    <th className="p-2 text-left">Send Date</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {crummeyLettersTodo.map(r => (
                    <tr key={r.policy.id} className="border-t">
                      <td className="p-2 font-medium">{r.policy.ilitName}</td>
                      <td className="p-2">{r.policy.insuredName || '—'}</td>
                      <td className="p-2">{formatDateMMDD(r.policy.premiumDueDate)}</td>
                      <td className="p-2">{formatDateMMDD(r.actionDate)}</td>
                      <td className="p-2">{statusBadge(r.policy.status)}</td>
                      <td className="p-2">
                        <Button
                          onClick={() => handleMarkLetterSent(r.policy.id, r.policy.ilitName)}
                          className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700"
                        >
                          Mark Sent
                        </Button>
                      </td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Section 2: Premiums Due Soon */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold text-slate-900">💰 Premiums Due Soon</h3>
          <div className="flex gap-2">
            {([7, 30, 60] as FilterDays[]).map(days => (
              <button
                key={days}
                onClick={() => setPremiumFilterDays(days)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  premiumFilterDays === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Next {days}d
              </button>
            ))}
          </div>
        </div>
        <Card className="p-6">
          {premiumsDueSoon.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No premiums due in the next {premiumFilterDays} days. All good! ✅
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <th className="p-2 text-left">ILIT Name</th>
                    <th className="p-2 text-left">Insured</th>
                    <th className="p-2 text-left">Due Date</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </THead>
                <TBody>
                  {premiumsDueSoon.map(r => {
                    const urgencyColor = r.daysUntilAction <= 7 ? 'bg-red-50' : '';
                    return (
                      <tr key={r.policy.id} className={`border-t ${urgencyColor}`}>
                        <td className="p-2 font-medium">{r.policy.ilitName}</td>
                        <td className="p-2">{r.policy.insuredName || '—'}</td>
                        <td className="p-2">
                          {formatDateMMDD(r.actionDate)}
                            <div className="text-xs text-gray-500 mt-1">
                              {r.daysUntilAction === 0 ? 'Due today' : `${r.daysUntilAction} day${r.daysUntilAction !== 1 ? 's' : ''} away`}
                            </div>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {r.policy.premiumAmount ? `$${r.policy.premiumAmount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-2">{statusBadge(r.policy.status)}</td>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
