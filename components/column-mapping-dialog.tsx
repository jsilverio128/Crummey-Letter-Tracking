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

const FIELD_GROUPS = {
  'Core ILIT Information': [
    'ilitName',
    'insuredName',
    'trustees',
  ],
  'Policy Details': [
    'policyNumber',
    'insuranceCompany',
    'frequency',
  ],
  'Dates & Amount': [
    'premiumDueDate',
    'premiumAmount',
  ],
};

const REQUIRED_FIELDS = ['ilitName'];

export function ColumnMappingDialog({ open, sampleRows, onClose, onImport }: MappingDialogProps) {
  const headers = useMemo(() => {
    const set = new Set<string>();
    sampleRows.forEach(r => Object.keys(r).forEach(k => set.add(k)));
    return Array.from(set);
  }, [sampleRows]);

  const [map, setMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    Object.values(FIELD_GROUPS).flat().forEach(f => (m[f] = ''));
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
      <h3 className="text-lg font-semibold">Map Columns to ILIT Fields</h3>
      <p className="text-sm text-gray-600 mb-4">Select which spreadsheet column maps to each field. Leave blank to skip.</p>
      
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => (
          <div key={groupName}>
            <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">{groupName}</h4>
            <div className="grid grid-cols-2 gap-2 pl-3">
              {fields.map(field => (
                <div key={field}>
                  <label className="text-xs font-medium flex items-center gap-1">
                    {field}
                    {REQUIRED_FIELDS.includes(field) && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={map[field]}
                    onChange={e => setMap(s => ({ ...s, [field]: e.target.value }))}
                    className="w-full border rounded p-1 text-xs"
                  >
                    <option value="">-- Skip --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {map[field] && sampleRows[0] && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      Preview: {String(sampleRows[0][map[field]] ?? '').slice(0, 30)}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
