import type { ILITDataStore } from "./types"

const STORAGE_KEY = "ilit_tracker_data_v1"

export const loadData = (): ILITDataStore | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ILITDataStore
  } catch {
    return null
  }
}

export const saveData = (data: ILITDataStore): void => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const clear = (): void => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
