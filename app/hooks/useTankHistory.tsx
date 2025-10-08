import { useState } from "react"

interface TankLevel {
  timestamp: string
  tankId: number
  previousLevel: number
  currentLevel: number
  change: number // Positive for refills, negative for withdrawals
  reason: "pump-usage" | "manual-update" | "refill" | "correction"
}

interface TankDailyStatus {
  date: string
  tankId: number
  startLevel: number
  endLevel: number
  totalWithdrawn: number
  totalRefilled: number
  refills: {
    timestamp: string
    amount: number
  }[]
}

export function useTankHistory(stationId: number | null) {
  const [tankHistory, setTankHistory] = useState<TankLevel[]>([])
  const [dailyStatus, setDailyStatus] = useState<{
    [date: string]: { [tankId: number]: TankDailyStatus }
  }>({})

  const addTankUpdate = (update: Omit<TankLevel, "timestamp">) => {
    const newUpdate = {
      ...update,
      timestamp: new Date().toISOString(),
    }

    setTankHistory((prev) => [...prev, newUpdate])
    updateDailyStatus(newUpdate)
  }

  const updateDailyStatus = (update: TankLevel) => {
    const date = new Date(update.timestamp).toISOString().split("T")[0]

    setDailyStatus((prev) => {
      const currentDay = prev[date] || {}
      const tankStatus = currentDay[update.tankId] || {
        date,
        tankId: update.tankId,
        startLevel: update.previousLevel,
        endLevel: update.currentLevel,
        totalWithdrawn: 0,
        totalRefilled: 0,
        refills: [],
      }

      if (update.change < 0) {
        // Withdrawal (pump usage)
        tankStatus.totalWithdrawn += Math.abs(update.change)
      } else if (update.change > 0 && update.reason === "refill") {
        // Refill
        tankStatus.totalRefilled += update.change
        tankStatus.refills.push({
          timestamp: update.timestamp,
          amount: update.change,
        })
      }

      tankStatus.endLevel = update.currentLevel

      return {
        ...prev,
        [date]: {
          ...currentDay,
          [update.tankId]: tankStatus,
        },
      }
    })
  }

  const getDailyTankStatus = (date: string, tankId: number) => {
    return dailyStatus[date]?.[tankId] || null
  }

  const getTankStatusForDateRange = (
    tankId: number,
    startDate: string,
    endDate: string
  ) => {
    const statuses: TankDailyStatus[] = []
    for (const date in dailyStatus) {
      if (date >= startDate && date <= endDate && dailyStatus[date][tankId]) {
        statuses.push(dailyStatus[date][tankId])
      }
    }
    return statuses
  }

  // Update tank level based on pump usage. prevTankLevel is an optional
  // snapshot of the tank level taken before the station mutation. When
  // provided we use it as the authoritative previous level if no existing
  // tank-history entry exists for that tank (or when necessary to realign).
  const updateTankFromPumpUsage = (
    tankId: number,
    litersDispensed: number,
    prevTankLevel?: number
  ) => {
    const lastStatus = tankHistory
      .filter((h) => h.tankId === tankId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]

    // Determine the base level to subtract from: prefer the last recorded
    // tank-history level; if none exists, fall back to prevTankLevel (if
    // provided). If we still can't determine a base, do nothing to avoid
    // creating incorrect entries.
    const baseLevel =
      typeof lastStatus?.currentLevel === "number"
        ? lastStatus.currentLevel
        : typeof prevTankLevel === "number"
        ? prevTankLevel
        : null

    if (baseLevel === null) return

    const newLevel = Math.max(baseLevel - litersDispensed, 0)

    addTankUpdate({
      tankId,
      previousLevel: baseLevel,
      currentLevel: newLevel,
      change: -litersDispensed,
      reason: "pump-usage",
    })
  }

  return {
    addTankUpdate,
    updateTankFromPumpUsage,
    getDailyTankStatus,
    getTankStatusForDateRange,
    tankHistory,
  }
}
