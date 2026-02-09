"use client";
import { useEffect, useState } from 'react';
import { ILITPolicyRecord } from '../lib/types';
import * as store from '../lib/data-store';

export function useILITData() {
  const [records, setRecords] = useState<ILITPolicyRecord[]>([]);

  useEffect(() => {
    setRecords(store.loadAll());

    function onUpdate() {
      try {
        const next = store.loadAll();
        setRecords(prev => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
          } catch (e) {}
          return next;
        });
      } catch (e) {}
    }

    // listen for custom events when other parts of app update the store
    window.addEventListener('ilit-data-updated', onUpdate as any);
    // also listen for storage events (cross-tab)
    window.addEventListener('storage', onUpdate as any);

    return () => {
      window.removeEventListener('ilit-data-updated', onUpdate as any);
      window.removeEventListener('storage', onUpdate as any);
    };
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
