import { useEffect, useState } from "react"

export interface Station {
  id?: number
  _id?: any
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
  fuelType: "Gasoil" | "Essence" // Only allow these two fuel types
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
  const [selectedStation, setSelectedStation] = useState<
    number | string | null
  >(null)

  // Flexible id comparison helper: supports numeric `id` or MongoDB `_id` strings
  const idEquals = (a: any, b: any) => {
    if (a === undefined || a === null || b === undefined || b === null)
      return false
    return String(a) === String(b)
  }

  // Intentionally start with empty stations so user can add their own data

  // ───── Station ─────
  // Load stations from server on mount
  useEffect(() => {
    let mounted = true
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data: Station[]) => {
        if (!mounted) return
        // Keep backward-compatible shape (id may be number or _id)
        const normalized = data.map((s) => ({ ...s }))
        setStations(normalized)
        if (normalized.length > 0)
          setSelectedStation(normalized[0].id ?? normalized[0]._id ?? null)
      })
      .catch((e) => console.error("Failed to load stations", e))
    return () => {
      mounted = false
    }
  }, [])

  const addStation = async (name: string) => {
    const newStation: Station = { id: Date.now(), name, tanks: [], pumps: [] }
    // Optimistic UI
    setStations((prev) => [...prev, newStation])
    setSelectedStation(newStation.id ?? newStation._id ?? null)
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStation),
      })
      const created = await res.json()
      // Replace temp item if the server returned object with id/_id
      setStations((prev) =>
        prev.map((s) =>
          idEquals(s.id ?? s._id, newStation.id) ? { ...created } : s
        )
      )
      setSelectedStation(created.id ?? created._id ?? null)
    } catch (e) {
      console.error("Failed to create station", e)
    }
  }

  const deleteStation = async (id: number) => {
    // Optimistic
    setStations((prev) => prev.filter((s) => !idEquals(s.id ?? s._id, id)))
    if (idEquals(selectedStation, id)) setSelectedStation(null)
    try {
      await fetch(`/api/stations?id=${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Failed to delete station", e)
    }
  }

  // ───── Tank ─────
  const addTank = async (
    stationId: any,
    tank: Omit<Tank, "id" | "dateAdded">
  ) => {
    if (!tank.fuelType) {
      console.error("Fuel type is required")
      return
    }

    const newTank = {
      ...tank,
      id: Date.now(),
      dateAdded: new Date().toISOString(),
    }
    setStations((prev) =>
      prev.map((s) =>
        idEquals(s.id ?? s._id, stationId)
          ? { ...s, tanks: [...s.tanks, newTank] }
          : s
      )
    )
    // Persist station update
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = { ...station, tanks: [...station.tanks, newTank] }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist tank", e)
    }
  }

  const deleteTank = async (stationId: any, tankId: number) => {
    const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
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
        if (!idEquals(s.id ?? s._id, stationId)) return s
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
    // Persist
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = {
          ...station,
          tanks: station.tanks.filter((t) => t.id !== tankId),
          pumps: station.pumps
            .map((pump) => ({
              ...pump,
              nozzles: pump.nozzles.filter((n) => n.tankId !== tankId),
            }))
            .filter((pump) => pump.nozzles.length > 0),
        }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist tank deletion", e)
    }
  }

  const updateTank = async (
    stationId: any,
    tankId: number,
    updatedTank: Omit<Tank, "id" | "dateAdded">
  ) => {
    setStations((prev) =>
      prev.map((s) =>
        idEquals(s.id ?? s._id, stationId)
          ? {
              ...s,
              tanks: s.tanks.map((t) =>
                t.id === tankId ? { ...t, ...updatedTank } : t
              ),
            }
          : s
      )
    )
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = {
          ...station,
          tanks: station.tanks.map((t) =>
            t.id === tankId ? { ...t, ...updatedTank } : t
          ),
        }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist tank update", e)
    }
  }

  // ───── Pump ─────
  const addPump = async (stationId: any, pump: Omit<Pump, "id">) => {
    const newPump = { ...pump, id: Date.now() }
    setStations((prev) =>
      prev.map((s) =>
        idEquals(s.id ?? s._id, stationId)
          ? { ...s, pumps: [...s.pumps, newPump] }
          : s
      )
    )
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = { ...station, pumps: [...station.pumps, newPump] }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist pump", e)
    }
  }

  const deletePump = async (stationId: any, pumpId: number) => {
    setStations((prev) =>
      prev.map((s) =>
        idEquals(s.id ?? s._id, stationId)
          ? { ...s, pumps: s.pumps.filter((p) => p.id !== pumpId) }
          : s
      )
    )
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = {
          ...station,
          pumps: station.pumps.filter((p) => p.id !== pumpId),
        }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist pump deletion", e)
    }
  }

  const updatePump = async (
    stationId: any,
    pumpId: number,
    updates: Partial<Omit<Pump, "id">>
  ) => {
    setStations((prev) =>
      prev.map((s) => {
        if (!idEquals(s.id ?? s._id, stationId)) return s
        return {
          ...s,
          pumps: s.pumps.map((p) =>
            p.id !== pumpId ? p : { ...p, ...updates }
          ),
        }
      })
    )
    try {
      const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
      if (station) {
        const updated = {
          ...station,
          pumps: station.pumps.map((p) =>
            p.id !== pumpId ? p : { ...p, ...updates }
          ),
        }
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        })
      }
    } catch (e) {
      console.error("Failed to persist pump update", e)
    }
  }

  // ───── Nozzle index ─────
  const updateNozzleIndex = (
    stationId: any,
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
    const station = stations.find((s) => idEquals(s.id ?? s._id, stationId))
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
    const liters = delta > 0 ? delta : 0 // Only count positive changes as real dispensing

    console.log("[useStations] Calculating tank changes:", {
      nozzleId,
      baselinePrev,
      newIndex,
      delta,
      liters,
      tankId: nozzle.tankId,
    })

    const isDispensing = delta > 0
    const litersRequired = isDispensing ? liters : 0

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

    // Build updated station object (so we can both set state and persist)
    const updatedStation = (() => {
      // clone station
      const cloned = JSON.parse(JSON.stringify(station)) as any
      let updatedTanks = cloned.tanks

      cloned.pumps = cloned.pumps.map((p: any) => {
        if (p.id !== pumpId) return p
        const newNozzles = p.nozzles.map((n: any) => {
          if (n.id !== nozzleId) return n

          // Update tank level based on actual dispensed amount
          if (n.tankId) {
            updatedTanks = updatedTanks.map((t: any) => {
              if (t.id !== n.tankId) return t

              const currentLevel = t.currentLevel ?? 0

              if (delta < 0) {
                const correction = Math.abs(delta)
                return {
                  ...t,
                  currentLevel: Math.min(currentLevel + correction, t.capacity),
                }
              }
              if (delta > 0) {
                return { ...t, currentLevel: Math.max(currentLevel - delta, 0) }
              }
              return t
            })
          }

          return { ...n, currentIndex: newIndex }
        })
        return { ...p, nozzles: newNozzles }
      })

      cloned.tanks = updatedTanks
      return cloned
    })()

    // Update local state immediately
    setStations((prev) =>
      prev.map((s) => (idEquals(s.id ?? s._id, stationId) ? updatedStation : s))
    )

    // Persist in background (fire-and-forget)
    ;(async () => {
      try {
        await fetch("/api/stations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedStation),
        })
      } catch (err) {
        console.error("Failed to persist nozzle update", err)
      }
    })()

    // Return authoritative values for history
    return {
      prevIndex: baselinePrev,
      liters,
      prevTankLevel,
    }
  }

  const currentStation =
    stations.find((s) => idEquals(s.id ?? s._id, selectedStation)) || null

  // Commit: set previousIndex = currentIndex for all nozzles of a station
  const commitAllNozzles = (stationId: any) => {
    setStations((prev) => {
      const updated = prev.map((s) => {
        if (!idEquals(s.id ?? s._id, stationId)) return s
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

      // Persist the updated station document if we can find it
      ;(async () => {
        try {
          const station = updated.find((s) =>
            idEquals(s.id ?? s._id, stationId)
          )
          if (station) {
            await fetch("/api/stations", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(station),
            })
          }
        } catch (e) {
          console.error("Failed to persist commitAllNozzles", e)
        }
      })()

      return updated
    })
  }

  // Lightweight helper: update a nozzle's currentIndex in memory/state without
  // altering tanks. Use this after we've performed the authoritative station
  // mutation (which already handled tank decrements) to keep the UI and
  // in-memory nozzle objects consistent for subsequent same-day updates.
  const setNozzleCurrentIndex = (
    stationId: any,
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
    updatePump,
    updateNozzleIndex,
    updateTank,
    setNozzleCurrentIndex,
    commitAllNozzles,
  }
}
