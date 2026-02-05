const excelEpoch = new Date(Date.UTC(1899, 11, 30))

const normalizeString = (value: string) => value.trim().replace(/\s+/g, " ")

export const parseExcelDate = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(excelEpoch.getTime() + value * 86400000)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  if (typeof value === "string") {
    const trimmed = normalizeString(value)
    if (!trimmed) return undefined
    const isoAttempt = new Date(trimmed)
    if (!Number.isNaN(isoAttempt.getTime())) {
      return isoAttempt.toISOString().slice(0, 10)
    }

    const usMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
    if (usMatch) {
      const month = Number(usMatch[1])
      const day = Number(usMatch[2])
      const year = Number(usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3])
      const date = new Date(Date.UTC(year, month - 1, day))
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10)
      }
    }
  }

  return undefined
}

export const parseAmount = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,]/g, "").trim()
    if (!cleaned) return undefined
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export const normalizeOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value === "string") {
    const normalized = normalizeString(value)
    return normalized.length ? normalized : undefined
  }
  return String(value)
}

export const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === null || value === undefined || value === "") return undefined
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const normalized = normalizeString(value).toLowerCase()
    if (["yes", "true", "1", "sent", "y"].includes(normalized)) return true
    if (["no", "false", "0", "not sent", "n"].includes(normalized)) return false
  }
  return undefined
}
