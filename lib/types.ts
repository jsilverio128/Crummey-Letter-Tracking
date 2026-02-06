export type PolicyStatus = 'Paid' | 'Pending' | 'Letter Sent' | 'Overdue' | 'Due Soon' | 'Not Started';

export type ILITPolicyRecord = {
  id: string;
  ilitName: string; // ILIT/Trust name (main identifier)
  insuredName?: string; // Name of the insured person
  trustees?: string; // Multiple trustees separated by ; or ,
  policyName?: string; // Policy name/description
  policyNumber?: string; // Policy number
  accountNumber?: string;
  policyType?: string;
  insuranceCompany?: string;
  beneficiary?: string;
  paymentFrequency?: string;
  premiumAmount?: number;
  premiumDueDate?: string; // ISO yyyy-mm-dd
  giftDate?: string; // ISO yyyy-mm-dd (gift date for tax purposes)
  crummeyLetterSendDate?: string | null; // ISO yyyy-mm-dd (auto-calculated: premiumDueDate - 35 days)
  crummeyLetterSentDate?: string | null; // ISO yyyy-mm-dd (actual sent date)
  crummeyRequired?: boolean;
  crummeySent?: boolean; // Legacy: deprecated in favor of status
  crummeyMethod?: string;
  crummeyRecipients?: string;
  crummeyProofLink?: string;
  status?: PolicyStatus; // Current status of the policy
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

// For backwards compatibility, keep trustName as an alias
export function getTrustName(record: ILITPolicyRecord): string {
  return record.ilitName || '';
}
