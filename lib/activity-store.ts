export type ActivityEvent = {
  id: string;
  timestamp: string; // ISO string
  type: 'import' | 'clear' | 'letter_sent' | 'edit' | 'delete' | 'upload';
  description: string;
};

const ACTIVITY_KEY = 'ilit_activity_log_v1';
const MAX_ACTIVITIES = 50; // Store up to 50, show 10 most recent

export function logActivity(type: ActivityEvent['type'], description: string) {
  if (typeof window === 'undefined') return;
  
  const events = getActivity();
  const newEvent: ActivityEvent = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type,
    description
  };
  
  const updated = [newEvent, ...events].slice(0, MAX_ACTIVITIES);
  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(updated));
}

export function getActivity(): ActivityEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityEvent[];
  } catch (e) {
    console.error('failed to load activity log', e);
    return [];
  }
}

export function getRecentActivity(count: number = 10): ActivityEvent[] {
  return getActivity().slice(0, count);
}

export function clearActivity() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVITY_KEY);
}
