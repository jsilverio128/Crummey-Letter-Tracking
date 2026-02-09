"use client";
import { useMemo } from 'react';
import { useILITData } from './use-ilit-data';
import { useSettings } from './use-settings';
import { ILITPolicyRecord, PolicyStatus } from '../lib/types';

/** Client view: grouped by insuredName */
export type ClientSummary = {
  insuredName: string;
  policyCount: number;
  totalPremium?: number;
  upcomingPremiums: ILITPolicyRecord[];
  pendingLetters: ILITPolicyRecord[];
};

/** Reminder view: policies due for action */
export type ReminderItem = {
  type: 'letter' | 'premium';
  policy: ILITPolicyRecord;
  daysUntilAction: number;
  actionDate: string;
};

/** Crummey letter view: policies with Crummey action needed */
export type LetterItem = {
  status: 'pending' | 'sent';
  policy: ILITPolicyRecord;
  daysUntilDue?: number;
};

/** Dashboard statistics */
export type DashboardStats = {
  totalPolicies: number;
  totalOutstandingPremiums: number;
  premiumsDue30Days: number;
  premiumsDue60Days: number;
  lettersToSend: number;
  lettersSent: number;
  overduePolicies: number;
};

export function usePortalData() {
  const { records, update, addMany, remove, clear } = useILITData();
  const { reminderLeadDays } = useSettings();

  // === DERIVED: Clients (group by insuredName) ===
  const clients = useMemo(() => {
    const grouped = new Map<string, ILITPolicyRecord[]>();
    
    records.forEach(policy => {
      const clientName = policy.insuredName || 'Unknown';
      if (!grouped.has(clientName)) {
        grouped.set(clientName, []);
      }
      grouped.get(clientName)!.push(policy);
    });

    const result: ClientSummary[] = Array.from(grouped.entries()).map(
      ([insuredName, policies]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingPremiums = policies.filter(p => {
          if (!p.premiumDueDate) return false;
          const due = new Date(p.premiumDueDate + 'T00:00:00');
          const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil >= 0 && daysUntil <= 60;
        });

        const pendingLetters = policies.filter(p => {
          if (p.crummeyLetterSentDate) return false; // Already sent
          if (!p.crummeyLetterSendDate) return false;
          const send = new Date(p.crummeyLetterSendDate + 'T00:00:00');
          return send <= today;
        });

        return {
          insuredName,
          policyCount: policies.length,
          totalPremium: policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0),
          upcomingPremiums,
          pendingLetters
        };
      }
    );

    return result.sort((a, b) => a.insuredName.localeCompare(b.insuredName));
  }, [records]);

  // === DERIVED: Reminders (based on lead time and dates) ===
  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const items: ReminderItem[] = [];

    records.forEach(policy => {
      // Crummey letter reminders
      if (policy.crummeyLetterSendDate && !policy.crummeyLetterSentDate) {
        const sendDate = new Date(policy.crummeyLetterSendDate + 'T00:00:00');
        const daysUntil = Math.ceil((sendDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 30) { // Show upcoming reminders
          items.push({
            type: 'letter',
            policy,
            daysUntilAction: Math.max(0, daysUntil),
            actionDate: policy.crummeyLetterSendDate
          });
        }
      }

      // Premium due reminders
      if (policy.premiumDueDate) {
        const dueDate = new Date(policy.premiumDueDate + 'T00:00:00');
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 60) {
          items.push({
            type: 'premium',
            policy,
            daysUntilAction: daysUntil,
            actionDate: policy.premiumDueDate
          });
        }
      }
    });

    return items.sort((a, b) => a.daysUntilAction - b.daysUntilAction);
  }, [records]);

  // === DERIVED: Crummey Letters (pending + sent) ===
  const letters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: LetterItem[] = records
      .filter(p => p.crummeyLetterSendDate) // Only policies with a send date
      .map(policy => {
        const sendDate = new Date(policy.crummeyLetterSendDate! + 'T00:00:00');
        const daysUntil = Math.ceil((sendDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          status: (policy.crummeyLetterSentDate ? 'sent' : 'pending') as LetterItem['status'],
          policy,
          daysUntilDue: daysUntil > 0 ? daysUntil : 0
        };
      })
      .sort((a, b) => {
        // Pending first, then by due date
        if (a.status !== b.status) {
          return a.status === 'pending' ? -1 : 1;
        }
        return (a.daysUntilDue || 0) - (b.daysUntilDue || 0);
      });

    return result;
  }, [records]);

  // === DERIVED: Dashboard Stats ===
  const dashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalOutstandingPremiums = 0;
    let premiumsDue30Days = 0;
    let premiumsDue60Days = 0;
    let lettersToSend = 0;
    let lettersSent = 0;
    let overduePolicies = 0;

    records.forEach(policy => {
      // Count premiums
      if (policy.premiumAmount) {
        totalOutstandingPremiums += policy.premiumAmount;
      }

      // Count premiums due soon
      if (policy.premiumDueDate) {
        const dueDate = new Date(policy.premiumDueDate + 'T00:00:00');
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
          overduePolicies++;
        } else if (daysUntil <= 30) {
          premiumsDue30Days++;
        } else if (daysUntil <= 60) {
          premiumsDue60Days++;
        }
      }

      // Count letters
      if (policy.crummeyLetterSendDate) {
        if (policy.crummeyLetterSentDate) {
          lettersSent++;
        } else {
          const sendDate = new Date(policy.crummeyLetterSendDate + 'T00:00:00');
          if (sendDate <= today) {
            lettersToSend++;
          }
        }
      }
    });

    return {
      totalPolicies: records.length,
      totalOutstandingPremiums,
      premiumsDue30Days,
      premiumsDue60Days,
      lettersToSend,
      lettersSent,
      overduePolicies
    };
  }, [records]);

  return {
    // Raw data
    policies: records,
    
    // CRUD operations
    update,
    addMany,
    remove,
    clear,
    
    // Derived views
    clients,
    reminders,
    letters,
    dashboardStats,
    
    // Settings
    reminderLeadDays
  };
}
