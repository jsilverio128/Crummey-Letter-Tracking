"use client";
import React, { useMemo, useRef, useState } from 'react';
import { useILITData } from '../hooks/use-ilit-data';
import { ColumnMappingDialog } from './column-mapping-dialog';
import { rowsToRecords } from '../lib/parse-utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Table, THead, TBody } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { useToaster } from './ui/toaster';

function statusFor(record: any) {
  const today = new Date();
  if (record.crummeySent) return { label: 'Sent', color: 'green' };
  if (!record.premiumDueDate) return { label: 'Pending', color: 'blue' };
  const due = new Date(record.premiumDueDate + 'T00:00:00');
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Overdue', color: 'red' };
  if (diff <= 7) return { label: 'Due Soon', color: 'orange' };
  if (diff <= 35) return { label: 'Letter Due', color: 'yellow' };
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
  const { records, addMany, update, remove, replaceAll, clear } = useILITData();
  const [mappingOpen, setMappingOpen] = useState(false);
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'trust' | 'due' | 'amount' | null>(null);
  const [editRec, setEditRec] = useState<any>(null);
  const toaster = useToaster();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.xlsx')) {
      // reject .xls and other types
      toaster.push({ id: Date.now().toString(), message: 'Please upload .xlsx files only', type: 'error' });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const form = new FormData();
    form.append('file', f);
    try {
      const res = await fetch('/api/upload-excel', { method: 'POST', body: form });
      if (!res.ok) {
        const txt = await res.text();
        toaster.push({ id: Date.now().toString(), message: 'Upload failed: ' + txt, type: 'error' });
        return;
      }
      const json = await res.json();
      const rows = (json.rawData ?? []) as Record<string, any>[];
      setSampleRows(rows.slice(0, 10));
      setMappingOpen(true);
    } catch (err) {
      toaster.push({ id: Date.now().toString(), message: 'Upload failed', type: 'error' });
    }
  }

  function handleImport(mappedRows: Record<string, any>[]) {
    try {
      const records = rowsToRecords(mappedRows);
      addMany(records);
      // reset file input so same filename can be selected again
      if (fileRef.current) fileRef.current.value = '';
      toaster.push({ id: Date.now().toString(), message: 'Imported ' + records.length + ' records', type: 'success' });
    } catch (e) {
      toaster.push({ id: Date.now().toString(), message: 'Import failed', type: 'error' });
    }
  }

  const filtered = useMemo(() => {
    let list = records.slice();
    if (filter) list = list.filter(r => (r.trustName || '').toLowerCase().includes(filter.toLowerCase()));
    if (sortBy === 'trust') list.sort((a,b) => (a.trustName || '').localeCompare(b.trustName || ''));
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
            <Button onClick={() => { exportCSV(records); }}>Export All CSV</Button>
            <Button onClick={() => {
                // fully clear stored data and UI state
                clear();
                if (fileRef.current) fileRef.current.value = '';
                toaster.push({ id: Date.now().toString(), message: 'Cleared all records', type: 'success' });
            }}>Clear</Button>
          </div>
        </div>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Input placeholder="Filter by trust name" value={filter} onChange={e => setFilter(e.target.value)} />
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
                  <th className="p-2">Trust</th>
                  <th className="p-2">Premium Due</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Crummey</th>
                  <th className="p-2">Actions</th>
                </tr>
              </THead>
              <TBody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.trustName}</td>
                    <td className="p-2">{formatDateMMDD(r.premiumDueDate)}</td>
                    <td className="p-2">{r.premiumAmount ?? '—'}</td>
                    <td className="p-2">{(() => { const s = statusFor(r); return <Badge color={s.color}>{s.label}</Badge>; })()}</td>
                    <td className="p-2 flex gap-2">
                      <Button onClick={() => setEditRec(r)}>Edit</Button>
                      <Button onClick={() => { update(r.id, { crummeySent: true, crummeyLetterSendDate: new Date().toISOString().slice(0,10) }); }}>Mark Sent</Button>
                      
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        <ColumnMappingDialog open={mappingOpen} sampleRows={sampleRows} onClose={() => setMappingOpen(false)} onImport={handleImport} />

        <Dialog open={!!editRec} onClose={() => setEditRec(null)}>
          {editRec && (
            <div>
              <h3 className="text-lg font-semibold">Edit {editRec.trustName}</h3>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <label className="text-xs">Trust Name</label>
                  <Input defaultValue={editRec.trustName} onBlur={e => update(editRec.id, { trustName: e.currentTarget.value })} />
                </div>
                <div>
                  <label className="text-xs">Premium Due</label>
                  <Input type="date" defaultValue={editRec.premiumDueDate} onBlur={e => update(editRec.id, { premiumDueDate: e.currentTarget.value })} />
                </div>
                <div>
                  <label className="text-xs">Amount</label>
                  <Input type="number" defaultValue={editRec.premiumAmount} onBlur={e => update(editRec.id, { premiumAmount: Number(e.currentTarget.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs">Crummey Sent</label>
                  <select defaultValue={editRec.crummeySent ? 'yes' : 'no'} onChange={e => update(editRec.id, { crummeySent: e.currentTarget.value === 'yes' })} className="border rounded p-1">
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
