"use client";
import { useEffect, useState } from 'react';
import { AppSettings, getSettings, saveSettings, getReminderLeadDays, setReminderLeadDays } from '../lib/settings-store';

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSettingsState(getSettings());
    setIsLoaded(true);
  }, []);

  function updateSettings(newSettings: AppSettings) {
    saveSettings(newSettings);
    setSettingsState(newSettings);
  }

  function updateReminderLeadDays(days: number) {
    setReminderLeadDays(days);
    setSettingsState(getSettings());
  }

  return {
    settings: settings || getSettings(),
    isLoaded,
    updateSettings,
    updateReminderLeadDays,
    reminderLeadDays: getReminderLeadDays(),
  };
}
