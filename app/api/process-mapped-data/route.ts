import { NextResponse } from "next/server"

import {
  normalizeOptionalString,
  parseAmount,
  parseBoolean,
  parseExcelDate,
} from "@/lib/parse-utils"
import type { ILITPolicyRecord } from "@/lib/types"

type MappingPayload = Record<string, string>

const getMappedValue = (
  row: Record<string, unknown>,
  mapping: MappingPayload,
  field: string
) => {
  const header = mapping[field]
  if (!header) return undefined
  return row[header]
}

const nowIso = () => new Date().toISOString()

export async function POST(request: Request) {
  const body = (await request.json()) as {
    rawData: Record<string, unknown>[]
    mapping: MappingPayload
  }

  if (!body?.rawData || !Array.isArray(body.rawData)) {
    return NextResponse.json({ error: "Missing raw data." }, { status: 400 })
  }

  const { rawData, mapping } = body

  const records: ILITPolicyRecord[] = rawData.map((row) => {
    const trustName =
      normalizeOptionalString(getMappedValue(row, mapping, "trustName")) ??
      "Unknown Trust"

    const premiumDueDate = parseExcelDate(
      getMappedValue(row, mapping, "premiumDueDate")
    )
    const premiumAmount = parseAmount(
      getMappedValue(row, mapping, "premiumAmount")
    )

    const crummeySent = parseBoolean(
      getMappedValue(row, mapping, "crummeySent")
    )
    const crummeyRequired =
      parseBoolean(getMappedValue(row, mapping, "crummeyRequired")) ?? true

    const now = nowIso()

    return {
      id: crypto.randomUUID(),
      trustName,
      accountNumber: normalizeOptionalString(
        getMappedValue(row, mapping, "accountNumber")
      ),
      beneficiary: normalizeOptionalString(
        getMappedValue(row, mapping, "beneficiary")
      ),
      trustees: normalizeOptionalString(
        getMappedValue(row, mapping, "trustees")
      ),
      policyNumber: normalizeOptionalString(
        getMappedValue(row, mapping, "policyNumber")
      ),
      policyType: normalizeOptionalString(
        getMappedValue(row, mapping, "policyType")
      ),
      insuranceCompany: normalizeOptionalString(
        getMappedValue(row, mapping, "insuranceCompany")
      ),
      paymentFrequency: normalizeOptionalString(
        getMappedValue(row, mapping, "paymentFrequency")
      ),
      premiumAmount,
      premiumDueDate,
      crummeyRequired,
      crummeySent,
      crummeyLetterSendDate: parseExcelDate(
        getMappedValue(row, mapping, "crummeyLetterSendDate")
      ),
      crummeyMethod: normalizeOptionalString(
        getMappedValue(row, mapping, "crummeyMethod")
      ),
      crummeyRecipients: normalizeOptionalString(
        getMappedValue(row, mapping, "crummeyRecipients")
      ),
      crummeyProofLink: normalizeOptionalString(
        getMappedValue(row, mapping, "crummeyProofLink")
      ),
      notes: normalizeOptionalString(getMappedValue(row, mapping, "notes")),
      statusOverride: normalizeOptionalString(
        getMappedValue(row, mapping, "statusOverride")
      ),
      updatedAt: now,
      createdAt: now,
    }
  })

  return NextResponse.json({ data: { ilits: records } })
}
