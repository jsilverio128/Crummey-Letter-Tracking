export type ILITPolicyRecord = {
  id: string
  trustName: string
  accountNumber?: string
  beneficiary?: string
  trustees?: string
  policyNumber?: string
  policyType?: string
  insuranceCompany?: string
  paymentFrequency?:
    | "Monthly"
    | "Quarterly"
    | "Semi-Annual"
    | "Annual"
    | "Other"
    | string
  premiumAmount?: number
  premiumDueDate?: string
  crummeyRequired?: boolean
  crummeySent?: boolean
  crummeyLetterSendDate?: string
  crummeyMethod?: "Mail" | "Email" | "Portal" | "Other" | string
  crummeyRecipients?: string
  crummeyProofLink?: string
  notes?: string
  statusOverride?: string
  updatedAt: string
  createdAt: string
}

export type ILITDataStore = {
  ilits: ILITPolicyRecord[]
}
