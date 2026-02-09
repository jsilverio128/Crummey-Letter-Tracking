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

function calculateCrummeyLetterSendDate(premiumDueDate: string | undefined, leadDays: number = 30): string | undefined {
  if (!premiumDueDate) return undefined;
  const due = new Date(premiumDueDate + 'T00:00:00');
  if (isNaN(due.getTime())) return undefined;
  due.setDate(due.getDate() - leadDays);
  return due.toISOString().split('T')[0];
}

function calculateGiftDate(premiumDueDate: string | undefined): string | undefined {
  if (!premiumDueDate) return undefined;
  const due = new Date(premiumDueDate + 'T00:00:00');
  if (isNaN(due.getTime())) return undefined;
  due.setDate(due.getDate() - 1);
  return due.toISOString().split('T')[0];
}

function determineStatus(record: any): PolicyStatus {
  // Compute status from dates and sent flag, do not trust incoming 'status' field
  if (record.crummeyLetterSentDate) return 'Letter Sent';

  if (!record.premiumDueDate) return 'Not Started';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(record.premiumDueDate + 'T00:00:00');
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Overdue
  if (daysUntilDue < 0) return 'Overdue';

  // If there's an explicit crummeyLetterSendDate, use it to determine "Letter Due"
  if (record.crummeyLetterSendDate) {
    const send = new Date(record.crummeyLetterSendDate + 'T00:00:00');
    if (send <= today) return 'Due Soon';
    const daysUntilSend = Math.ceil((send.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilSend <= 0) return 'Due Soon';
    if (daysUntilSend <= 7) return 'Due Soon';
  }

  // Fallback: if due within 30 days mark Pending
  if (daysUntilDue <= 30) return 'Pending';
  return 'Pending';
}

/**
 * Normalize an uploaded row to an ILITPolicyRecord with camelCase names.
 * Flexible column mapping to support various Excel formats.
 * @param row Row data from Excel (with original column names)
 * @param leadDays Days before premium due date to send Crummey letter (from settings)
 */
export function normalizeRowToRecord(row: Record<string, any>, leadDays: number = 30): ILITPolicyRecord {
  const now = new Date().toISOString();
  
  // Parse amounts
  const premium = parseAmount(row['premiumAmount'] ?? row['Premium'] ?? row['Amount'] ?? row['PremiumAmount']);
  
  // Parse dates
  const premiumDueDate = parseDate(row['premiumDueDate'] ?? row['DueDate'] ?? row['premium_date'] ?? row['PremiumDue'] ?? row['PremiumDueDate']);
  
  // Initialize with user-provided gift date, but we don't rely on it
  let giftDate = parseDate(row['giftDate'] ?? row['GiftDate'] ?? row['Gift Date']);
  // If not provided, compute it: premium_due_date - 1 day
  if (!giftDate && premiumDueDate) {
    giftDate = calculateGiftDate(premiumDueDate);
  }
  
  const crummeyLetterSentDate = parseDate(row['crummeyLetterSentDate'] ?? row['CrummeyLetterSentDate'] ?? row['LetterSentDate']);
  
  // Auto-calculate crummeyLetterSendDate if not provided, using leadDays setting
  let crummeyLetterSendDate = parseDate(row['crummeyLetterSendDate'] ?? row['CrummeyLetterSendDate'] ?? row['LetterSendDate']);
  if (!crummeyLetterSendDate && premiumDueDate) {
    crummeyLetterSendDate = calculateCrummeyLetterSendDate(premiumDueDate, leadDays);
  }
  
  // Parse trust/ILIT name (prefer ilitName, fall back to trustName)
  const ilitName = parseString(row['ilitName'] ?? row['ILIT Name'] ?? row['trustName'] ?? row['Trust'] ?? row['TrustName'] ?? '');
  
  // Build the record with only fields that exist in Supabase schema
  const record: any = {
    id: String(row['id'] ?? row['ID'] ?? 'temp-' + Math.random().toString(36).slice(2, 9)), // Temp ID, will get UUID from DB
    ilitName,
    insuredName: parseString(row['insuredName'] ?? row['InsuredName'] ?? row['Insured'] ?? row['Insured Name']),
    trustees: parseString(row['trustees'] ?? row['Trustees']),
    insuranceCompany: parseString(row['insuranceCompany'] ?? row['Company'] ?? row['InsuranceCompany']),
    policyNumber: parseString(row['policyNumber'] ?? row['PolicyNumber'] ?? row['Policy Number']),
    frequency: parseString(row['frequency'] ?? row['Frequency'] ?? row['paymentFrequency'] ?? row['PaymentFrequency']),
    premiumAmount: premium,
    premiumDueDate,
    giftDate: giftDate || null,
    crummeyLetterSendDate: crummeyLetterSendDate || null,
    crummeyLetterSentDate: crummeyLetterSentDate || null,
    createdAt: now,
    updatedAt: now
  };
  
  // Determine status after all fields are set (computed)
  record.status = determineStatus(record);
  
  return record as ILITPolicyRecord;
}

export function rowsToRecords(rows: Record<string, any>[], leadDays: number = 30) {
  return rows.map(row => normalizeRowToRecord(row, leadDays));
}
