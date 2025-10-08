"use client"

import React from "react"

interface IndexUpdate {
  timestamp: string
  nozzleId: number
  pumpId: number
  previousIndex: number
  currentIndex: number
  liters: number
  salePrice: number
  costPrice: number
  pumpName?: string
  nozzleLabel?: string
}

interface DailyMetrics {
  date: string
  totalLiters: number
  totalRevenue: number
  totalProfit: number
  byPump: {
    [pumpId: number]: {
      pumpName?: string
      totalLiters: number
      byNozzle: {
        [nozzleId: number]: {
          liters: number
          revenue: number
          profit: number
          nozzleLabel?: string
        }
      }
    }
  }
}

export function useIndexHistory() {
  const [indexHistory, setIndexHistory] = React.useState<IndexUpdate[]>([])
  const [dailyMetrics, setDailyMetrics] = React.useState<{
    [date: string]: DailyMetrics
  }>({})

  // Track the committed index (previousIndex) for each nozzle
  const lastCommittedIndexRef = React.useRef<{ [nozzleId: number]: number }>({})

  const addIndexUpdate = (update: Omit<IndexUpdate, "timestamp">) => {
    const timestamp = new Date().toISOString()

    // First update of the day uses previousIndex from the update
    // Subsequent updates use the last committed value
    const baseIndex =
      lastCommittedIndexRef.current[update.nozzleId] ?? update.previousIndex

    // Track this as the new committed value
    lastCommittedIndexRef.current[update.nozzleId] = baseIndex

    const newUpdate: IndexUpdate = {
      ...update,
      timestamp,
      previousIndex: baseIndex, // Use tracked committed value
    }

    console.log("[useIndexHistory] Adding update:", {
      nozzleId: update.nozzleId,
      baseIndex,
      currentIndex: update.currentIndex,
      liters: update.liters,
    })

    setIndexHistory((prev) => {
      const updated = [...prev, newUpdate]
      // Recalculate metrics with this update
      setTimeout(() => recalculateMetricsForDate(timestamp.split("T")[0]), 0)
      return updated
    })
  }

  // Recalculate metrics from scratch for a specific date
  const recalculateMetricsForDate = (date: string) => {
    setDailyMetrics((prev) => {
      // Get all updates for this date
      const updatesForDate = indexHistory.filter(
        (u) => u.timestamp.split("T")[0] === date
      )

      if (updatesForDate.length === 0) {
        return prev
      }

      // Group by nozzle to track FIRST previousIndex and LATEST currentIndex
      const nozzleState: {
        [nozzleId: number]: {
          pumpId: number
          pumpName?: string
          nozzleLabel?: string
          firstPreviousIndex: number // First previousIndex of the day
          latestCurrentIndex: number // Latest currentIndex
          salePrice: number
          costPrice: number
        }
      } = {}

      // Process updates chronologically
      updatesForDate
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .forEach((update) => {
          if (!nozzleState[update.nozzleId]) {
            // First update for this nozzle today - record the starting previousIndex
            nozzleState[update.nozzleId] = {
              pumpId: update.pumpId,
              pumpName: update.pumpName,
              nozzleLabel: update.nozzleLabel,
              firstPreviousIndex: update.previousIndex, // Keep the FIRST
              latestCurrentIndex: update.currentIndex, // Latest current
              salePrice: update.salePrice,
              costPrice: update.costPrice,
            }
          } else {
            // Subsequent update - keep first previousIndex, update current
            nozzleState[update.nozzleId].latestCurrentIndex =
              update.currentIndex
          }
        })

      // Now calculate metrics using firstPreviousIndex → latestCurrentIndex
      const dayMetrics: DailyMetrics = {
        date,
        totalLiters: 0,
        totalRevenue: 0,
        totalProfit: 0,
        byPump: {},
      }

      Object.entries(nozzleState).forEach(([nozzleIdStr, state]) => {
        const nozzleId = Number(nozzleIdStr)
        // Calculate from the FIRST previousIndex to LATEST currentIndex
        // Calculate NET change from start to latest
        const netDelta = state.latestCurrentIndex - state.firstPreviousIndex
        const liters = Math.max(0, netDelta) // Only count net positive dispensing
        const revenue = liters * state.salePrice
        const profit = revenue - liters * state.costPrice

        console.log("[useIndexHistory] Calculating nozzle metrics:", {
          nozzleId,
          firstPreviousIndex: state.firstPreviousIndex,
          latestCurrentIndex: state.latestCurrentIndex,
          netDelta,
          liters,
          revenue,
        })

        // Initialize pump if needed
        if (!dayMetrics.byPump[state.pumpId]) {
          dayMetrics.byPump[state.pumpId] = {
            pumpName: state.pumpName,
            totalLiters: 0,
            byNozzle: {},
          }
        }

        // Set nozzle metrics
        dayMetrics.byPump[state.pumpId].byNozzle[nozzleId] = {
          liters,
          revenue,
          profit,
          nozzleLabel: state.nozzleLabel,
        }

        // Update totals
        dayMetrics.totalLiters += liters
        dayMetrics.totalRevenue += revenue
        dayMetrics.totalProfit += profit
      })

      // Recalculate pump totals
      Object.values(dayMetrics.byPump).forEach((pump) => {
        pump.totalLiters = Object.values(pump.byNozzle).reduce(
          (sum, n) => sum + n.liters,
          0
        )
      })

      return {
        ...prev,
        [date]: dayMetrics,
      }
    })
  }

  const getDailyMetrics = (date: string) => {
    // Get all updates for this date
    const updatesForDate = indexHistory.filter(
      (u) => u.timestamp.split("T")[0] === date
    )

    if (updatesForDate.length === 0) {
      return null
    }

    // Track FIRST previousIndex and LATEST currentIndex per nozzle
    const nozzleState: {
      [nozzleId: number]: {
        pumpId: number
        pumpName?: string
        nozzleLabel?: string
        firstPreviousIndex: number
        latestCurrentIndex: number
        salePrice: number
        costPrice: number
      }
    } = {}

    updatesForDate
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .forEach((update) => {
        if (!nozzleState[update.nozzleId]) {
          nozzleState[update.nozzleId] = {
            pumpId: update.pumpId,
            pumpName: update.pumpName,
            nozzleLabel: update.nozzleLabel,
            firstPreviousIndex: update.previousIndex,
            latestCurrentIndex: update.currentIndex,
            salePrice: update.salePrice,
            costPrice: update.costPrice,
          }
        } else {
          nozzleState[update.nozzleId].latestCurrentIndex = update.currentIndex
        }
      })

    // Calculate metrics from FIRST previousIndex to LATEST currentIndex
    const dayMetrics: DailyMetrics = {
      date,
      totalLiters: 0,
      totalRevenue: 0,
      totalProfit: 0,
      byPump: {},
    }

    Object.entries(nozzleState).forEach(([nozzleIdStr, state]) => {
      const nozzleId = Number(nozzleIdStr)
      const delta = state.latestCurrentIndex - state.firstPreviousIndex
      const liters = delta > 0 ? delta : 0
      const revenue = liters * state.salePrice
      const profit = revenue - liters * state.costPrice

      if (!dayMetrics.byPump[state.pumpId]) {
        dayMetrics.byPump[state.pumpId] = {
          pumpName: state.pumpName,
          totalLiters: 0,
          byNozzle: {},
        }
      }

      dayMetrics.byPump[state.pumpId].byNozzle[nozzleId] = {
        liters,
        revenue,
        profit,
        nozzleLabel: state.nozzleLabel,
      }

      dayMetrics.totalLiters += liters
      dayMetrics.totalRevenue += revenue
      dayMetrics.totalProfit += profit
    })

    Object.values(dayMetrics.byPump).forEach((pump) => {
      pump.totalLiters = Object.values(pump.byNozzle).reduce(
        (sum, n) => sum + n.liters,
        0
      )
    })

    return dayMetrics
  }

  const getLastEntryForNozzle = (nozzleId: number, date?: string) => {
    const entries = indexHistory
      .filter((u) => u.nozzleId === nozzleId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

    if (!entries || entries.length === 0) return null
    if (!date) return entries[0]

    const day = date
    const sameDayEntry = entries.find((e) => e.timestamp.split("T")[0] === day)
    return sameDayEntry || null
  }

  const getMetricsForDateRange = (startDate: string, endDate: string) => {
    const dates = new Set(indexHistory.map((u) => u.timestamp.split("T")[0]))

    return Array.from(dates)
      .filter((date) => date >= startDate && date <= endDate)
      .map((date) => getDailyMetrics(date))
      .filter((m) => m !== null) as DailyMetrics[]
  }

  return {
    addIndexUpdate,
    getDailyMetrics,
    getMetricsForDateRange,
    indexHistory,
    getLastEntryForNozzle,
  }
}
