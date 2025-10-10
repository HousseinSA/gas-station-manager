// components/DailySummary/DailyMetrics.tsx
import React from "react"
import { Droplets, Wallet, TrendingUp } from "lucide-react"
import { formatNumber, formatCurrency } from "./utils"

interface Props {
  totalLiters: number
  totalRevenue: number
  totalProfit: number
}

export default function DailyMetrics({
  totalLiters,
  totalRevenue,
  totalProfit,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Volume total */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Droplets className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Volume total (vendu)</span>
          <span className="sm:hidden">Volume</span>
        </div>
        <div className="text-2xl font-medium mt-1">
          {formatNumber(totalLiters)} L
        </div>
      </div>

      {/* Revenu */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wallet className="w-4 h-4 md:w-5 md:h-5" />
          <span>Revenu total</span>
        </div>
        <div className="text-2xl font-medium mt-1">
          {formatCurrency(totalRevenue)}
        </div>
      </div>

      {/* Bénéfice */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
          <span>Bénéfice total</span>
        </div>
        <div
          className={`text-2xl font-medium mt-1 ${
            totalProfit > 0
              ? "text-green-600"
              : totalProfit < 0
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
          {formatCurrency(totalProfit)}
        </div>
      </div>
    </div>
  )
}
