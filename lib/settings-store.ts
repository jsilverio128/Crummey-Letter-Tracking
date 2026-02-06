export type AppSettings = {
  reminderLeadDays: number; // days before premium due date to send crummey letter
};

const SETTINGS_KEY = 'ilit_settings_v1';
const DEFAULT_SETTINGS: AppSettings = {
  reminderLeadDays: 35,
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('failed to load settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getReminderLeadDays(): number {
  return getSettings().reminderLeadDays;
}

export function setReminderLeadDays(days: number) {
  const settings = getSettings();
  saveSettings({ ...settings, reminderLeadDays: Math.max(1, days) });
}
