import { useState, useEffect } from "react"

interface TankLevel {
  timestamp: string
  stationId?: number | string
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

  // Load from server on mount
  useEffect(() => {
    let mounted = true
    fetch("/api/tank-history")
      .then((r) => r.json())
      .then((data: TankLevel[]) => {
        if (!mounted) return
        setTankHistory(data)
      })
      .catch((e) => console.error("Failed to load tank history", e))
    return () => {
      mounted = false
    }
  }, [])

  const addTankUpdate = (update: Omit<TankLevel, "timestamp">) => {
    const newUpdate = {
      ...update,
      timestamp: new Date().toISOString(),
    }

    setTankHistory((prev) => {
      const updated = [...prev, newUpdate]
      // Recalculate daily status after adding update
      setTimeout(
        () =>
          recalculateDailyStatus(
            newUpdate.timestamp.split("T")[0],
            update.tankId
          ),
        0
      )
      // Persist
      fetch("/api/tank-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUpdate),
      }).catch((e) => console.error("Failed to persist tank history", e))
      return updated
    })
  }

  // Recalculate daily status from scratch for a given date and tank
  const recalculateDailyStatus = (date: string, tankId: number) => {
    // Get all updates for this tank on this date
    const updatesForDay = tankHistory
      .filter(
        (h) =>
          h.tankId === tankId &&
          new Date(h.timestamp).toISOString().split("T")[0] === date
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

    if (updatesForDay.length === 0) return

    const startLevel = updatesForDay[0].previousLevel
    const endLevel = updatesForDay[updatesForDay.length - 1].currentLevel

    let totalWithdrawn = 0
    let totalRefilled = 0
    const refills: { timestamp: string; amount: number }[] = []

    // Process each update
    updatesForDay.forEach((update) => {
      if (update.reason === "pump-usage") {
        // Normal dispensing has negative change
        if (update.change < 0) {
          totalWithdrawn += Math.abs(update.change)
        }
      } else if (update.reason === "correction") {
        // Correction has positive change (fuel added back)
        if (update.change > 0) {
          // Reduce total withdrawn since we're adding fuel back
          totalWithdrawn = Math.max(0, totalWithdrawn - update.change)
        }
      } else if (update.reason === "refill") {
        // Manual refill
        if (update.change > 0) {
          totalRefilled += update.change
          refills.push({
            timestamp: update.timestamp,
            amount: update.change,
          })
        }
      } else if (update.reason === "manual-update") {
        // Manual adjustment (can be positive or negative)
        if (update.change < 0) {
          totalWithdrawn += Math.abs(update.change)
        } else if (update.change > 0) {
          totalRefilled += update.change
        }
      }
    })

    setDailyStatus((prev) => {
      const currentDay = prev[date] || {}

      return {
        ...prev,
        [date]: {
          ...currentDay,
          [tankId]: {
            date,
            tankId,
            startLevel,
            endLevel,
            totalWithdrawn,
            totalRefilled,
            refills,
          },
        },
      }
    })
  }

  const getDailyTankStatus = (date: string, tankId: number, currentStationId?: number | string) => {
    // Always recalculate from history to ensure accuracy
    let updatesForDay = tankHistory
      .filter(
        (h) =>
          h.tankId === tankId &&
          new Date(h.timestamp).toISOString().split("T")[0] === date
      )
    
    // Filter by station ID if provided
    if (currentStationId !== undefined) {
      updatesForDay = updatesForDay.filter(h => 
        String(h.stationId) === String(currentStationId)
      )
    }
    
    updatesForDay = updatesForDay.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    if (updatesForDay.length === 0) {
      return null
    }

    const startLevel = updatesForDay[0].previousLevel
    const endLevel = updatesForDay[updatesForDay.length - 1].currentLevel

    let totalWithdrawn = 0
    let totalRefilled = 0
    const refills: { timestamp: string; amount: number }[] = []

    updatesForDay.forEach((update) => {
      if (update.reason === "pump-usage") {
        if (update.change < 0) {
          totalWithdrawn += Math.abs(update.change)
        }
      } else if (update.reason === "correction") {
        if (update.change > 0) {
          totalWithdrawn = Math.max(0, totalWithdrawn - update.change)
        }
      } else if (update.reason === "refill") {
        if (update.change > 0) {
          totalRefilled += update.change
          refills.push({
            timestamp: update.timestamp,
            amount: update.change,
          })
        }
      } else if (update.reason === "manual-update") {
        if (update.change < 0) {
          totalWithdrawn += Math.abs(update.change)
        } else if (update.change > 0) {
          totalRefilled += update.change
        }
      }
    })

    return {
      date,
      tankId,
      startLevel,
      endLevel,
      totalWithdrawn,
      totalRefilled,
      refills,
    }
  }

  const getTankStatusForDateRange = (
    tankId: number,
    startDate: string,
    endDate: string
  ) => {
    const dates = new Set(
      tankHistory
        .filter((h) => h.tankId === tankId)
        .map((h) => new Date(h.timestamp).toISOString().split("T")[0])
    )

    const statuses: TankDailyStatus[] = []
    dates.forEach((date) => {
      if (date >= startDate && date <= endDate) {
        const status = getDailyTankStatus(date, tankId)
        if (status) {
          statuses.push(status)
        }
      }
    })

    return statuses
  }

  const updateTankFromPumpUsage = (
    tankId: number,
    litersDispensed: number,
    prevTankLevel?: number,
    stationId?: number | string
  ) => {
    // Get all updates for this tank, ordered by time
    let updates = tankHistory
      .filter((h) => h.tankId === tankId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    
    // Filter by station ID if provided
    if (stationId !== undefined) {
      updates = updates.filter(h => 
        String(h.stationId) === String(stationId)
      )
    }

    // Get last known state
    const lastUpdate = [...updates].reverse()[0]
    const baseLevel = lastUpdate?.currentLevel ?? prevTankLevel

    if (baseLevel === undefined || baseLevel === null) return

    // Calculate new level
    const newLevel = baseLevel - litersDispensed
    const change = -litersDispensed // Negative for withdrawal

    addTankUpdate({
      tankId,
      previousLevel: baseLevel,
      currentLevel: newLevel,
      change,
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
