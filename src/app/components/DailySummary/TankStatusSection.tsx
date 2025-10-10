// components/DailySummary/TankStatusSection.tsx
import React from "react"
import { GaugeCircle } from "lucide-react"
import { formatNumber } from "./utils"

interface TankDailyStatus {
  date: string
  tankId: number
  startLevel: number
  endLevel: number
  totalWithdrawn: number
  totalRefilled: number
}

interface Props {
  tankStatuses: { [tankId: number]: TankDailyStatus }
  tankNames: { [tankId: number]: string }
}

export default function TankStatusSection({ tankStatuses, tankNames }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <GaugeCircle className="w-5 h-5 md:w-6 md:h-6" />
        <span>État des Réservoirs</span>
      </h3>
      <div className="space-y-4">
        {Object.values(tankStatuses).map((tank) => {
          const capacityGuess = Math.max(tank.startLevel, tank.endLevel, 1)
          const percent = Math.max(
            0,
            Math.min(100, Math.round((tank.endLevel / capacityGuess) * 100))
          )

          return (
            <div
              key={tank.tankId}
              className="border-b border-gray-100 pb-4 last:border-b-0"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  {tankNames[tank.tankId] || `Réservoir ${tank.tankId}`}
                </span>
                <span className="text-gray-600">
                  {formatNumber(tank.endLevel)} L restants
                </span>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-100 h-2 rounded overflow-hidden">
                  <div
                    className="h-2 bg-green-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {percent}% rempli (estimation)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>Niveau initial: {formatNumber(tank.startLevel)} L</div>
                <div>Total retiré: {formatNumber(tank.totalWithdrawn)} L</div>
                <div>Niveau final: {formatNumber(tank.endLevel)} L</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
