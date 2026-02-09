export type PolicyStatus = 'Paid' | 'Pending' | 'Letter Sent' | 'Overdue' | 'Due Soon' | 'Not Started';

/**
 * ILITPolicyRecord is the main internal type used throughout the app (camelCase).
 * Gets converted to/from Supabase snake_case format at API boundaries.
 */
export type ILITPolicyRecord = {
  id: string;
  ilitName: string; // ILIT/Trust name (main identifier)
  insuredName?: string; // Name of the insured person
  trustees?: string; // Multiple trustees separated by ; or ,
  insuranceCompany?: string;
  policyNumber?: string; // Policy number
  premiumDueDate?: string; // ISO yyyy-mm-dd
  premiumAmount?: number;
  frequency?: string; // Payment frequency
  giftDate?: string; // ISO yyyy-mm-dd (computed: premium_due_date - 1 day)
  crummeyLetterSendDate?: string | null; // ISO yyyy-mm-dd (computed: premium_due_date - reminder_days_before)
  crummeyLetterSentDate?: string | null; // ISO yyyy-mm-dd (actual sent date, user-set)
  status?: PolicyStatus; // Current status of the policy (computed)
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Supabase database schema type (snake_case).
 * Used only for database I/O operations.
 */
export type SupabaseILITPolicy = {
  id: string;
  ilit_name: string;
  insured_name?: string;
  trustees?: string;
  insurance_company?: string;
  policy_number?: string;
  premium_due_date?: string;
  premium_amount?: number;
  frequency?: string;
  gift_date?: string;
  crummey_letter_send_date?: string | null;
  crummey_letter_sent_date?: string | null;
  status?: PolicyStatus;
  created_at?: string;
  updated_at?: string;
};

/**
 * AppSettings type for database.
 */
export type AppSettings = {
  reminder_days_before: number; // min 1
  created_at?: string;
  updated_at?: string;
};

// Conversion helpers
export function snakeToCamel(obj: SupabaseILITPolicy): ILITPolicyRecord {
  return {
    id: obj.id,
    ilitName: obj.ilit_name,
    insuredName: obj.insured_name,
    trustees: obj.trustees,
    insuranceCompany: obj.insurance_company,
    policyNumber: obj.policy_number,
    premiumDueDate: obj.premium_due_date,
    premiumAmount: obj.premium_amount,
    frequency: obj.frequency,
    giftDate: obj.gift_date,
    crummeyLetterSendDate: obj.crummey_letter_send_date,
    crummeyLetterSentDate: obj.crummey_letter_sent_date,
    status: obj.status,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  };
}

export function camelToSnake(obj: ILITPolicyRecord): SupabaseILITPolicy {
  return {
    id: obj.id,
    ilit_name: obj.ilitName,
    insured_name: obj.insuredName,
    trustees: obj.trustees,
    insurance_company: obj.insuranceCompany,
    policy_number: obj.policyNumber,
    premium_due_date: obj.premiumDueDate,
    premium_amount: obj.premiumAmount,
    frequency: obj.frequency,
    gift_date: obj.giftDate,
    crummey_letter_send_date: obj.crummeyLetterSendDate,
    crummey_letter_sent_date: obj.crummeyLetterSentDate,
    status: obj.status,
    created_at: obj.createdAt,
    updated_at: obj.updatedAt,
  };
}

// For backwards compatibility
export function getTrustName(record: ILITPolicyRecord): string {
  return record.ilitName || '';
}
