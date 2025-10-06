import { useState, useEffect } from "react"

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

  useEffect(() => {
    if (stations.length === 0) {
      const demo: Station = {
        id: 1,
        name: "Station Principale",
        tanks: [
          {
            id: 1,
            name: "Réservoir Gasoil",
            capacity: 10000,
            currentLevel: 8000,
            dateAdded: new Date().toISOString(),
          },
        ],
        pumps: [
          {
            id: 1,
            pumpNumber: "1",
            nozzles: [
              {
                id: 1,
                nozzleNumber: 1,
                fuelType: "Gasoil",
                tankId: 0,
                salePrice: 550,
                costPrice: 480,
                previousIndex: 0,
                currentIndex: 0,
              },
            ],
          },
        ],
      }
      setStations([demo])
      setSelectedStation(1)
    }
  }, [stations.length])

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

  // ───── Nozzle index ─────
  const updateNozzleIndex = (
    stationId: number,
    pumpId: number,
    nozzleId: number,
    newIndex: number
  ) => {
    console.log(`[useStations] updateNozzleIndex called`, {
      stationId,
      pumpId,
      nozzleId,
      newIndex,
    })

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

              const litersDispensed = newIndex - n.previousIndex

              // If there's a connected tank, subtract the dispensed liters (clamped to 0)
              if (n.tankId) {
                updatedTanks = updatedTanks.map((t) =>
                  t.id === n.tankId
                    ? {
                        ...t,
                        currentLevel: Math.max(
                          t.currentLevel - litersDispensed,
                          0
                        ),
                      }
                    : t
                )
              }

              return { ...n, currentIndex: newIndex }
            }),
          }
        })

        return { ...s, pumps: updatedPumps, tanks: updatedTanks }
      })
    )
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
  }
}
