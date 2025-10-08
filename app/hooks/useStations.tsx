import { useState } from "react"

export interface Station {
  id: number
  name: string
  tanks: Tank[]
  pumps: Pump[]
}
export interface Tank {
  id: number
  name: string
  capacity: number
  currentLevel: number
  dateAdded: string
}
export interface Pump {
  id: number
  pumpNumber: string
  nozzles: Nozzle[]
}
export interface Nozzle {
  id: number
  nozzleNumber: number
  fuelType: string
  tankId: number
  salePrice: number
  costPrice: number
  previousIndex: number
  currentIndex: number
  isNew?: boolean
  installIndex?: number
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState<number | null>(null)

  // Intentionally start with empty stations so user can add their own data

  // ───── Station ─────
  const addStation = (name: string) => {
    const newStation: Station = { id: Date.now(), name, tanks: [], pumps: [] }
    setStations([...stations, newStation])
    setSelectedStation(newStation.id)
  }

  const deleteStation = (id: number) => {
    setStations(stations.filter((s) => s.id !== id))
    if (selectedStation === id) setSelectedStation(null)
  }

  // ───── Tank ─────
  const addTank = (stationId: number, tank: Omit<Tank, "id" | "dateAdded">) => {
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              tanks: [
                ...s.tanks,
                {
                  ...tank,
                  id: Date.now(),
                  dateAdded: new Date().toISOString(),
                },
              ],
            }
          : s
      )
    )
  }

  const deleteTank = (stationId: number, tankId: number) => {
    const station = stations.find((s) => s.id === stationId)
    if (!station) return
    const connectedNozzles = station.pumps.reduce(
      (count, pump) =>
        count + pump.nozzles.filter((n) => n.tankId === tankId).length,
      0
    )
    if (connectedNozzles > 0) {
      const confirmMessage = `Attention! La suppression de ce réservoir va supprimer ${connectedNozzles} pistolet(s) connecté(s). Cette action est irréversible. Voulez-vous continuer?`
      if (!confirm(confirmMessage)) {
        return
      }
    }
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s
        return {
          ...s,
          tanks: s.tanks.filter((t) => t.id !== tankId),
          pumps: s.pumps
            .map((pump) => ({
              ...pump,
              nozzles: pump.nozzles.filter((n) => n.tankId !== tankId),
            }))
            .filter((pump) => pump.nozzles.length > 0),
        }
      })
    )
  }

  const updateTank = (
    stationId: number,
    tankId: number,
    updatedTank: Omit<Tank, "id" | "dateAdded">
  ) => {
    setStations((prev) =>
      prev.map((s) =>
        s.id === stationId
          ? {
              ...s,
              tanks: s.tanks.map((t) =>
                t.id === tankId ? { ...t, ...updatedTank } : t
              ),
            }
          : s
      )
    )
  }

  // ───── Pump ─────
  const addPump = (stationId: number, pump: Omit<Pump, "id">) => {
    setStations((prev) =>
      prev.map((s) =>
        s.id === stationId
          ? { ...s, pumps: [...s.pumps, { ...pump, id: Date.now() }] }
          : s
      )
    )
  }

  const deletePump = (stationId: number, pumpId: number) => {
    setStations((prev) =>
      prev.map((s) =>
        s.id === stationId
          ? { ...s, pumps: s.pumps.filter((p) => p.id !== pumpId) }
          : s
      )
    )
  }

  // ───── Nozzle index ─────
 const updateNozzleIndex = (
  stationId: number,
  pumpId: number,
  nozzleId: number,
  newIndex: number,
  prevForCalculation?: number
): { prevIndex: number; liters: number; prevTankLevel?: number } | null => {
  console.log(`[useStations] updateNozzleIndex called`, {
    stationId,
    pumpId,
    nozzleId,
    newIndex,
    prevForCalculation,
  })

  // Find the station, pump, and nozzle
  const station = stations.find((s) => s.id === stationId)
  if (!station) return null
  const pump = station.pumps.find((p) => p.id === pumpId)
  if (!pump) return null
  const nozzle = pump.nozzles.find((n) => n.id === nozzleId)
  if (!nozzle) return null

  // Use prevForCalculation if provided (for same-day updates),
  // otherwise use the last committed previousIndex
  const baselinePrev = prevForCalculation ?? nozzle.currentIndex

  // Calculate change from the baseline
  const delta = newIndex - baselinePrev
  const liters = Math.abs(delta)

  // For dispensing (positive delta), verify sufficient fuel
  const isDispensing = delta > 0
  const litersRequired = isDispensing ? liters : 0

  // Record tank level before mutation
  const prevTankLevel = nozzle.tankId
    ? station.tanks.find((t) => t.id === nozzle.tankId)?.currentLevel
    : undefined
    
  if (nozzle.tankId && litersRequired > 0) {
    const tank = station.tanks.find((t) => t.id === nozzle.tankId)
    if (!tank) return null
    if (tank.currentLevel < litersRequired) {
      console.log("[useStations] update blocked: insufficient tank fuel", {
        tankId: tank.id,
        available: tank.currentLevel,
        required: litersRequired,
      })
      return null
    }
  }

  // Perform the update
  setStations((prevStations) =>
    prevStations.map((s) => {
      if (s.id !== stationId) return s

      let updatedTanks = s.tanks

      const updatedPumps = s.pumps.map((p) => {
        if (p.id !== pumpId) return p

        return {
          ...p,
          nozzles: p.nozzles.map((n) => {
            if (n.id !== nozzleId) return n

            // Update tank level based on the delta from baselinePrev
            if (n.tankId) {
              updatedTanks = updatedTanks.map((t) => {
                if (t.id !== n.tankId) return t

                const currentLevel = t.currentLevel ?? 0
                const capacity = t.capacity ?? 0

                if (delta > 0) {
                  // Dispensing: decrease tank
                  return {
                    ...t,
                    currentLevel: Math.max(currentLevel - delta, 0),
                  }
                } else {
                  // Correction: restore fuel
                  const correction = Math.abs(delta)
                  return {
                    ...t,
                    currentLevel: Math.min(currentLevel + correction, capacity),
                  }
                }
              })
            }

            // Update currentIndex
            return { ...n, currentIndex: newIndex }
          }),
        }
      })

      return { ...s, pumps: updatedPumps, tanks: updatedTanks }
    })
  )

  // Return authoritative values for history
  return {
    prevIndex: baselinePrev,
    liters,
    prevTankLevel,
  }
}

  const currentStation = stations.find((s) => s.id === selectedStation) || null

  // Commit: set previousIndex = currentIndex for all nozzles of a station
  const commitAllNozzles = (stationId: number) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s
        return {
          ...s,
          pumps: s.pumps.map((p) => ({
            ...p,
            nozzles: p.nozzles.map((n) => ({
              ...n,
              previousIndex: n.currentIndex,
            })),
          })),
        }
      })
    )
  }

  // Lightweight helper: update a nozzle's currentIndex in memory/state without
  // altering tanks. Use this after we've performed the authoritative station
  // mutation (which already handled tank decrements) to keep the UI and
  // in-memory nozzle objects consistent for subsequent same-day updates.
  const setNozzleCurrentIndex = (
    stationId: number,
    pumpId: number,
    nozzleId: number,
    newIndex: number
  ) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s
        return {
          ...s,
          pumps: s.pumps.map((p) => {
            if (p.id !== pumpId) return p
            return {
              ...p,
              nozzles: p.nozzles.map((n) =>
                n.id === nozzleId ? { ...n, currentIndex: newIndex } : n
              ),
            }
          }),
        }
      })
    )
  }

  return {
    stations,
    selectedStation,
    setSelectedStation,
    currentStation,
    addStation,
    deleteStation,
    addTank,
    deleteTank,
    addPump,
    deletePump,
    updateNozzleIndex,
    updateTank,
    setNozzleCurrentIndex,
    commitAllNozzles,
  }
}
