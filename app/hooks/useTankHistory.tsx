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

      if (update.reason === "pump-usage") {
        // Get all updates for this tank on this day up to this point
        const todaysUpdates = tankHistory
          .filter(h => 
            h.tankId === update.tankId && 
            new Date(h.timestamp).toISOString().split('T')[0] === date
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Add this update to calculate net total
        todaysUpdates.push(update);

        // Calculate net change from start to current
        const startLevel = todaysUpdates[0].previousLevel;
        const currentLevel = update.currentLevel;
        const netWithdrawn = Math.max(0, startLevel - currentLevel);

        console.log("[useTankHistory] Recalculating totals:", {
          startLevel,
          currentLevel,
          netWithdrawn,
          updates: todaysUpdates.map(u => ({
            change: u.change,
            level: u.currentLevel
          }))
        });

        // Set the total withdrawn to the net change
        tankStatus.totalWithdrawn = netWithdrawn;
      } else if (update.change > 0 && update.reason === "refill") {
        // Manual refill
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
    // Get all updates for this tank, ordered by time
    const updates = tankHistory
      .filter((h) => h.tankId === tankId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

    // Get last known state
    const lastUpdate = [...updates].reverse()[0]
    const baseLevel = lastUpdate?.currentLevel ?? prevTankLevel

    if (baseLevel === null) return

    console.log("[useTankHistory] Processing tank update:", {
      tankId,
      baseLevel,
      litersDispensed,
      prevTankLevel,
      lastKnownLevel: lastUpdate?.currentLevel,
    })

    // Calculate new level - handle both dispensing and corrections
    const newLevel = baseLevel - litersDispensed // Negative dispensed means add back

    // Calculate the change - positive for corrections (adding back), negative for dispensing
    const change = -litersDispensed // Invert because dispensed is opposite of change

    addTankUpdate({
      tankId,
      previousLevel: baseLevel,
      currentLevel: newLevel,
      change, // Will be negative for dispensing, positive for corrections
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
