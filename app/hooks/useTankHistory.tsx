import { useState } from "react"

interface TankLevel {
  timestamp: string
  tankId: number
  previousLevel: number
  currentLevel: number
  change: number // Positive for refills, negative for withdrawals
  reason: "pump-usage" | "manual-update" | "refill"
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

  // Update tank level based on pump usage
  const updateTankFromPumpUsage = (tankId: number, litersDispensed: number) => {
    const lastStatus = tankHistory
      .filter((h) => h.tankId === tankId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]

    if (lastStatus) {
      addTankUpdate({
        tankId,
        previousLevel: lastStatus.currentLevel,
        currentLevel: lastStatus.currentLevel - litersDispensed,
        change: -litersDispensed,
        reason: "pump-usage",
      })
    }
  }

  return {
    addTankUpdate,
    updateTankFromPumpUsage,
    getDailyTankStatus,
    getTankStatusForDateRange,
    tankHistory,
  }
}
