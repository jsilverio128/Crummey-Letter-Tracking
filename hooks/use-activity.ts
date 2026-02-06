"use client";
import { useEffect, useState } from 'react';
import { ActivityEvent, logActivity, getActivity, getRecentActivity } from '../lib/activity-store';

export function useActivity() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setActivities(getActivity());
  }, []);

  function log(type: ActivityEvent['type'], description: string) {
    logActivity(type, description);
    // Update local state to reflect the new activity
    setActivities(prev => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        description
      },
      ...prev
    ].slice(0, 10));
  }

  function getRecent(count: number = 10): ActivityEvent[] {
    return getRecentActivity(count);
  }

  return { activities, log, getRecent };
}
