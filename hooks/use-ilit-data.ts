"use client";
import { useEffect, useState, useCallback } from 'react';
import { ILITPolicyRecord } from '../lib/types';

/**
 * Custom hook to fetch and manage ILIT policies from Supabase backend.
 * Provides real-time access to policy data across the entire app.
 */
export function useILITData() {
  const [records, setRecords] = useState<ILITPolicyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch policies from API
  const fetchPolicies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/ilit/policies/get');
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }
      const data = await response.json();
      const policies = data.policies || [];
      setRecords(Array.isArray(policies) ? policies : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch policies:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Update a single policy
  const update = useCallback(async (id: string, updates: Partial<ILITPolicyRecord>) => {
    try {
      const response = await fetch(`/api/ilit/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error('Failed to update policy');
      }
      const updated = await response.json();
      setRecords(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err) {
      console.error('Failed to update policy:', err);
      throw err;
    }
  }, []);

  // Add multiple policies (used after upload)
  const addMany = useCallback(async (newRecords: ILITPolicyRecord[]) => {
    // After upload, refresh the list to get the newly inserted records from the server
    await fetchPolicies();
  }, [fetchPolicies]);

  // Remove a policy
  const remove = useCallback(async (id: string) => {
    await fetchPolicies();
  }, [fetchPolicies]);

  // Clear all policies
  const clear = useCallback(async () => {
    await fetchPolicies();
  }, [fetchPolicies]);

  return {
    records,
    isLoading,
    error,
    update,
    addMany,
    remove,
    clear,
    refresh: fetchPolicies
  };
}
