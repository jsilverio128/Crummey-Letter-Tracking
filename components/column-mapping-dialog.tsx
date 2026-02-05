"use client";
import React, { useMemo, useState } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

type MappingDialogProps = {
  open: boolean;
  sampleRows: Record<string, any>[];
  onClose: () => void;
  onImport: (mappedRows: Record<string, any>[]) => void;
};

const DEFAULT_FIELDS = [
  'trustName',
  'accountNumber',
  'policyNumber',
  'policyType',
  'insuranceCompany',
  'beneficiary',
  'trustees',
  'paymentFrequency',
  'premiumAmount',
  'premiumDueDate',
  'notes'
];

export function ColumnMappingDialog({ open, sampleRows, onClose, onImport }: MappingDialogProps) {
  const headers = useMemo(() => {
    const set = new Set<string>();
    sampleRows.forEach(r => Object.keys(r).forEach(k => set.add(k)));
    return Array.from(set);
  }, [sampleRows]);

  const [map, setMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    DEFAULT_FIELDS.forEach(f => (m[f] = ''));
    return m;
  });

  function handleImport() {
    // create mapped rows
    const mapped = sampleRows.map(r => {
      const out: Record<string, any> = {};
      Object.entries(map).forEach(([target, source]) => {
        out[target] = source && r[source] !== undefined ? r[source] : undefined;
      });
      return out;
    });
    onImport(mapped);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <h3 className="text-lg font-semibold">Map Columns</h3>
      <p className="text-sm text-gray-600">Map your spreadsheet columns to the ILIT fields.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {DEFAULT_FIELDS.map(field => (
          <div key={field}>
            <label className="text-xs font-medium">{field}</label>
            <select
              value={map[field]}
              onChange={e => setMap(s => ({ ...s, [field]: e.target.value }))}
              className="w-full border rounded p-1"
            >
              <option value="">--</option>
              {headers.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Sample: {String(sampleRows[0]?.[map[field]] ?? '')}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose} className="bg-gray-400">Cancel</Button>
        <Button onClick={handleImport}>Import</Button>
      </div>
    </Dialog>
  );
}
