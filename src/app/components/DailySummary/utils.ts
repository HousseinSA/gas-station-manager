// components/DailySummary/utils.ts
export const formatNumber = (num: number) =>
  new Intl.NumberFormat("fr-MR").format(num)

export const formatCurrency = (num: number) => {
  return `${new Intl.NumberFormat("fr-MR", {
    maximumFractionDigits: 0,
  }).format(num)} MRU`
}
