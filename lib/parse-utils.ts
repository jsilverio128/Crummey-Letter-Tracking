import { ILITPolicyRecord } from './types';

export function normalizeRowToRecord(row: Record<string, any>): ILITPolicyRecord {
  const now = new Date().toISOString();
  const premium = parseFloat((row['premiumAmount'] ?? row['Premium'] ?? row['Amount'] ?? 0) as any) || undefined;
  const dateCell = row['premiumDueDate'] ?? row['DueDate'] ?? row['premium_date'] ?? row['PremiumDue'] ?? null;
  let isoDate: string | undefined = undefined;
  if (dateCell) {
    const d = new Date(dateCell);
    if (!isNaN(d.getTime())) {
      isoDate = d.toISOString().slice(0, 10);
    }
  }

  return {
    id: String(row['id'] ?? row['ID'] ?? Math.random().toString(36).slice(2, 9)),
    trustName: String(row['trustName'] ?? row['Trust'] ?? row['TrustName'] ?? '') || '',
    accountNumber: String(row['accountNumber'] ?? row['Account'] ?? ''),
    policyNumber: String(row['policyNumber'] ?? row['PolicyNumber'] ?? ''),
    policyType: String(row['policyType'] ?? row['PolicyType'] ?? ''),
    insuranceCompany: String(row['insuranceCompany'] ?? row['Company'] ?? ''),
    beneficiary: String(row['beneficiary'] ?? row['Beneficiary'] ?? ''),
    trustees: String(row['trustees'] ?? row['Trustees'] ?? ''),
    paymentFrequency: String(row['paymentFrequency'] ?? row['Frequency'] ?? ''),
    premiumAmount: premium,
    premiumDueDate: isoDate,
    crummeyRequired: row['crummeyRequired'] === undefined ? true : Boolean(row['crummeyRequired']),
    crummeySent: Boolean(row['crummeySent'] ?? false),
    crummeyLetterSendDate: row['crummeyLetterSendDate'] ?? null,
    crummeyMethod: row['crummeyMethod'] ?? '',
    crummeyRecipients: row['crummeyRecipients'] ?? '',
    crummeyProofLink: row['crummeyProofLink'] ?? '',
    notes: row['notes'] ?? '',
    createdAt: now,
    updatedAt: now
  };
}

export function rowsToRecords(rows: Record<string, any>[]) {
  return rows.map(normalizeRowToRecord);
}
