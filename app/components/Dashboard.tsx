"use client"
import React from "react"
import { Fuel, Wallet, TrendingUp } from "lucide-react"

interface DashboardProps {
  metrics: {
    totalRevenue: number
    totalProfit: number
    totalLiters: number
  } | null
}

const Dashboard = ({ metrics }: DashboardProps) => {
  const display = metrics || { totalRevenue: 0, totalProfit: 0, totalLiters: 0 }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Total Litres</p>
            <p className="text-2xl ">{display.totalLiters.toFixed(2)} L</p>
          </div>
          <Fuel className="w-10 h-10 text-green-600" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Revenu Total</p>
            <p className="text-2xl">{display.totalRevenue.toFixed(0)} MRU</p>
          </div>
          <Wallet className="w-10 h-10 text-blue-600" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">Bénéfice Total</p>
            <p className="text-2xl ">{display.totalProfit.toFixed(0)} MRU</p>
          </div>
          <TrendingUp className="w-10 h-10 text-purple-600" />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
