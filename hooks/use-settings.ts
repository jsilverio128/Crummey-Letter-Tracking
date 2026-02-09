"use client";
import { useEffect, useState, useCallback } from 'react';

const DEFAULT_REMINDER_DAYS = 30;

/**
 * Custom hook to fetch and manage app settings from Supabase backend.
 */
export function useSettings() {
  const [reminderLeadDays, setReminderLeadDays] = useState(DEFAULT_REMINDER_DAYS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings/reminder-days');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setReminderLeadDays(data.reminder_days_before || DEFAULT_REMINDER_DAYS);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Use default on error
      setReminderLeadDays(DEFAULT_REMINDER_DAYS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update reminder lead days
  const updateReminderLeadDays = useCallback(async (days: number) => {
    try {
      // Validate
      days = Math.max(1, Math.floor(days));
      
      const response = await fetch('/api/settings/reminder-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_days_before: days })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setReminderLeadDays(data.reminder_days_before || days);

      // Optionally recalculate crummey dates for existing policies
      await fetch(`/api/settings/recalculate?reminderDaysBefore=${days}`, {
        method: 'POST'
      }).catch(() => {
        // Failure is not critical
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  return {
    reminderLeadDays,
    isLoaded,
    error,
    updateReminderLeadDays,
    refresh: fetchSettings
  };
}
