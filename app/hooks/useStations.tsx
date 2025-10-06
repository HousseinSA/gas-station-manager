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
    setStations(
      stations.map((s) => {
        if (s.id !== stationId) return s

        return {
          ...s,
          tanks: s.tanks.filter((t) => t.id !== tankId),
          // Remove pumps that have no nozzles left after filtering
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

  // ───── Pump ─────
  const addPump = (stationId: number, pump: Omit<Pump, "id">) => {
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? { ...s, pumps: [...s.pumps, { ...pump, id: Date.now() }] }
          : s
      )
    )
  }

  const deletePump = (stationId: number, pumpId: number) => {
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? { ...s, pumps: s.pumps.filter((p) => p.id !== pumpId) }
          : s
      )
    )
  }

  const updatePump = (
    stationId: number,
    pumpId: number,
    updatedPump: Omit<Pump, "id">
  ) => {
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              pumps: s.pumps.map((p) =>
                p.id === pumpId ? { ...updatedPump, id: pumpId } : p
              ),
            }
          : s
      )
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

  // ───── Nozzle index ─────
  const updateNozzleIndex = (
    stationId: number,
    pumpId: number,
    nozzleId: number,
    newIndex: number
  ): boolean => {
    console.log(`[useStations] updateNozzleIndex called`, {
      stationId,
      pumpId,
      nozzleId,
      newIndex,
    })

    // First, perform a pre-check to ensure connected tank (if any) has enough fuel
    const station = stations.find((s) => s.id === stationId)
    if (!station) return false
    const pump = station.pumps.find((p) => p.id === pumpId)
    if (!pump) return false
    const nozzle = pump.nozzles.find((n) => n.id === nozzleId)
    if (!nozzle) return false

    const prev =
      typeof nozzle.previousIndex === "number" ? nozzle.previousIndex : 0
    const litersRequired = Math.max(newIndex - prev, 0)
    if (nozzle.tankId && litersRequired > 0) {
      const tank = station.tanks.find((t) => t.id === nozzle.tankId)
      if (!tank) return false
      if (tank.currentLevel < litersRequired) {
        // Not enough fuel; reject the update
        console.log("[useStations] update blocked: insufficient tank fuel", {
          tankId: tank.id,
          available: tank.currentLevel,
          required: litersRequired,
        })
        return false
      }
    }

    // If pre-check passed, perform the update
    setStations((prevStations) =>
      prevStations.map((s) => {
        if (s.id !== stationId) return s

        // We'll update pumps and possibly tanks for this station
        let updatedTanks = s.tanks

        const updatedPumps = s.pumps.map((p) => {
          if (p.id !== pumpId) return p

          return {
            ...p,
            nozzles: p.nozzles.map((n) => {
              if (n.id !== nozzleId) return n

              // Calculate liters using the stored previousIndex
              const prev = typeof n.previousIndex === "number" ? n.previousIndex : 0
              const litersDispensed = Math.max(newIndex - prev, 0)

              // If there's a connected tank and liters is positive, subtract the dispensed liters (clamped to 0)
              if (n.tankId && litersDispensed > 0) {
                updatedTanks = updatedTanks.map((t) =>
                  t.id === n.tankId
                    ? {
                        ...t,
                        currentLevel: Math.max(t.currentLevel - litersDispensed, 0),
                      }
                    : t
                )
              }

              // Only update the currentIndex; preserve previousIndex (represents last closing reading)
              // previousIndex must remain unchanged here so history calculations continue to use the original baseline
              return {
                ...n,
                currentIndex: newIndex,
              }
            }),
          }
        })

        return { ...s, pumps: updatedPumps, tanks: updatedTanks }
      })
    )

    return true
  }

  const currentStation = stations.find((s) => s.id === selectedStation) || null

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
    updatePump,
    updateNozzleIndex,
    updateTank,
  }
}
