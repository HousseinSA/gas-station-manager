import React from "react"
import { Calendar } from "lucide-react"

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

interface DailySummaryProps {
  date: string
  metrics: DailyMetrics | null
  tankStatuses: { [tankId: number]: TankDailyStatus }
  tankNames: { [tankId: number]: string }
  pumpNumbers: { [pumpId: number]: string }
}

const DailySummary = ({
  date,
  metrics,
  tankStatuses,
  tankNames,
  pumpNumbers,
}: DailySummaryProps) => {
  if (!metrics) {
    return (
      <div className="text-center p-8 text-gray-500">
        Aucune donnée disponible pour cette date
      </div>
    )
  }

  const formatNumber = (num: number) =>
    new Intl.NumberFormat("fr-MR").format(num)

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center gap-2 text-xl font-medium">
        <Calendar className="w-6 h-6" />
        <span>{new Date(date).toLocaleDateString("fr-MR")}</span>
      </div>
      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Volume Total</div>
          <div className="text-2xl font-medium">{formatNumber(metrics.totalLiters)} L</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Revenu Total</div>
          <div className="text-2xl font-medium">{formatNumber(metrics.totalRevenue)} MRU</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Bénéfice Total</div>
          <div className="text-2xl font-medium">{formatNumber(metrics.totalProfit)} MRU</div>
        </div>
      </div>

      {/* Tank Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">État des Réservoirs</h3>
        <div className="space-y-4">
          {Object.values(tankStatuses).map((tank) => (
            <div key={tank.tankId} className="border-b pb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{tankNames[tank.tankId]}</span>
                <span className="text-gray-600">{formatNumber(tank.endLevel)} L restants</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Niveau initial: {formatNumber(tank.startLevel)} L</div>
                <div>Total retiré: {formatNumber(tank.totalWithdrawn)} L</div>
                <div>Total rempli: {formatNumber(tank.totalRefilled)} L</div>
                <div>Niveau final: {formatNumber(tank.endLevel)} L</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pump Details */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Détails par Pompe</h3>
        <div className="space-y-4">
          {Object.entries(metrics.byPump).map(([pumpId, pump]) => (
            <div key={pumpId} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-md">Pompe {pump.pumpName || pumpNumbers[parseInt(pumpId)]}</div>
                <div className="text-sm text-gray-600">Volume total: {formatNumber(pump.totalLiters)} L</div>
              </div>
              <div className="mt-2 space-y-2">
                {Object.entries(pump.byNozzle).map(([nozzleId, nozzle]) => (
                  <div key={nozzleId} className="grid grid-cols-3 gap-4 items-center py-1">
                    <div className="font-medium">{nozzle.nozzleLabel || `Pistolet ${parseInt(nozzleId) + 1}`}</div>
                    <div className="text-gray-700">{formatNumber(nozzle.liters)} L</div>
                    <div className="text-gray-700">{formatNumber(nozzle.revenue)} MRU</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DailySummary
