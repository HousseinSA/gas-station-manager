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
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState<number | null>(null)

  // Load initial demo station
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
  }, [])

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
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? { ...s, tanks: s.tanks.filter((t) => t.id !== tankId) }
          : s
      )
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

  const updatePump = (stationId: number, pumpId: number, updatedPump: Omit<Pump, "id">) => {
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
    setStations(
      stations.map((s) =>
        s.id === stationId
          ? {
              ...s,
              pumps: s.pumps.map((p) =>
                p.id === pumpId
                  ? {
                      ...p,
                      nozzles: p.nozzles.map((n) =>
                        n.id === nozzleId ? { ...n, currentIndex: newIndex } : n
                      ),
                    }
                  : p
              ),
            }
          : s
      )
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
