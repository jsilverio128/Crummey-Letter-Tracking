import { useCallback, useEffect, useState } from "react"

import { loadData } from "@/lib/data-store"
import type { ILITDataStore } from "@/lib/types"

const defaultData: ILITDataStore = { ilits: [] }

export const useILITData = () => {
  const [data, setData] = useState<ILITDataStore>(defaultData)

  const refreshData = useCallback(() => {
    const stored = loadData()
    setData(stored ?? defaultData)
  }, [])

  useEffect(() => {
    refreshData()
    const handler = () => refreshData()
    window.addEventListener("ilit-data-updated", handler)
    return () => window.removeEventListener("ilit-data-updated", handler)
  }, [refreshData])

  return {
    data,
    hasData: data.ilits.length > 0,
    refreshData,
  }
}
