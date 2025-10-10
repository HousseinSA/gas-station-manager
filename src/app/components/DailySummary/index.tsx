// components/DailySummary/index.tsx
"use client"
import React from "react"
import { Calendar } from "lucide-react"
import DailyMetrics from "./DailyMetrics"
import TankStatusSection from "./TankStatusSection"
import PumpDetailsSection from "./PumpDetailsSection"
import { useTranslations } from "next-intl"

interface DailyMetricsData {
  totalLiters: number
  totalRevenue: number
  totalProfit: number
  byPump: any
}

interface TankDailyStatus {
  date: string
  tankId: number
  startLevel: number
  endLevel: number
  totalWithdrawn: number
  totalRefilled: number
}

interface Props {
  date: string
  metrics: DailyMetricsData | null
  tankStatuses: { [tankId: number]: TankDailyStatus }
  tankNames: { [tankId: number]: string }
  pumpNumbers: { [pumpId: number]: string }
}

export default function DailySummary({
  date,
  metrics,
  tankStatuses,
  tankNames,
  pumpNumbers,
}: Props) {
  const t = useTranslations()
  if (!metrics)
    return <div className="text-center p-8 text-gray-500">{t("noHistory")}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xl font-medium">
        <Calendar className="w-6 h-6" />
        <span>{new Date(date).toLocaleDateString("fr-MR")}</span>
      </div>

      <DailyMetrics
        totalLiters={metrics.totalLiters}
        totalRevenue={metrics.totalRevenue}
        totalProfit={metrics.totalProfit}
      />

      <TankStatusSection tankStatuses={tankStatuses} tankNames={tankNames} />

      <PumpDetailsSection byPump={metrics.byPump} pumpNumbers={pumpNumbers} />
    </div>
  )
}
