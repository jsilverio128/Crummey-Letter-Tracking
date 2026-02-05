import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

const isRowEmpty = (row: Record<string, unknown>) =>
  Object.values(row).every(
    (value) => value === null || value === undefined || String(value).trim() === ""
  )

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return NextResponse.json({ error: "No worksheet found." }, { status: 400 })
  }

  const worksheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: true,
  })

  const rawData = rawRows.filter((row) => !isRowEmpty(row))
  const headers = rawData.length > 0 ? Object.keys(rawData[0] ?? {}) : []

  return NextResponse.json({ headers, rawData })
}
