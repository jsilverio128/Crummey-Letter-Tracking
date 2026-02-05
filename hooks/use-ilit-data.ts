"use client";
import { useEffect, useState } from 'react';
import { ILITPolicyRecord } from '../lib/types';
import * as store from '../lib/data-store';

export function useILITData() {
  const [records, setRecords] = useState<ILITPolicyRecord[]>([]);

  useEffect(() => {
    setRecords(store.loadAll());
  }, []);

  useEffect(() => {
    store.saveAll(records);
  }, [records]);

  function addMany(newRecords: ILITPolicyRecord[]) {
    setRecords(prev => {
      const merged = [...newRecords, ...prev];
      return merged;
    });
  }

  function update(id: string, patch: Partial<ILITPolicyRecord>) {
    setRecords(prev => prev.map(r => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)));
  }

  function remove(id: string) {
    setRecords(prev => prev.filter(r => r.id !== id));
  }

  function replaceAll(next: ILITPolicyRecord[]) {
    setRecords(next);
  }

  function clear() {
    store.clearAll();
    setRecords([]);
  }

  return { records, addMany, update, remove, replaceAll, clear };
}
