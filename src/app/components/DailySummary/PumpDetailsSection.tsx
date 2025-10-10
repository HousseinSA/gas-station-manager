// components/DailySummary/PumpDetailsSection.tsx
import React from "react"
import { Fuel } from "lucide-react"
import { formatNumber, formatCurrency } from "./utils"

interface NozzleData {
  liters: number
  revenue: number
  profit: number
  nozzleLabel?: string
}

interface PumpData {
  pumpName?: string
  totalLiters: number
  byNozzle: { [nozzleId: number]: NozzleData }
}

interface Props {
  byPump: { [pumpId: number]: PumpData }
  pumpNumbers: { [pumpId: number]: string }
}

export default function PumpDetailsSection({ byPump, pumpNumbers }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Fuel className="w-5 h-5 md:w-6 md:h-6" />
        <span>Détails par Pompe</span>
      </h3>

      <div className="space-y-4">
        {Object.entries(byPump).map(([pumpId, pump]) => (
          <div
            key={pumpId}
            className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 bg-gray-50/50 transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-md">
                Pompe {pump.pumpName || pumpNumbers[parseInt(pumpId)]}
              </div>
              <div className="text-sm text-gray-600">
                Volume total: {formatNumber(pump.totalLiters)} L
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-1">
                <div className="col-span-6">Pistolet</div>
                <div className="col-span-2 text-right">Litres</div>
                <div className="col-span-2 text-right">Revenu</div>
                <div className="col-span-2 text-right">Bénéfice</div>
              </div>
              <div className="space-y-2 mt-2">
                {Object.entries(pump.byNozzle).map(([nozzleId, nozzle]) => (
                  <div
                    key={nozzleId}
                    className="grid grid-cols-12 gap-2 text-sm text-gray-800 py-1"
                  >
                    <div className="col-span-6 font-medium">
                      {nozzle.nozzleLabel || `Pistolet ${nozzleId}`}
                    </div>
                    <div className="col-span-2 text-right">
                      {formatNumber(nozzle.liters)} L
                    </div>
                    <div className="col-span-2 text-right">
                      {formatCurrency(nozzle.revenue)}
                    </div>
                    <div
                      className={`col-span-2 text-right ${
                        nozzle.profit > 0
                          ? "text-green-600"
                          : nozzle.profit < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {formatCurrency(nozzle.profit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
