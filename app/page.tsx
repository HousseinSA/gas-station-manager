"use client"
import React, { useState } from "react"
import { Plus, Trash2, LogOut, Fuel } from "lucide-react"

import { useAuth } from "./hooks/useAuth"
import { useStations, Nozzle } from "./hooks/useStations"
import { useMetrics } from "./hooks/useMetrics"
import { useIndexHistory } from "./hooks/useIndexHistory"
import { useTankHistory } from "./hooks/useTankHistory"

import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import Pumps from "./components/Pumps"
import HistoryView from "./components/HistoryView"
import StationModal from "./components/StationModal"
import TankModal from "./components/TankModal"
import PumpModal from "./components/PumpModal"
import UserManagementView from "./components/UserManagementView"
import Tanks from "./components/Tanks"

interface PumpForm {
  pumpNumber: string
  nozzleCount: string
  nozzles: Nozzle[]
}

// Build a proper Nozzle object from a partial input (used to sanitize form objects)
function normalizeNozzle(n: Partial<Nozzle>): Nozzle {
  return {
    id: Number(n.id) || Date.now(),
    nozzleNumber: Number(n.nozzleNumber) || 1,
    fuelType: n.fuelType || "Gasoil",
    tankId: Number(n.tankId) || 0,
    salePrice: Number(n.salePrice) || 0,
    costPrice: Number(n.costPrice) || 0,
    previousIndex: Number(n.previousIndex) || 0,
    currentIndex: Number(n.currentIndex) || Number(n.previousIndex) || 0,
    installIndex:
      typeof n.installIndex === "number"
        ? n.installIndex
        : Number(n.previousIndex) || Number(n.currentIndex) || 0,
  }
}

