// Smoke test checklist:
// - run dev server
// - open page
// - upload excel
// - map columns
// - confirm data appears
// - refresh to confirm persistence
// - test edit/mail/export
"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  Download,
  Edit,
  Mail,
  MoreHorizontal,
  Upload,
} from "lucide-react"

import { ColumnMappingDialog } from "@/components/column-mapping-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { saveData, clear as clearStore } from "@/lib/data-store"
import { parseAmount, parseExcelDate } from "@/lib/parse-utils"
import type { ILITPolicyRecord } from "@/lib/types"
import { useILITData } from "@/hooks/use-ilit-data"

type SortKey = "none" | "trustName" | "premiumDueDate" | "premiumAmount"
type FilterKey = "all" | "overdue" | "dueSoon" | "letterDue" | "pending" | "sent"

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "dueSoon", label: "Due Soon" },
  { key: "letterDue", label: "Letter Due" },
  { key: "pending", label: "Pending" },
  { key: "sent", label: "Sent" },
]

const exportFields: { key: keyof ILITPolicyRecord; label: string }[] = [
  { key: "trustName", label: "Trust Name" },
  { key: "accountNumber", label: "Account Number" },
  { key: "beneficiary", label: "Beneficiary" },
  { key: "trustees", label: "Trustees" },
  { key: "policyNumber", label: "Policy Number" },
  { key: "policyType", label: "Policy Type" },
  { key: "insuranceCompany", label: "Insurance Company" },
  { key: "paymentFrequency", label: "Payment Frequency" },
  { key: "premiumAmount", label: "Premium Amount" },
  { key: "premiumDueDate", label: "Premium Due Date" },
  { key: "crummeyRequired", label: "Crummey Required" },
  { key: "crummeySent", label: "Crummey Sent" },
  { key: "crummeyLetterSendDate", label: "Crummey Letter Send Date" },
  { key: "crummeyMethod", label: "Crummey Method" },
  { key: "crummeyRecipients", label: "Crummey Recipients" },
  { key: "crummeyProofLink", label: "Crummey Proof Link" },
  { key: "notes", label: "Notes" },
  { key: "statusOverride", label: "Status Override" },
  { key: "updatedAt", label: "Updated At" },
  { key: "createdAt", label: "Created At" },
]

