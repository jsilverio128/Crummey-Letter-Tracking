"use client";
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePortalData } from '../hooks/use-portal-data';
import { useActivity } from '../hooks/use-activity';
import { useSettings } from '../hooks/use-settings';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Table, THead, TBody } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { useToaster } from './ui/toaster';

function statusFor(record: any) {
  // Use explicit status field if available
  if (record.status) {
    const statusColorMap: Record<string, string> = {
      'Paid': 'green',
      'Letter Sent': 'green',
      'Letter Due': 'orange',
      'Due Soon': 'orange',
      'Overdue': 'red',
      'Pending': 'blue',
      'Not Started': 'gray'
    };
    return { label: record.status, color: statusColorMap[record.status] || 'blue' };
  }
  
  // Fallback to crummeyLetterSentDate
  const today = new Date();
  if (record.crummeyLetterSentDate) return { label: 'Letter Sent', color: 'green' };
  if (!record.premiumDueDate) return { label: 'Not Started', color: 'gray' };
  const due = new Date(record.premiumDueDate + 'T00:00:00');
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Overdue', color: 'red' };
  if (diff <= 7) return { label: 'Due Soon', color: 'orange' };
  if (diff <= 35) return { label: 'Pending', color: 'blue' };
  return { label: 'Pending', color: 'blue' };
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

function exportCSV(rows: any[]) {
  const keys = Object.keys(rows[0] ?? {});
  const csv = [keys.join(',')]
    .concat(
      rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ilit_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function ILITTracker() {
  const { policies: records, addMany, update, remove, clear } = usePortalData();
  const { log: logActivity } = useActivity();
  const { reminderLeadDays } = useSettings();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState('');
  const searchParams = useSearchParams();
  useEffect(() => {
    const clientParam = searchParams?.get('client') || '';
    if (clientParam) setFilter(clientParam);
  }, [searchParams]);
  const [sortBy, setSortBy] = useState<'trust' | 'due' | 'amount' | null>(null);
  const [editRec, setEditRec] = useState<any>(null);
  const toaster = useToaster();

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
      // Use the new Supabase-backed upload endpoint
      const res = await fetch(`/api/ilit/upload?leadDays=${reminderLeadDays}`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const json = await res.json();
        toaster.push({
          id: Date.now().toString(),
          message: `Upload failed: ${json.error || 'Unknown error'}`,
          type: 'error'
        });
        return;
      }
      const json = await res.json();
      const inserted = json.inserted || 0;
      
      if (inserted > 0) {
        toaster.push({
          id: Date.now().toString(),
          message: `Successfully imported ${inserted} policies`,
          type: 'success'
        });
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

  const filtered = useMemo(() => {
    let list = records.slice();
    if (filter) list = list.filter(r => {
      const ilitName = (r.ilitName || '').toLowerCase();
      const insuredName = (r.insuredName || '').toLowerCase();
      const policyNum = (r.policyNumber || '').toLowerCase();
      const searchTerm = filter.toLowerCase();
      return ilitName.includes(searchTerm) || insuredName.includes(searchTerm) || policyNum.includes(searchTerm);
    });
    if (sortBy === 'trust') list.sort((a,b) => (a.ilitName || '').localeCompare(b.ilitName || ''));
    if (sortBy === 'due') list.sort((a,b) => ((a.premiumDueDate || '')).localeCompare(b.premiumDueDate || ''));
    if (sortBy === 'amount') list.sort((a,b) => (Number(b.premiumAmount||0) - Number(a.premiumAmount||0)));
    return list;
  }, [records, filter, sortBy]);

  return (
      <div className="p-6">
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">ILIT Policy Tracker</h2>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFile} className="hidden" />
            <Button onClick={() => fileRef.current?.click()}>Upload Excel</Button>
            <Button onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/template/ilit';
              link.download = 'ILIT-Template.xlsx';
              link.click();
            }}>Download Template</Button>
            <Button onClick={() => { exportCSV(records); }}>Export All CSV</Button>
            <Button onClick={() => {
                // fully clear stored data and UI state
                clear();
                logActivity('clear', 'Cleared all records');
                if (fileRef.current) fileRef.current.value = '';
                toaster.push({ id: Date.now().toString(), message: 'Cleared all records', type: 'success' });
            }}>Clear</Button>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Input placeholder="Filter by trust, insured name, or policy number" value={filter} onChange={e => setFilter(e.target.value)} />
            <select onChange={e => setSortBy((e.target.value as any) || null)} className="border rounded p-1">
              <option value="">Default</option>
              <option value="trust">Sort A–Z</option>
              <option value="due">Sort by due date</option>
              <option value="amount">Sort by amount</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <th className="p-2">ILIT Name</th>
                  <th className="p-2">Insured</th>
                  <th className="p-2">Trustees</th>
                  <th className="p-2">Policy</th>
                                    <th className="p-2">Company</th>
                                    <th className="p-2">Frequency</th>
                  <th className="p-2">Premium Due</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Gift Date</th>
                  <th className="p-2">Letter Send</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </THead>
              <TBody>
                {filtered.map(r => {
                  const displayName = r.ilitName || 'N/A';
                  return (
                    <tr key={r.id} className="border-t text-sm">
                      <td className="p-2 font-medium">{displayName}</td>
                      <td className="p-2 text-gray-700">{r.insuredName || '—'}</td>
                      <td className="p-2 text-gray-700">{r.trustees ? r.trustees.split(/[;,]/).map(t => t.trim()).join(', ') : '—'}</td>
                      <td className="p-2 text-gray-700">{r.policyNumber || '—'}</td>
                                            <td className="p-2 text-gray-700">{r.insuranceCompany || '—'}</td>
                                            <td className="p-2 text-gray-700">{r.frequency || '—'}</td>
                      <td className="p-2">{formatDateMMDD(r.premiumDueDate)}</td>
                      <td className="p-2 text-right">{r.premiumAmount ? `$${r.premiumAmount.toLocaleString()}` : '—'}</td>
                      <td className="p-2">{formatDateMMDD(r.giftDate)}</td>
                      <td className="p-2">{formatDateMMDD(r.crummeyLetterSendDate)}</td>
                      <td className="p-2">{(() => { const s = statusFor(r); return <Badge color={s.color}>{s.label}</Badge>; })()}</td>
                      <td className="p-2 flex gap-1">
                        <Button onClick={() => setEditRec(r)} className="text-xs px-2 py-1">Edit</Button>
                        <Button onClick={() => { 
                          update(r.id, { crummeyLetterSentDate: new Date().toISOString().slice(0,10), status: 'Letter Sent' });
                          logActivity('letter_sent', `Marked letter sent for ${displayName}`);
                        }} className="text-xs px-2 py-1">Sent</Button>
                      </td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>

        <Dialog open={!!editRec} onClose={() => setEditRec(null)}>
          {editRec && (
            <div className="max-w-2xl max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit {editRec.ilitName}</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Core ILIT Fields */}
                <div>
                  <label className="text-xs font-medium">ILIT Name</label>
                  <Input defaultValue={editRec.ilitName || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.ilitName || '')) {
                      update(editRec.id, { ilitName: newValue });
                      logActivity('edit', `Updated ILIT Name to ${newValue}`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Insured Name</label>
                  <Input defaultValue={editRec.insuredName || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.insuredName || '')) {
                      update(editRec.id, { insuredName: newValue });
                      logActivity('edit', `Updated Insured Name`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Trustees</label>
                  <Input defaultValue={editRec.trustees || ''} placeholder="Separate with ; or ," onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.trustees || '')) {
                      update(editRec.id, { trustees: newValue });
                      logActivity('edit', `Updated Trustees`);
                    }
                  }} />
                </div>
                {/* Policy Details */}
                <div>
                  <label className="text-xs font-medium">Policy Number</label>
                  <Input defaultValue={editRec.policyNumber || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.policyNumber || '')) {
                      update(editRec.id, { policyNumber: newValue });
                      logActivity('edit', `Updated Policy Number`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Insurance Company</label>
                  <Input defaultValue={editRec.insuranceCompany || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.insuranceCompany || '')) {
                      update(editRec.id, { insuranceCompany: newValue });
                      logActivity('edit', `Updated Insurance Company`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Payment Frequency</label>
                  <Input defaultValue={editRec.frequency || ''} placeholder="e.g., Annual, Monthly" onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.frequency || '')) {
                      update(editRec.id, { frequency: newValue });
                      logActivity('edit', `Updated Payment Frequency`);
                    }
                  }} />
                </div>
                
                {/* Dates & Amount */}
                <div>
                  <label className="text-xs font-medium">Premium Due Date</label>
                  <Input type="date" defaultValue={editRec.premiumDueDate || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.premiumDueDate || '')) {
                      update(editRec.id, { premiumDueDate: newValue });
                      logActivity('edit', `Updated Premium Due Date`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Premium Amount</label>
                  <Input type="number" defaultValue={editRec.premiumAmount || ''} onBlur={e => {
                    const newValue = Number(e.currentTarget.value) || undefined;
                    if (newValue !== editRec.premiumAmount) {
                      update(editRec.id, { premiumAmount: newValue });
                      logActivity('edit', `Updated Premium Amount`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Gift Date</label>
                  <Input type="date" defaultValue={editRec.giftDate || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.giftDate || '')) {
                      update(editRec.id, { giftDate: newValue });
                      logActivity('edit', `Updated Gift Date`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Status</label>
                  <select 
                    defaultValue={editRec.status || ''} 
                    onChange={e => {
                      const newValue = e.currentTarget.value;
                      if (newValue !== editRec.status) {
                        update(editRec.id, { status: newValue ? (newValue as any) : undefined });
                        logActivity('edit', `Updated Status to ${newValue}`);
                      }
                    }} 
                    className="border rounded p-1 w-full"
                  >
                    <option value="">Auto-Calculate</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Pending">Pending</option>
                    <option value="Due Soon">Due Soon</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Letter Sent">Letter Sent</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                
                {/* Crummey Fields */}
                <div>
                  <label className="text-xs font-medium">Crummey Letter Send Date</label>
                  <Input type="date" defaultValue={editRec.crummeyLetterSendDate || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.crummeyLetterSendDate || '')) {
                      update(editRec.id, { crummeyLetterSendDate: newValue || null });
                      logActivity('edit', `Updated Crummey Letter Send Date`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Crummey Letter Sent Date</label>
                  <Input type="date" defaultValue={editRec.crummeyLetterSentDate || ''} onBlur={e => {
                    const newValue = e.currentTarget.value;
                    if (newValue !== (editRec.crummeyLetterSentDate || '')) {
                      update(editRec.id, { crummeyLetterSentDate: newValue || null });
                      logActivity('edit', `Updated Crummey Letter Sent Date`);
                    }
                  }} />
                </div>
                <div>
                  <label className="text-xs font-medium">Crummey Sent</label>
                  <select 
                    defaultValue={editRec.crummeyLetterSentDate ? 'yes' : 'no'} 
                    onChange={e => {
                      const isYes = e.currentTarget.value === 'yes';
                      const dateValue = isYes ? new Date().toISOString().split('T')[0] : null;
                      if (isYes !== !!editRec.crummeyLetterSentDate) {
                        update(editRec.id, { crummeyLetterSentDate: dateValue });
                        logActivity('edit', `Updated Crummey Sent Status`);
                      }
                    }} 
                    className="border rounded p-1 w-full"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={() => setEditRec(null)} className="bg-gray-400">Close</Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
  );
}