const GasStationApp = () => {
  const {
    isLoggedIn,
    isAdmin,
    users,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    canAccessStation,
    canViewSection,
  } = useAuth()
  const {
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
  } = useStations()
  const metrics = useMetrics(currentStation)
  const indexHistory = useIndexHistory()
  const tankHistory = useTankHistory(currentStation?.id || null)
  // Ref map to track the latest known currentIndex for each nozzle immediately
  // (avoids relying on async setState or indexHistory state flushing).
  const nozzleLatestIndexRef = React.useRef<Record<number, number>>({})

  // Auto-commit previousIndex to currentIndex at local midnight, then every 24h
  React.useEffect(() => {
    if (!currentStation) return

    let intervalId: number | null = null
    let timeoutId: number | null = null

    const scheduleNextMidnight = () => {
      const now = new Date()
      const next = new Date(now)
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      const msUntilNext = next.getTime() - now.getTime()

      timeoutId = window.setTimeout(() => {
        try {
          if (currentStation) commitAllNozzles(currentStation.id)
        } catch (e) {
          console.error("Error committing nozzles at midnight", e)
        }
        // after the first execution at midnight, set recurring interval every 24h
        intervalId = window.setInterval(() => {
          try {
            if (currentStation) commitAllNozzles(currentStation.id)
          } catch (e) {
            console.error("Error in daily commit interval", e)
          }
        }, 24 * 60 * 60 * 1000)
      }, msUntilNext)
    }

    scheduleNextMidnight()

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [currentStation, commitAllNozzles])

  // UI states
  const [activeTab, setActiveTab] = useState("tableau-de-bord")
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [showStationModal, setShowStationModal] = useState(false)
  const [showTankModal, setShowTankModal] = useState(false)
  const [showPumpModal, setShowPumpModal] = useState(false)
  const [isEditingPump, setIsEditingPump] = useState(false)
  const [editingTankId, setEditingTankId] = useState<number | null>(null)

  // Temporary form states
  const [stationForm, setStationForm] = useState({ name: "" })
  const [tankForm, setTankForm] = useState({
    name: "",
    capacity: "",
    currentLevel: "",
  })
  const [pumpForm, setPumpForm] = useState<PumpForm>({
    pumpNumber: "",
    nozzleCount: "1",
    nozzles: [],
  })

  // ───── Handlers ─────
  const handleLogin = (password: string) => {
    if (!login(password)) {
      alert("Mot de passe incorrect ! Pour admin: admin123")
    }
  }

  const handleAddStation = () => {
    if (!stationForm.name.trim()) return
    // Only admins can create stations
    if (!isAdmin) {
      alert("Vous n'êtes pas autorisé à créer une station.")
      return
    }
    addStation(stationForm.name)
    setStationForm({ name: "" })
    setShowStationModal(false)
  }

  const handleAddTank = (payload: {
    name: string
    capacity: number
    currentLevel: number
  }) => {
    console.log("[page] handleAddTank called", {
      currentStationId: currentStation?.id,
      payload,
    })
    if (!currentStation || !payload.name.trim() || !payload.capacity) return
    addTank(currentStation.id, {
      name: payload.name,
      capacity: payload.capacity,
      currentLevel: Math.min(payload.currentLevel || 0, payload.capacity),
    })
    setTankForm({ name: "", capacity: "", currentLevel: "" })
    setShowTankModal(false)
  }

  const handleAddPump = () => {
    if (!currentStation) return

    // If pump number is blank, we'll auto-assign a numeric pump number
    const assignedPumpNumber = pumpForm.pumpNumber.trim()
      ? pumpForm.pumpNumber
      : String(currentStation.pumps.length + 1)

    // Check for duplicate pump number when adding a new pump
    const isDuplicatePumpNumber = currentStation.pumps.some(
      (p) => p.pumpNumber === assignedPumpNumber
    )

    if (!isEditingPump && isDuplicatePumpNumber) {
      alert("Ce numéro de pompe existe déjà dans la station")
      return
    }

    if (pumpForm.nozzles.length === 0) {
      alert("Au moins un pistolet est requis")
      return
    }

    if (isEditingPump) {
      const existingPump = currentStation.pumps.find(
        (p) => p.nozzles[0].id === pumpForm.nozzles[0].id
      )

      if (existingPump) {
        updatePump(currentStation.id, existingPump.id, {
          pumpNumber: pumpForm.pumpNumber,
          nozzles: pumpForm.nozzles.map((nozzle) => normalizeNozzle(nozzle)),
        })
      }
    } else {
      const nozzlesWithCorrectIndex = pumpForm.nozzles.map((nozzle) => {
        const normalized = normalizeNozzle(nozzle)
        return { ...normalized, currentIndex: normalized.previousIndex }
      })

      addPump(currentStation.id, {
        pumpNumber: assignedPumpNumber,
        nozzles: nozzlesWithCorrectIndex,
      })
    }
    setPumpForm({ pumpNumber: "", nozzleCount: "1", nozzles: [] })
    setShowPumpModal(false)
  }

  // Pump modal now manages nozzle edits locally; parent persists on save

  // Format number with thousand separators for currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("fr-MR").format(value)
  }

  // ───── Render ─────
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Fuel className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Gestion Stations-Service</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setActiveTab("users")}
                className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded hover:bg-green-800"
              >
                Gérer Utilisateurs
              </button>
            )}
            {currentStation && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Clôturer la journée pour cette station maintenant ? (Si vous ne le faites pas, la mise à jour se fera automatiquement au prochain minuit)."
                    )
                  ) {
                    // For each nozzle, create history entry for accumulated changes since last commit
                    currentStation.pumps.forEach((pump) => {
                      pump.nozzles.forEach((nozzle) => {
                        // Only create history if there are changes
                        if (nozzle.currentIndex !== nozzle.previousIndex) {
                          const liters = Math.abs(
                            nozzle.currentIndex - nozzle.previousIndex
                          )

                          // Create the index history entry
                          indexHistory.addIndexUpdate({
                            nozzleId: nozzle.id,
                            pumpId: pump.id,
                            previousIndex: nozzle.previousIndex,
                            currentIndex: nozzle.currentIndex,
                            liters,
                            salePrice: nozzle.salePrice,
                            costPrice: nozzle.costPrice,
                            pumpName: pump.pumpNumber,
                            nozzleLabel: `Pistolet ${nozzle.nozzleNumber}`,
                          })
                        }
                      })
                    })

                    // Now commit all nozzles (updates previousIndex = currentIndex)
                    commitAllNozzles(currentStation.id)

                    alert(
                      "Journée clôturée manuellement : previousIndex mis à jour."
                    )
                  }
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Clôturer journée
              </button>
            )}
            {/* automatic daily commit active; manual commit button removed */}
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded hover:bg-green-800"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              value={selectedStation || ""}
              onChange={(e) => setSelectedStation(Number(e.target.value))}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 "
            >
              <option value="">Sélectionner une station</option>
              {stations
                .filter((s) => isAdmin || canAccessStation(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            {isAdmin && (
              <>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setStationForm({ name: "" })
                      setShowStationModal(true)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle Station
                  </button>
                )}
                {selectedStation && (
                  <button
                    onClick={() => {
                      const stationIdToDelete = selectedStation
                      const usersWithAccess = users.filter((u) =>
                        u.allowedStations.includes(stationIdToDelete)
                      )

                      if (usersWithAccess.length > 0) {
                        // Remove non-admin users who only had this station
                        usersWithAccess.forEach((user) => {
                          // If user is admin (shouldn't be in users list), skip
                          // remove station from their allowedStations
                          const remaining = user.allowedStations.filter(
                            (s) => s !== stationIdToDelete
                          )
                          if (remaining.length === 0) {
                            // delete the user (they no longer have stations)
                            deleteUser(user.id)
                          } else {
                            // otherwise update their allowed stations
                            updateUser(user.id, { allowedStations: remaining })
                          }
                        })
                      }
                      if (
                        confirm(
                          "Supprimer cette station? Cette action est irréversible."
                        )
                      ) {
                        deleteStation(stationIdToDelete)
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer Station
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {currentStation ? (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-4">
              <div className="flex border-b overflow-x-auto">
                {[
                  { id: "tableau-de-bord", label: "Tableau de Bord" },
                  { id: "reservoirs", label: "Réservoirs" },
                  { id: "pompes", label: "Pompes" },
                  { id: "historique", label: "Historique" },
                  { id: "users", label: "Utilisateurs", adminOnly: true },
                ]
                  .filter((tab) =>
                    tab.adminOnly ? isAdmin : canViewSection(tab.id)
                  )
                  .map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-b-2 border-green-600 text-green-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Dashboard */}
            {activeTab === "tableau-de-bord" && (
              <Dashboard
                metrics={
                  indexHistory.getDailyMetrics(selectedDate) || {
                    totalRevenue: metrics.totalRevenue,
                    totalProfit: metrics.totalProfit,
                    totalLiters: metrics.totalLiters,
                  }
                }
              />
            )}

            {/* Tanks */}
            {activeTab === "reservoirs" && (
              <Tanks
                tanks={currentStation.tanks}
                onAddTank={() => setShowTankModal(true)}
                onDeleteTank={(tankId) => deleteTank(currentStation.id, tankId)}
                onEditTank={(tankId) => {
                  const tank = currentStation.tanks.find((t) => t.id === tankId)
                  if (tank) {
                    setEditingTankId(tankId)
                    setTankForm({
                      name: tank.name,
                      capacity: String(tank.capacity),
                      currentLevel: String(tank.currentLevel),
                    })
                    setShowTankModal(true)
                  }
                }}
              />
            )}

            {/* Pumps */}
            {activeTab === "pompes" && (
              <Pumps
                pumps={currentStation.pumps}
                tanks={currentStation.tanks}
                isAdmin={isAdmin}
                onAddPump={() => {
                  setIsEditingPump(false)
                  setShowPumpModal(true)
                }}
                onDeletePump={(pumpId) => deletePump(currentStation.id, pumpId)}
                onUpdateNozzleIndex={(pumpId, nozzleId, newIndex) => {
                  if (!currentStation) return

                  const pump = currentStation.pumps.find((p) => p.id === pumpId)
                  if (!pump) return

                  const nozzle = pump.nozzles.find((n) => n.id === nozzleId)
                  if (!nozzle) return

                  const prevIndexToUse =
                    nozzleLatestIndexRef.current[nozzleId] ??
                    nozzle.currentIndex

                  const result = updateNozzleIndex(
                    currentStation.id,
                    pumpId,
                    nozzleId,
                    newIndex,
                    prevIndexToUse
                  )
                  if (!result) {
                    alert(
                      "Impossible: le réservoir connecté à ce pistolet ne contient pas assez de carburant."
                    )
                    return
                  }

                  const { prevIndex, liters, prevTankLevel } = result

                  // Create history entry to track changes immediately
                  indexHistory.addIndexUpdate({
                    nozzleId,
                    pumpId,
                    previousIndex: prevIndex,
                    currentIndex: newIndex,
                    liters,
                    salePrice: nozzle.salePrice,
                    costPrice: nozzle.costPrice,
                    pumpName: pump.pumpNumber,
                    nozzleLabel: `Pistolet ${nozzle.nozzleNumber}`,
                  })

                  // Keep fast-update ref in sync for UI
                  nozzleLatestIndexRef.current[nozzleId] = newIndex

                  console.log("[page] Updated nozzleLatestIndexRef:", {
                    nozzleId,
                    newValue: newIndex,
                    allValues: { ...nozzleLatestIndexRef.current },
                  })

                  // Update tank history with authoritative values
                  if (nozzle.tankId && liters > 0) {
                    tankHistory.updateTankFromPumpUsage(
                      nozzle.tankId,
                      liters,
                      prevTankLevel
                    )
                  }
                }}
                formatCurrency={formatCurrency}
                setPumpForm={setPumpForm}
                setShowPumpModal={setShowPumpModal}
                setIsEditingPump={setIsEditingPump}
              />
            )}

            {/* History View */}
            {activeTab === "historique" && currentStation && (
              <HistoryView
                key={selectedDate} // Force refresh when date changes
                stationId={currentStation.id}
                tankNames={Object.fromEntries(
                  currentStation.tanks.map((t) => [t.id, t.name])
                )}
                pumpNumbers={Object.fromEntries(
                  currentStation.pumps.map((p) => [p.id, p.pumpNumber])
                )}
                onDateChange={setSelectedDate}
                metrics={indexHistory.getDailyMetrics(selectedDate)}
                tankStatuses={Object.fromEntries(
                  currentStation.tanks.map((tank) => [
                    tank.id,
                    tankHistory.getDailyTankStatus(selectedDate, tank.id) || {
                      date: selectedDate,
                      tankId: tank.id,
                      startLevel: tank.currentLevel,
                      endLevel: tank.currentLevel,
                      totalWithdrawn: 0,
                      totalRefilled: 0,
                      refills: [],
                    },
                  ])
                )}
              />
            )}

            {/* User Management */}
            {activeTab === "users" && isAdmin && (
              <UserManagementView
                users={users}
                stations={stations}
                onAddUser={addUser}
                onDeleteUser={deleteUser}
                onUpdateUser={updateUser}
              />
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Fuel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-600 mb-2">
              Aucune Station Sélectionnée
            </h2>
            <p className="text-gray-500 mb-4">
              Créez une nouvelle station pour commencer
            </p>
            <button
              onClick={() => {
                setStationForm({ name: "" })
                setShowStationModal(true)
              }}
              className="bg-green-600 text-white px-6  py-2 rounded-lg hover:bg-green-700"
            >
              Créer Station
            </button>
          </div>
        )}
      </div>

      {/* Station Modal */}
      <StationModal
        show={showStationModal}
        onClose={() => setShowStationModal(false)}
        stationForm={stationForm}
        setStationForm={setStationForm}
        onAddStation={handleAddStation}
      />

      {/* Tank Modal */}
      <TankModal
        show={showTankModal}
        onClose={() => {
          setShowTankModal(false)
          setEditingTankId(null)
          setTankForm({ name: "", capacity: "", currentLevel: "" })
        }}
        tankForm={tankForm}
        setTankForm={setTankForm}
        onAddTank={handleAddTank}
        onSaveEdit={
          editingTankId !== null
            ? (payload) => {
                if (!currentStation || editingTankId === null) return
                // Update the tank (clamp currentLevel to capacity)
                // If currentLevel increases compared to the stored tank, record a refill event
                const existingTank = currentStation.tanks.find(
                  (t) => t.id === editingTankId
                )
                const newLevel = Math.min(
                  payload.currentLevel || 0,
                  payload.capacity
                )
                if (existingTank && newLevel > existingTank.currentLevel) {
                  const refillAmount = newLevel - existingTank.currentLevel
                  // record refill in tank history so Total rempli increases
                  tankHistory.addTankUpdate({
                    tankId: existingTank.id,
                    previousLevel: existingTank.currentLevel,
                    currentLevel: newLevel,
                    change: refillAmount,
                    reason: "refill",
                  })
                } else if (
                  existingTank &&
                  newLevel < existingTank.currentLevel
                ) {
                  // manual decrease in tank level (e.g., corrected measurement or manual withdrawal)
                  const withdrawn = existingTank.currentLevel - newLevel
                  // record manual withdrawal so Total retiré increases
                  tankHistory.addTankUpdate({
                    tankId: existingTank.id,
                    previousLevel: existingTank.currentLevel,
                    currentLevel: newLevel,
                    change: -withdrawn,
                    reason: "manual-update",
                  })
                }

                updateTank(currentStation.id, editingTankId, {
                  name: payload.name,
                  capacity: payload.capacity,
                  currentLevel: newLevel,
                })
                setShowTankModal(false)
                setEditingTankId(null)
                setTankForm({ name: "", capacity: "", currentLevel: "" })
              }
            : undefined
        }
      />

      <PumpModal
        show={showPumpModal}
        onClose={() => {
          setShowPumpModal(false)
          setIsEditingPump(false)
          setPumpForm({ pumpNumber: "", nozzleCount: "1", nozzles: [] })
        }}
        pumpForm={pumpForm}
        setPumpForm={setPumpForm}
        onAddPump={handleAddPump}
        onSavePump={(data) => {
          if (!currentStation) return
          if (isEditingPump) {
            // find existing pump by first nozzle id if possible
            const existingPump = currentStation.pumps.find(
              (p) => p.nozzles[0]?.id === pumpForm.nozzles[0]?.id
            )
            if (existingPump) {
              updatePump(currentStation.id, existingPump.id, {
                pumpNumber: data.pumpNumber,
                nozzles: data.nozzles.map((n) => normalizeNozzle(n)),
              })
            }
          } else {
            const assignedPumpNumber = data.pumpNumber.trim()
              ? data.pumpNumber
              : String(currentStation.pumps.length + 1)

            addPump(currentStation.id, {
              pumpNumber: assignedPumpNumber,
              nozzles: data.nozzles.map((n, idx) => {
                const normalized = normalizeNozzle(n)
                return {
                  ...normalized,
                  nozzleNumber: idx + 1,
                  currentIndex: normalized.previousIndex,
                  installIndex:
                    normalized.installIndex ?? normalized.previousIndex,
                }
              }),
            })
          }
          setShowPumpModal(false)
          setIsEditingPump(false)
          setPumpForm({ pumpNumber: "", nozzleCount: "1", nozzles: [] })
        }}
        currentStation={currentStation}
        isEditing={isEditingPump}
      />
    </div>
  )
}
export default GasStationApp
