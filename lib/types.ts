export type ILITPolicyRecord = {
  id: string;
  trustName: string;
  accountNumber?: string;
  policyNumber?: string;
  policyType?: string;
  insuranceCompany?: string;
  beneficiary?: string;
  trustees?: string;
  paymentFrequency?: string;
  premiumAmount?: number;
  premiumDueDate?: string; // ISO yyyy-mm-dd
  crummeyRequired?: boolean;
  crummeySent?: boolean;
  crummeyLetterSendDate?: string | null;
  crummeyMethod?: string;
  crummeyRecipients?: string;
  crummeyProofLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
