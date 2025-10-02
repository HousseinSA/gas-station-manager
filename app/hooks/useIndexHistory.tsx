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
}

interface DailyMetrics {
  date: string
  totalLiters: number
  totalRevenue: number
  totalProfit: number
  byPump: {
    [pumpId: number]: {
      totalLiters: number
      byNozzle: {
        [nozzleId: number]: {
          liters: number
          revenue: number
          profit: number
        }
      }
    }
  }
}

export function useIndexHistory(stationId: number | null) {
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

      // Update pump metrics
      const pumpMetrics = dayMetrics.byPump[update.pumpId] || {
        totalLiters: 0,
        byNozzle: {},
      }

      // Update nozzle metrics
      pumpMetrics.byNozzle[update.nozzleId] = {
        liters,
        revenue,
        profit,
      }

      // Update pump totals
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
