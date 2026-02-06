'use client';

import { useState, useMemo } from 'react';
import { useILITData } from '../../hooks/use-ilit-data';
import { useActivity } from '../../hooks/use-activity';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, THead, TBody } from '../../components/ui/table';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDaysFromToday(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = target.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export default function CrummeyLettersPage() {
  const { records, update } = useILITData();
  const { log } = useActivity();
  const [showAll, setShowAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState<string | null>(null);

  // Filter for letters that need to be sent
  const lettersTodo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = records.filter((r) => {
      if (r.crummeyLetterSendDate) {
        const sendDate = new Date(r.crummeyLetterSendDate + 'T00:00:00');
        const isPast = sendDate <= today;
        const notSent = !r.crummeySent && r.status !== 'Letter Sent';
        return isPast && notSent;
      }
      return false;
    });

    return filtered.sort((a, b) => (a.crummeyLetterSendDate || '').localeCompare(b.crummeyLetterSendDate || ''));
  }, [records]);

  // Combine: overdue first, then upcoming if showAll
  const displayedLetters = showAll
    ? records.filter((r) => r.crummeyLetterSendDate)
    : lettersTodo;

  const handleDownloadPDF = async (record: typeof records[0]) => {
    try {
      setIsDownloading(record.id);

      const response = await fetch('/api/crummey-letter/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Crummey-Letter-${record.ilitName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      log('pdf_generated', `Generated Crummey letter PDF for ${record.ilitName}`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleMarkSent = async (record: typeof records[0]) => {
    try {
      setIsMarking(record.id);
      const today = new Date().toISOString().split('T')[0];

      update(record.id, {
        crummeySent: true,
        crummeyLetterSentDate: today,
        status: 'Letter Sent' as const,
      });

      log('letter_sent', `Marked Crummey letter as sent for ${record.ilitName}`);
    } catch (error) {
      console.error('Mark sent failed:', error);
      alert('Failed to mark letter as sent. Please try again.');
    } finally {
      setIsMarking(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Crummey Letters</h1>
        <p className="text-slate-600 mt-2">Generate and track Crummey letter notifications</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {lettersTodo.length > 0 ? `📧 Letters to Send (${lettersTodo.length})` : '📧 Letters to Send'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {showAll
                  ? 'Showing all records with letter send dates'
                  : lettersTodo.length > 0
                    ? 'Records where send date has passed and letter not yet sent'
                    : 'No letters need to be sent right now'}
              </p>
            </div>
            {lettersTodo.length > 0 && (
              <Button
                onClick={() => setShowAll(!showAll)}
                className="text-sm bg-gray-600 hover:bg-gray-700 whitespace-nowrap"
              >
                {showAll ? 'Show Pending Only' : 'Show All'}
              </Button>
            )}
          </div>

          {displayedLetters.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">
                {showAll ? 'No records with letter send dates' : 'No pending Crummey letters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <th className="p-2">ILIT Name</th>
                    <th className="p-2">Insured</th>
                    <th className="p-2">Send Date</th>
                    <th className="p-2">Gift Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {displayedLetters.map((record) => {
                    const daysFromToday = getDaysFromToday(record.crummeyLetterSendDate);
                    const isPending = !record.crummeySent && record.status !== 'Letter Sent';
                    const isOverdue = daysFromToday !== null && daysFromToday < 0;

                    return (
                      <tr key={record.id} className={isOverdue ? 'bg-red-50 border-t' : 'border-t'}>
                        <td className="p-2 font-medium text-slate-900">{record.ilitName}</td>
                        <td className="p-2">{record.insuredName || '—'}</td>
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span>{formatDate(record.crummeyLetterSendDate)}</span>
                            {isPending && daysFromToday !== null && (
                              <span className="text-xs text-slate-500">
                                {daysFromToday < 0
                                  ? `${Math.abs(daysFromToday)} days overdue`
                                  : daysFromToday === 0
                                    ? 'Send today'
                                    : `${daysFromToday} days away`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2">{formatCurrency(record.premiumAmount)}</td>
                        <td className="p-2">
                          <Badge color={isPending ? 'orange' : 'green'}>
                            {record.status || 'Pending'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleDownloadPDF(record)}
                              disabled={isDownloading === record.id}
                              className="text-xs py-1 px-2 bg-slate-600 hover:bg-slate-700"
                            >
                              {isDownloading === record.id ? 'Creating...' : 'Download PDF'}
                            </Button>
                            {isPending && (
                              <Button
                                onClick={() => handleMarkSent(record)}
                                disabled={isMarking === record.id}
                                className="text-xs py-1 px-2 bg-green-600 hover:bg-green-700"
                              >
                                {isMarking === record.id ? 'Marking...' : 'Mark Sent'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
