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

  const addIndexUpdate = (update: Omit<IndexUpdate, "timestamp">) => {
    const newUpdate = {
      ...update,
      timestamp: new Date().toISOString(),
    }

    setIndexHistory((prev) => [...prev, newUpdate])
    updateDailyMetrics(newUpdate)
  }

  const updateDailyMetrics = (update: IndexUpdate) => {
    const date = new Date(update.timestamp).toISOString().split("T")[0]
    const liters = update.currentIndex - update.previousIndex
    const revenue = liters * update.salePrice
    const profit = revenue - liters * update.costPrice

    setDailyMetrics((prev) => {
      const dayMetrics = prev[date] || {
        date,
        totalLiters: 0,
        totalRevenue: 0,
        totalProfit: 0,
        byPump: {},
      }

      // Update pump metrics (preserve pump name if available)
      const pumpMetrics = dayMetrics.byPump[update.pumpId] || {
        pumpName: update.pumpName,
        totalLiters: 0,
        byNozzle: {},
      }

      // Update nozzle metrics and attach human-friendly label when available
      // If the same nozzle has multiple updates the same day, accumulate values
      const existingNozzle = pumpMetrics.byNozzle[update.nozzleId]
      if (existingNozzle) {
        existingNozzle.liters += liters
        existingNozzle.revenue += revenue
        existingNozzle.profit += profit
        // keep label if present, prefer existing
        existingNozzle.nozzleLabel =
          existingNozzle.nozzleLabel || update.nozzleLabel
        pumpMetrics.byNozzle[update.nozzleId] = existingNozzle
      } else {
        pumpMetrics.byNozzle[update.nozzleId] = {
          liters,
          revenue,
          profit,
          nozzleLabel: update.nozzleLabel,
        }
      }

      // Update pump totals (recalculate from nozzle aggregates)
      pumpMetrics.totalLiters = Object.values(pumpMetrics.byNozzle).reduce(
        (sum, n) => sum + n.liters,
        0
      )

      // Update daily totals
      dayMetrics.totalLiters += liters
      dayMetrics.totalRevenue += revenue
      dayMetrics.totalProfit += profit
      dayMetrics.byPump[update.pumpId] = pumpMetrics

      return {
        ...prev,
        [date]: dayMetrics,
      }
    })
  }

  const getDailyMetrics = (date: string) => {
    return dailyMetrics[date] || null
  }

  const getMetricsForDateRange = (startDate: string, endDate: string) => {
    return Object.values(dailyMetrics).filter(
      (metrics) => metrics.date >= startDate && metrics.date <= endDate
    )
  }

  return {
    addIndexUpdate,
    getDailyMetrics,
    getMetricsForDateRange,
    indexHistory,
  }
}
