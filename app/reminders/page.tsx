"use client";
import React, { useMemo, useState } from 'react';
import { useILITData } from '../../hooks/use-ilit-data';
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
  const { records } = useILITData();
  const { log: logActivity } = useActivity();
  const [crummeyFilterDays, setCrummeyFilterDays] = useState<FilterDays>(30);
  const [premiumFilterDays, setPremiumFilterDays] = useState<FilterDays>(30);

  // Section 1: Crummey letters to send
  const crummeyLettersTodo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records
      .filter(r => {
        // today >= crummeyLetterSendDate and crummeySent is false
        if (r.crummeyLetterSendDate) {
          const sendDate = new Date(r.crummeyLetterSendDate + 'T00:00:00');
          const isPast = sendDate <= today;
          const notSent = !r.crummeySent && r.status !== 'Letter Sent';
          return isPast && notSent;
        }
        return false;
      })
      .sort((a, b) => ((a.crummeyLetterSendDate || '') as string).localeCompare((b.crummeyLetterSendDate || '') as string));
  }, [records]);

  // Section 2: Premiums due soon (with filter)
  const premiumsDueSoon = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records
      .filter(r => {
        const daysUntilDue = getDaysFromToday(r.premiumDueDate);
        return daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= premiumFilterDays;
      })
      .sort((a, b) => ((a.premiumDueDate || '') as string).localeCompare((b.premiumDueDate || '') as string));
  }, [records, premiumFilterDays]);

  function handleMarkLetterSent(id: string, ilitName: string) {
    // This would require access to the update function from useILITData
    // For now, we'll show how it would work when integrated
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
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-medium">{r.ilitName}</td>
                      <td className="p-2">{r.insuredName || '—'}</td>
                      <td className="p-2">{formatDateMMDD(r.premiumDueDate)}</td>
                      <td className="p-2">{formatDateMMDD(r.crummeyLetterSendDate)}</td>
                      <td className="p-2">{statusBadge(r.status)}</td>
                      <td className="p-2">
                        <Button
                          onClick={() => handleMarkLetterSent(r.id, r.ilitName)}
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
                    const daysUntilDue = getDaysFromToday(r.premiumDueDate);
                    const urgencyColor = daysUntilDue !== null && daysUntilDue <= 7 ? 'bg-red-50' : '';
                    return (
                      <tr key={r.id} className={`border-t ${urgencyColor}`}>
                        <td className="p-2 font-medium">{r.ilitName}</td>
                        <td className="p-2">{r.insuredName || '—'}</td>
                        <td className="p-2">
                          {formatDateMMDD(r.premiumDueDate)}
                          {daysUntilDue !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} away`}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {r.premiumAmount ? `$${r.premiumAmount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-2">{statusBadge(r.status)}</td>
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
