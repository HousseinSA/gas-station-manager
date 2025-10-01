import { Station } from "./useStations"

export function useMetrics(station: Station | null) {
  if (!station) return { totalRevenue: 0, totalProfit: 0, totalLiters: 0 }

  let totalRevenue = 0,
    totalProfit = 0,
    totalLiters = 0

  station.pumps.forEach((pump) => {
    pump.nozzles.forEach((nozzle) => {
      const liters = nozzle.currentIndex - nozzle.previousIndex
      const revenue = liters * nozzle.salePrice
      const cost = liters * nozzle.costPrice
      const profit = revenue - cost

      totalLiters += liters
      totalRevenue += revenue
      totalProfit += profit
    })
  })

  return { totalRevenue, totalProfit, totalLiters }
}
