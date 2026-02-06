import { ILITPolicyRecord, PolicyStatus } from './types';

function parseDate(dateCell: any): string | undefined {
  if (!dateCell) return undefined;
  
  let date: Date | null = null;
  
  // Handle Excel serial date numbers
  if (typeof dateCell === 'number') {
    const excelEpoch = new Date(1900, 0, 1).getTime();
    const msPerDay = 24 * 60 * 60 * 1000;
    date = new Date(excelEpoch + dateCell * msPerDay);
  } else {
    date = new Date(String(dateCell));
  }
  
  // Validate the date
  if (!date || isNaN(date.getTime())) return undefined;
  
  // Return ISO date string (yyyy-mm-dd)
  return date.toISOString().split('T')[0];
}

function parseAmount(amountCell: any): number | undefined {
  if (!amountCell && amountCell !== 0) return undefined;
  const num = parseFloat(String(amountCell).replace(/[$,]/g, ''));
  return isNaN(num) ? undefined : num;
}

function parseString(value: any): string {
  return String(value ?? '').trim();
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  const str = String(value).toLowerCase().trim();
  return str === 'true' || str === 'yes' || str === '1';
}

function calculateCrummeyLetterSendDate(premiumDueDate: string | undefined, leadDays: number = 35): string | undefined {
  if (!premiumDueDate) return undefined;
  const due = new Date(premiumDueDate + 'T00:00:00');
  if (isNaN(due.getTime())) return undefined;
  due.setDate(due.getDate() - leadDays);
  return due.toISOString().split('T')[0];
}

function determineStatus(record: any): PolicyStatus {
  // If explicitly set, use it
  if (record.status) return record.status;
  
  // Legacy: infer from crummeySent
  if (record.crummeySent) return 'Letter Sent';
  
  // Infer from premium due date
  if (!record.premiumDueDate) return 'Not Started';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(record.premiumDueDate + 'T00:00:00');
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue < 0) return 'Overdue';
  if (daysUntilDue <= 7) return 'Due Soon';
  if (daysUntilDue <= 35) return 'Pending';
  
  return 'Pending';
}

export function normalizeRowToRecord(row: Record<string, any>, leadDays: number = 35): ILITPolicyRecord {
  const now = new Date().toISOString();
  
  // Parse amounts
  const premium = parseAmount(row['premiumAmount'] ?? row['Premium'] ?? row['Amount'] ?? row['PremiumAmount']);
  
  // Parse dates
  const premiumDueDate = parseDate(row['premiumDueDate'] ?? row['DueDate'] ?? row['premium_date'] ?? row['PremiumDue'] ?? row['PremiumDueDate']);
  const giftDate = parseDate(row['giftDate'] ?? row['GiftDate'] ?? row['Gift Date']);
  const crummeyLetterSentDate = parseDate(row['crummeyLetterSentDate'] ?? row['CrummeyLetterSentDate'] ?? row['LetterSentDate']);
  
  // Auto-calculate crummeyLetterSendDate if not provided, using leadDays setting
  let crummeyLetterSendDate = parseDate(row['crummeyLetterSendDate'] ?? row['CrummeyLetterSendDate'] ?? row['LetterSendDate']);
  if (!crummeyLetterSendDate && premiumDueDate) {
    crummeyLetterSendDate = calculateCrummeyLetterSendDate(premiumDueDate, leadDays);
  }
  
  // Parse trust/ILIT name (prefer ilitName, fall back to trustName)
  const ilitName = parseString(row['ilitName'] ?? row['ILIT Name'] ?? row['trustName'] ?? row['Trust'] ?? row['TrustName'] ?? '');
  
  // Build the record
  const record: any = {
    id: String(row['id'] ?? row['ID'] ?? Math.random().toString(36).slice(2, 9)),
    ilitName,
    insuredName: parseString(row['insuredName'] ?? row['InsuredName'] ?? row['Insured'] ?? row['Insured Name']),
    trustees: parseString(row['trustees'] ?? row['Trustees']),
    policyName: parseString(row['policyName'] ?? row['PolicyName'] ?? row['Policy Name']),
    policyNumber: parseString(row['policyNumber'] ?? row['PolicyNumber'] ?? row['Policy Number']),
    accountNumber: parseString(row['accountNumber'] ?? row['Account'] ?? row['AccountNumber']),
    policyType: parseString(row['policyType'] ?? row['PolicyType'] ?? row['Policy Type']),
    insuranceCompany: parseString(row['insuranceCompany'] ?? row['Company'] ?? row['InsuranceCompany']),
    beneficiary: parseString(row['beneficiary'] ?? row['Beneficiary']),
    paymentFrequency: parseString(row['paymentFrequency'] ?? row['Frequency'] ?? row['PaymentFrequency']),
    premiumAmount: premium,
    premiumDueDate,
    giftDate,
    crummeyLetterSendDate: crummeyLetterSendDate || null,
    crummeyLetterSentDate: crummeyLetterSentDate || null,
    crummeyRequired: row['crummeyRequired'] === undefined ? true : parseBoolean(row['crummeyRequired']),
    crummeySent: parseBoolean(row['crummeySent'] ?? false),
    crummeyMethod: parseString(row['crummeyMethod'] ?? row['CrummeyMethod'] ?? row['Method']),
    crummeyRecipients: parseString(row['crummeyRecipients'] ?? row['Recipients']),
    crummeyProofLink: parseString(row['crummeyProofLink'] ?? row['ProofLink'] ?? row['Proof']),
    notes: parseString(row['notes'] ?? row['Notes']),
    createdAt: now,
    updatedAt: now
  };
  
  // Determine status after all fields are set
  record.status = parseString(row['status'] ?? row['Status']) || determineStatus(record);
  
  return record as ILITPolicyRecord;
}

export function rowsToRecords(rows: Record<string, any>[], leadDays: number = 35) {
  return rows.map(row => normalizeRowToRecord(row, leadDays));
}
