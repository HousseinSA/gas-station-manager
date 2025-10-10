"use client"
import React, { useState } from "react"
import { Plus, Trash2, LogOut, Fuel, Globe, UserIcon } from "lucide-react"

import { useAuth } from "../hooks/useAuth"
import { useStations, Nozzle } from "../hooks/useStations"
import { useMetrics } from "../hooks/useMetrics"
import { useIndexHistory } from "../hooks/useIndexHistory"
import { useTankHistory } from "../hooks/useTankHistory"

import Login from "../components/Login"
import Dashboard from "../components/Dashboard"
import Pumps from "../components/Pumps"
import HistoryView from "../components/HistoryView"
import StationModal from "../components/StationModal"
import TankModal from "../components/TankModal"
import PumpModal from "../components/PumpModal"
import UserManagementView from "../components/UserManagementView"
import Tanks from "../components/Tanks"
import LocaleSwitcher from "../components/LocaleSwitcher"
import { useTranslations } from "next-intl"

interface PumpForm {
  id?: number
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
    initialized,
  } = useAuth()
  // Use next-intl hook to get translations in client components
  // `useTranslations` is a client hook from next-intl; function is injected via global helper earlier in migration
  const t = useTranslations()
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
  const indexHistory = useIndexHistory(currentStation?.id || null)
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
          if (currentStation)
            commitAllNozzles(
              Number(currentStation.id ?? (currentStation as any)._id)
            )
        } catch (e) {
          console.error("Error committing nozzles at midnight", e)
        }
        // after the first execution at midnight, set recurring interval every 24h
        intervalId = window.setInterval(() => {
          try {
            if (currentStation)
              commitAllNozzles(
                Number(currentStation.id ?? (currentStation as any)._id)
              )
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
    fuelType: "Gasoil" as "Gasoil" | "Essence",
  })
  const [pumpForm, setPumpForm] = useState<PumpForm>({
    pumpNumber: "",
    nozzleCount: "1",
    nozzles: [],
  })

  // ───── Handlers ─────
  const handleLogin = async (password: string) => {
    const ok = await login(password)
    console.log(ok, "login result")
    if (!ok) {
      alert(
        // Use t() if available, otherwise fallback to FR
        (t && t("adminPasswordIncorrect")) || "Mot de passe incorrect"
      )
    }
  }

  const handleAddStation = () => {
    if (!stationForm.name.trim()) return
    // Only admins can create stations
    if (!isAdmin) {
      alert(
        (t && t("notAuthorizedCreateStation")) ||
          "Vous n'êtes pas autorisé à créer une station."
      )
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
    if (!currentStation || !payload.name.trim() || !payload.capacity) return
    addTank(Number(currentStation.id ?? (currentStation as any)._id), {
      name: payload.name,
      capacity: payload.capacity,
      currentLevel: Math.min(payload.currentLevel || 0, payload.capacity),
      fuelType: tankForm.fuelType,
    })
    setTankForm({
      name: "",
      capacity: "",
      currentLevel: "",
      fuelType: "Gasoil",
    })
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
      alert(
        (t && t("pumpNumberExists")) ||
          "Ce numéro de pompe existe déjà dans la station"
      )
      return
    }

    if (pumpForm.nozzles.length === 0) {
      alert((t && t("atLeastOneNozzle")) || "Au moins un pistolet est requis")
      return
    }

    if (isEditingPump) {
      const existingPump = currentStation.pumps.find(
        (p) => p.nozzles[0].id === pumpForm.nozzles[0].id
      )

      if (existingPump) {
        updatePump(
          Number(currentStation.id ?? (currentStation as any)._id),
          existingPump.id,
          {
            pumpNumber: pumpForm.pumpNumber,
            nozzles: pumpForm.nozzles.map((nozzle) => normalizeNozzle(nozzle)),
          }
        )
      }
    } else {
      const nozzlesWithCorrectIndex = pumpForm.nozzles.map((nozzle) => {
        const normalized = normalizeNozzle(nozzle)
        return { ...normalized, currentIndex: normalized.previousIndex }
      })

      addPump(Number(currentStation.id ?? (currentStation as any)._id), {
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
  // Wait until auth has checked session cookie on initial load
  if (!initialized) {
    return null // or a spinner if you prefer
  }

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
              <h1 className="text-xl font-bold">
                {(t && t("managementTitle")) || "Gestion Stations-Service"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => setActiveTab("users")}
                className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded hover:bg-green-800"
              >
                {/* 👇 show icon always, hide text on small screens */}
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {(t && t("manageUsers")) || "Gérer Utilisateurs"}
                </span>
              </button>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded hover:bg-green-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {(t && t("signOut")) || "Déconnexion"}
              </span>
            </button>

            <div className="pl-2">
              <LocaleSwitcher /> {/* full dropdown on larger screens */}
              {/* 👇 compact icon-only switcher for mobile */}
            </div>
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
                .filter(
                  (s) => isAdmin || canAccessStation(Number(s.id ?? s._id))
                )
                .map((s) => (
                  <option
                    key={String(s.id ?? s._id)}
                    value={String(s.id ?? s._id)}
                  >
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
                    {(t && t("newStation")) || "Nouvelle Station"}
                  </button>
                )}
                {selectedStation && (
                  <button
                    onClick={() => {
                      const stationIdToDelete = Number(selectedStation as any)
                      const usersWithAccess = users.filter((u) =>
                        u.allowedStations.includes(stationIdToDelete)
                      )

                      if (usersWithAccess.length > 0) {
                        // Remove the deleted station from each affected user's allowedStations
                        // Keep users even if they end up with no stations, so admin can reassign later
                        usersWithAccess.forEach((user) => {
                          const remaining = user.allowedStations.filter(
                            (s) => s !== Number(stationIdToDelete as any)
                          )
                          updateUser(user.id, { allowedStations: remaining })
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
                    {(t && t("deleteStation")) || "Supprimer Station"}
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
                  {
                    id: "tableau-de-bord",
                    label: t && t("dashboardTab"),
                  },
                  {
                    id: "reservoirs",
                    label: t && t("tanksTab"),
                  },
                  { id: "pompes", label: t && t("pumpsTab") },
                  {
                    id: "historique",
                    label: t && t("historyTab"),
                  },
                  {
                    id: "users",
                    label: t && t("usersTab"),
                    adminOnly: true,
                  },
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
            {activeTab === "tableau-de-bord" && currentStation && (
              <Dashboard
                metrics={
                  indexHistory.getDailyMetrics(selectedDate, currentStation?.id ?? (currentStation as any)?._id) || {
                    totalRevenue: 0,
                    totalProfit: 0,
                    totalLiters: 0,
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
                      fuelType: tank.fuelType,
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

                  // Get the previous value for INCREMENTAL calculation
                  const prevIndexToUse =
                    nozzleLatestIndexRef.current[nozzleId] ??
                    nozzle.currentIndex

                  // Calculate INCREMENTAL change (for tank update)
                  const incrementalDelta = newIndex - prevIndexToUse
                  const incrementalLiters = Math.abs(incrementalDelta)

                  // Record tank level BEFORE update
                  const prevTankLevel = nozzle.tankId
                    ? currentStation.tanks.find((t) => t.id === nozzle.tankId)
                        ?.currentLevel
                    : undefined

                  // Update station state (this updates both tank and nozzle)
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

                  const { prevIndex } = result

                  // Create index history (uses committed previousIndex for daily totals)
                  indexHistory.addIndexUpdate({
                    stationId: currentStation.id ?? (currentStation as any)._id,
                    nozzleId,
                    pumpId,
                    previousIndex: nozzle.previousIndex, // Use committed previousIndex
                    currentIndex: newIndex,
                    liters: Math.abs(newIndex - nozzle.previousIndex),
                    salePrice: nozzle.salePrice,
                    costPrice: nozzle.costPrice,
                    pumpName: pump.pumpNumber,
                    nozzleLabel: `Pistolet ${nozzle.nozzleNumber}`,
                  })

                  // Update tank history with INCREMENTAL change
                  if (nozzle.tankId && incrementalLiters > 0) {
                    if (incrementalDelta > 0) {
                      // Dispensing - withdrawal
                      tankHistory.updateTankFromPumpUsage(
                        nozzle.tankId,
                        incrementalLiters,
                        prevTankLevel,
                        currentStation.id ?? (currentStation as any)._id
                      )
                    } else {
                      // Correction (user decreased index) - add fuel back to tank
                      tankHistory.addTankUpdate({
                        stationId: currentStation.id ?? (currentStation as any)._id,
                        tankId: nozzle.tankId,
                        previousLevel: prevTankLevel || 0,
                        currentLevel: (prevTankLevel || 0) + incrementalLiters,
                        change: incrementalLiters, // Positive = adding back to tank
                        reason: "correction",
                      })
                    }
                  }

                  // Update ref for next calculation
                  nozzleLatestIndexRef.current[nozzleId] = newIndex
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
                stationId={Number(
                  currentStation.id ?? (currentStation as any)._id
                )}
                tankNames={Object.fromEntries(
                  currentStation.tanks.map((t) => [t.id, t.name])
                )}
                pumpNumbers={Object.fromEntries(
                  currentStation.pumps.map((p) => [p.id, p.pumpNumber])
                )}
                onDateChange={setSelectedDate}
                metrics={indexHistory.getDailyMetrics(selectedDate, currentStation?.id ?? (currentStation as any)?._id)}
                tankStatuses={Object.fromEntries(
                  currentStation.tanks.map((tank) => [
                    tank.id,
                    tankHistory.getDailyTankStatus(selectedDate, tank.id, currentStation?.id ?? (currentStation as any)?._id) || {
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
                stations={stations.map((s) => ({
                  id: Number(s.id ?? (s as any)._id),
                  name: s.name,
                }))}
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
              {(t && t("noStationSelectedTitle")) ||
                "Aucune Station Sélectionnée"}
            </h2>
            <p className="text-gray-500 mb-4">
              {(t && t("createStationPrompt")) ||
                "Créez une nouvelle station pour commencer"}
            </p>
            <button
              onClick={() => {
                setStationForm({ name: "" })
                setShowStationModal(true)
              }}
              className="bg-green-600 text-white px-6  py-2 rounded-lg hover:bg-green-700"
            >
              {(t && t("createStationBtn")) || "Créer Station"}
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
          setTankForm({
            name: "",
            capacity: "",
            currentLevel: "",
            fuelType: "Gasoil",
          })
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
                    stationId: currentStation.id ?? (currentStation as any)._id,
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
                    stationId: currentStation.id ?? (currentStation as any)._id,
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
                  fuelType: payload.fuelType,
                })
                setShowTankModal(false)
                setEditingTankId(null)
                setTankForm({
                  name: "",
                  capacity: "",
                  currentLevel: "",
                  fuelType: "Gasoil",
                })
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
          if (isEditingPump && pumpForm.id) {
            // Find existing pump by ID
            const existingPump = currentStation.pumps.find(
              (p) => p.id === pumpForm.id
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
