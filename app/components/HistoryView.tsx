import React, { useState } from "react"
import DailySummary from "../components/DailySummary/index"
interface HistoryViewProps {
  stationId: number
  tankNames: { [tankId: number]: string }
  pumpNumbers: { [pumpId: number]: string }
  onDateChange: (date: string) => void
  metrics: {
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
  } | null
  tankStatuses: {
    [tankId: number]: {
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
  }
}

const HistoryView = ({
  stationId,
  tankNames,
  pumpNumbers,
  onDateChange,
  metrics,
  tankStatuses,
}: HistoryViewProps) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setSelectedDate(newDate)
    onDateChange(newDate)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sélectionner une date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      <DailySummary
        date={selectedDate}
        metrics={metrics}
        tankStatuses={tankStatuses}
        tankNames={tankNames}
        pumpNumbers={pumpNumbers}
      />
    </div>
  )
}

export default HistoryView
