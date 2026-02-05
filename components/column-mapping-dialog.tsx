"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type MappingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  headers: string[]
  sampleData: Record<string, unknown>[]
  onConfirm: (mapping: Record<string, string>) => void
}

const requiredFields = [
  { key: "trustName", label: "Trust Name" },
  { key: "premiumDueDate", label: "Premium Due Date" },
  { key: "premiumAmount", label: "Premium Amount" },
]

const optionalFields = [
  { key: "accountNumber", label: "Account Number" },
  { key: "policyNumber", label: "Policy Number" },
  { key: "insuranceCompany", label: "Insurance Company" },
  { key: "paymentFrequency", label: "Payment Frequency" },
  { key: "beneficiary", label: "Beneficiary" },
  { key: "trustees", label: "Trustees" },
  { key: "policyType", label: "Policy Type" },
  { key: "crummeyLetterSendDate", label: "Crummey Letter Send Date" },
  { key: "crummeySent", label: "Crummey Sent" },
  { key: "crummeyMethod", label: "Crummey Method" },
  { key: "crummeyRecipients", label: "Crummey Recipients" },
  { key: "crummeyProofLink", label: "Crummey Proof Link" },
  { key: "notes", label: "Notes" },
  { key: "crummeyRequired", label: "Crummey Required" },
  { key: "statusOverride", label: "Status Override" },
]

const buildSampleRow = (row: Record<string, unknown>, header: string) => {
  const value = row[header]
  if (value === null || value === undefined) return "—"
  return String(value)
}

export const ColumnMappingDialog = ({
  open,
  onOpenChange,
  headers,
  sampleData,
  onConfirm,
}: MappingDialogProps) => {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const sampleRows = useMemo(() => sampleData.slice(0, 3), [sampleData])

  const handleSelect = (field: string, header: string) => {
    setMapping((prev) => ({ ...prev, [field]: header }))
  }

  const handleConfirm = () => {
    onConfirm(mapping)
  }

  const headerOptions = ["", ...headers]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Map Columns</DialogTitle>
          <DialogDescription>
            Match your spreadsheet headers to ILIT policy fields. You can leave
            optional fields blank.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid gap-4">
            {[...requiredFields, ...optionalFields].map((field) => (
              <div
                key={field.key}
                className="grid gap-2 rounded-lg border p-3"
              >
                <Label className="text-sm font-semibold">{field.label}</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={mapping[field.key] ?? ""}
                  onChange={(event) => handleSelect(field.key, event.target.value)}
                >
                  {headerOptions.map((header) => (
                    <option key={`${field.key}-${header}`} value={header}>
                      {header || "Not mapped"}
                    </option>
                  ))}
                </select>
                {mapping[field.key] && sampleRows.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Sample:{" "}
                    {sampleRows
                      .map((row) => buildSampleRow(row, mapping[field.key]))
                      .join(" | ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Mapping</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
