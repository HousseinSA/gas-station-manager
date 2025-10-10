import { Station } from "./useStations"

export function useMetrics(station: Station | null) {
  if (!station) return { totalRevenue: 0, totalProfit: 0, totalLiters: 0 }

  let totalRevenue = 0,
    totalProfit = 0,
    totalLiters = 0

  station.pumps.forEach((pump) => {
    pump.nozzles.forEach((nozzle) => {
      // If currentIndex exists, use it as the basis for calculation
      // Calculate total change since last committed previousIndex
      const currentIndex =
        typeof nozzle.currentIndex === "number" ? nozzle.currentIndex : 0
      const previousIndex =
        typeof nozzle.previousIndex === "number" ? nozzle.previousIndex : 0
      const delta = currentIndex - previousIndex

      // Only count positive changes (dispensing) in metrics
      const liters = delta > 0 ? delta : 0
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