const formatCurrency = (value?: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A"
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (value?: string) => {
  if (!value) return "N/A"
  return value
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const determineStatus = (record: ILITPolicyRecord) => {
  if (record.statusOverride) {
    return {
      label: record.statusOverride,
      style: "bg-muted text-muted-foreground",
      key: "override",
    }
  }

  if (record.crummeySent && record.crummeyLetterSendDate) {
    return { label: "Sent", style: "bg-emerald-600 text-white", key: "sent" }
  }

  if (!record.premiumDueDate) {
    return { label: "Pending", style: "bg-blue-600 text-white", key: "pending" }
  }

  const dueDate = new Date(`${record.premiumDueDate}T00:00:00`)
  const now = new Date()
  const diffDays = Math.ceil(
    (dueDate.getTime() - now.setHours(0, 0, 0, 0)) / 86400000
  )

  if (diffDays < 0 && !record.crummeySent) {
    return {
      label: "Overdue",
      style: "bg-red-600 text-white",
      key: "overdue",
      urgent: true,
    }
  }

  if (diffDays <= 7) {
    return {
      label: "Due Soon",
      style: "bg-orange-500 text-white",
      key: "dueSoon",
      urgent: true,
    }
  }

  if (diffDays <= 35) {
    return {
      label: "Letter Due",
      style: "bg-yellow-400 text-black",
      key: "letterDue",
    }
  }

  return { label: "Pending", style: "bg-blue-600 text-white", key: "pending" }
}

const buildCsv = (records: ILITPolicyRecord[]) => {
  const header = exportFields.map((field) => field.label).join(",")
  const rows = records.map((record) =>
    exportFields
      .map((field) => {
        const value = record[field.key]
        if (value === null || value === undefined) return ""
        const stringValue = typeof value === "number" ? value.toString() : value
        return `"${String(stringValue).replace(/"/g, '""')}"`
      })
      .join(",")
  )
  return [header, ...rows].join("\n")
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const exportToCsv = (records: ILITPolicyRecord[], filename: string) => {
  const csv = buildCsv(records)
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename)
}

const exportToXlsx = async (
  records: ILITPolicyRecord[],
  filename: string
) => {
  const rows = records.map((record) => {
    const output: Record<string, unknown> = {}
    exportFields.forEach((field) => {
      output[field.label] = record[field.key] ?? ""
    })
    return output
  })

  const xlsx = await import("xlsx")
  const worksheet = xlsx.utils.json_to_sheet(rows)
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, "ILIT Policies")
  const data = xlsx.write(workbook, { bookType: "xlsx", type: "array" })
  downloadBlob(new Blob([data], { type: "application/octet-stream" }), filename)
}

type EditableRecord = ILITPolicyRecord & {
  premiumAmount?: number | string
}

export const ILITTracker = () => {
  const { data } = useILITData()
  const { toast } = useToast()

  const [sortKey, setSortKey] = useState<SortKey>("none")
  const [filterKey, setFilterKey] = useState<FilterKey>("all")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([])
  const [fileUpload, setFileUpload] = useState<File | null>(null)
  const [editRecord, setEditRecord] = useState<EditableRecord | null>(null)
  const [mailRecord, setMailRecord] = useState<EditableRecord | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const filteredSortedRecords = useMemo(() => {
    const records = [...data.ilits]

    const filtered = records.filter((record) => {
      if (filterKey === "all") return true
      const status = determineStatus(record)
      return status.key === filterKey
    })

    if (sortKey === "trustName") {
      filtered.sort((a, b) => a.trustName.localeCompare(b.trustName))
    } else if (sortKey === "premiumDueDate") {
      filtered.sort((a, b) =>
        (a.premiumDueDate ?? "").localeCompare(b.premiumDueDate ?? "")
      )
    } else if (sortKey === "premiumAmount") {
      filtered.sort((a, b) => (b.premiumAmount ?? 0) - (a.premiumAmount ?? 0))
    }

    return filtered
  }, [data.ilits, filterKey, sortKey])

  const dispatchUpdate = (nextRecords: ILITPolicyRecord[]) => {
    saveData({ ilits: nextRecords })
    window.dispatchEvent(new Event("ilit-data-updated"))
  }

  const handleFileUpload = async () => {
    if (!fileUpload) {
      toast({
        title: "Upload required",
        description: "Please choose an Excel file to upload.",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", fileUpload)

      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed.")
      }

      const result = (await response.json()) as {
        headers: string[]
        rawData: Record<string, unknown>[]
      }

      setRawHeaders(result.headers)
      setRawData(result.rawData)
      setUploadDialogOpen(false)
      setMappingDialogOpen(true)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      })
    }
  }

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    try {
      const response = await fetch("/api/process-mapped-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData, mapping }),
      })

      if (!response.ok) {
        throw new Error("Processing failed.")
      }

      const result = (await response.json()) as { data: { ilits: ILITPolicyRecord[] } }
      dispatchUpdate(result.data.ilits)
      setMappingDialogOpen(false)
      toast({
        title: "Import complete",
        description: `Imported ${result.data.ilits.length} policies.`,
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveEdit = () => {
    if (!editRecord) return
    const updated: ILITPolicyRecord = {
      ...editRecord,
      premiumAmount: parseAmount(editRecord.premiumAmount),
      premiumDueDate: parseExcelDate(editRecord.premiumDueDate),
      crummeyLetterSendDate: parseExcelDate(editRecord.crummeyLetterSendDate),
      updatedAt: new Date().toISOString(),
    }

    if (updated.crummeySent && !updated.crummeyLetterSendDate) {
      updated.crummeyLetterSendDate = todayIso()
    }

    const nextRecords = data.ilits.map((record) =>
      record.id === updated.id ? updated : record
    )
    dispatchUpdate(nextRecords)
    setEditRecord(null)
    toast({ title: "Policy updated" })
  }

  const handleMailSave = () => {
    if (!mailRecord) return
    const updated: ILITPolicyRecord = {
      ...mailRecord,
      crummeySent: true,
      crummeyLetterSendDate: todayIso(),
      updatedAt: new Date().toISOString(),
    }
    const nextRecords = data.ilits.map((record) =>
      record.id === updated.id ? updated : record
    )
    dispatchUpdate(nextRecords)
    setMailRecord(null)
    toast({
      title: "Crummey letter marked sent",
      description: "Mail status updated.",
    })
  }

  const handleExportAll = async () => {
    try {
      await exportToXlsx(filteredSortedRecords, "ilit-policies.xlsx")
      toast({ title: "Export complete", description: "XLSX downloaded." })
    } catch (error) {
      exportToCsv(filteredSortedRecords, "ilit-policies.csv")
      toast({
        title: "Exported as CSV",
        description:
          error instanceof Error
            ? "XLSX unavailable, exported CSV instead."
            : "Exported CSV instead.",
      })
    }
  }

  const handleExportAllCsv = () => {
    exportToCsv(filteredSortedRecords, "ilit-policies.csv")
    toast({ title: "Exported CSV", description: "CSV downloaded." })
  }

  const handleExportRow = (record: ILITPolicyRecord) => {
    exportToCsv([record], `${record.trustName}-policy.csv`)
  }

  const handleClearData = () => {
    clearStore()
    window.dispatchEvent(new Event("ilit-data-updated"))
    setClearDialogOpen(false)
    toast({ title: "Data cleared", description: "Local data removed." })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>ILIT Policy & Premium Tracker</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <Button variant="outline" onClick={handleExportAllCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export All CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Sort
                  <ArrowDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortKey("none")}>
                  None
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey("trustName")}>
                  Trust Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey("premiumDueDate")}>
                  Premium Due Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey("premiumAmount")}>
                  Premium Amount (Desc)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setClearDialogOpen(true)}>
                  Clear Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              variant={filterKey === option.key ? "default" : "outline"}
              onClick={() => setFilterKey(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trust</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSortedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No policies yet. Upload an Excel file to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredSortedRecords.map((record) => {
                const status = determineStatus(record)
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.trustName}
                      <div className="text-xs text-muted-foreground">
                        {record.accountNumber ?? "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.policyNumber ?? "N/A"}
                      <div className="text-xs text-muted-foreground">
                        {record.policyType ?? "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>{record.insuranceCompany ?? "N/A"}</TableCell>
                    <TableCell>{formatCurrency(record.premiumAmount)}</TableCell>
                    <TableCell>{formatDate(record.premiumDueDate)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`gap-1 ${status.style}`}>
                          {status.urgent && (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {status.label}
                        </Badge>
                        {record.crummeyRequired === false && (
                          <Badge className="bg-muted text-muted-foreground">
                            No Letter Needed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditRecord(record)}
                        >
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportRow(record)}
                        >
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMailRecord(record)}
                        >
                          <Mail className="mr-2 h-3.5 w-3.5" />
                          Mail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Excel</DialogTitle>
            <DialogDescription>
              Upload an XLSX or XLS file to import ILIT policies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="excel-upload">Excel File</Label>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setFileUpload(file)
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ColumnMappingDialog
        open={mappingDialogOpen}
        onOpenChange={setMappingDialogOpen}
        headers={rawHeaders}
        sampleData={rawData}
        onConfirm={handleMappingConfirm}
      />

      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update policy and letter details.</DialogDescription>
          </DialogHeader>
          {editRecord && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Trust Name</Label>
                <Input
                  value={editRecord.trustName}
                  onChange={(event) =>
                    setEditRecord({ ...editRecord, trustName: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Account Number</Label>
                  <Input
                    value={editRecord.accountNumber ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        accountNumber: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Premium Amount</Label>
                  <Input
                    value={editRecord.premiumAmount ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        premiumAmount: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Premium Due Date</Label>
                  <Input
                    type="date"
                    value={editRecord.premiumDueDate ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        premiumDueDate: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Insurance Company</Label>
                  <Input
                    value={editRecord.insuranceCompany ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        insuranceCompany: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={editRecord.policyNumber ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        policyNumber: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Policy Type</Label>
                  <Input
                    value={editRecord.policyType ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        policyType: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Payment Frequency</Label>
                  <Input
                    value={editRecord.paymentFrequency ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        paymentFrequency: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Beneficiary</Label>
                  <Input
                    value={editRecord.beneficiary ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        beneficiary: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Trustees</Label>
                  <Input
                    value={editRecord.trustees ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        trustees: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input
                  value={editRecord.notes ?? ""}
                  onChange={(event) =>
                    setEditRecord({
                      ...editRecord,
                      notes: event.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <input
                    id="crummey-required"
                    type="checkbox"
                    checked={editRecord.crummeyRequired ?? true}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        crummeyRequired: event.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="crummey-required">Crummey Letter Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="crummey-sent"
                    type="checkbox"
                    checked={editRecord.crummeySent ?? false}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        crummeySent: event.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="crummey-sent">Mark Sent</Label>
                </div>
                <div className="grid gap-2">
                  <Label>Send Date</Label>
                  <Input
                    type="date"
                    value={editRecord.crummeyLetterSendDate ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        crummeyLetterSendDate: event.target.value,
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditRecord({
                        ...editRecord,
                        crummeyLetterSendDate: todayIso(),
                      })
                    }
                  >
                    Set Send Date = Today
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Crummey Method</Label>
                  <Input
                    value={editRecord.crummeyMethod ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        crummeyMethod: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Crummey Recipients</Label>
                  <Input
                    value={editRecord.crummeyRecipients ?? ""}
                    onChange={(event) =>
                      setEditRecord({
                        ...editRecord,
                        crummeyRecipients: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Crummey Proof Link</Label>
                <Input
                  value={editRecord.crummeyProofLink ?? ""}
                  onChange={(event) =>
                    setEditRecord({
                      ...editRecord,
                      crummeyProofLink: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!mailRecord} onOpenChange={() => setMailRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mail Crummey Letter</DialogTitle>
            <DialogDescription>Update recipients and mark as sent.</DialogDescription>
          </DialogHeader>
          {mailRecord && (
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Recipients</Label>
                <Input
                  value={mailRecord.crummeyRecipients ?? ""}
                  onChange={(event) =>
                    setMailRecord({
                      ...mailRecord,
                      crummeyRecipients: event.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Method</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={mailRecord.crummeyMethod ?? ""}
                  onChange={(event) =>
                    setMailRecord({
                      ...mailRecord,
                      crummeyMethod: event.target.value,
                    })
                  }
                >
                  <option value="">Select method</option>
                  <option value="Mail">Mail</option>
                  <option value="Email">Email</option>
                  <option value="Portal">Portal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Proof Link</Label>
                <Input
                  value={mailRecord.crummeyProofLink ?? ""}
                  onChange={(event) =>
                    setMailRecord({
                      ...mailRecord,
                      crummeyProofLink: event.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMailRecord(null)}>
              Cancel
            </Button>
            <Button onClick={handleMailSave}>Mark as Sent Today</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Local Data</DialogTitle>
            <DialogDescription>
              This removes all locally stored ILIT policies. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
