import { ILITPolicyRecord } from './types';

const STORAGE_KEY = 'ilit_policies_v1';

export function saveAll(records: ILITPolicyRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadAll(): ILITPolicyRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ILITPolicyRecord[];
  } catch (e) {
    console.error('failed to load ILIT records', e);
    return [];
  }
}

export function clearAll() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
