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
import Tanks from "./components/Tanks"
import Pumps from "./components/Pumps"
import HistoryView from "./components/HistoryView"
import StationModal from "./components/StationModal"
import TankModal from "./components/TankModal"
import PumpModal from "./components/PumpModal"
import UserManagementView from "./components/UserManagementView"

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
  } = useStations()
  const metrics = useMetrics(currentStation)
  const indexHistory = useIndexHistory(currentStation?.id || null)
  const tankHistory = useTankHistory(currentStation?.id || null)

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
      currentLevel: payload.currentLevel || 0,
    })
    setTankForm({ name: "", capacity: "", currentLevel: "" })
    setShowTankModal(false)
  }

  const handleAddPump = () => {
    if (!currentStation) return

    // Validate pump number
    if (!pumpForm.pumpNumber.trim()) {
      alert("Le numéro de pompe est requis")
      return
    }

    // Check for duplicate pump number when adding a new pump
    const isDuplicatePumpNumber = currentStation.pumps.some(
      (p) => p.pumpNumber === pumpForm.pumpNumber
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
        pumpNumber: pumpForm.pumpNumber,
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
        {/* Station Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              value={selectedStation || ""}
              onChange={(e) => setSelectedStation(Number(e.target.value))}
              className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
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
                <button
                  onClick={() => setShowStationModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle Station
                </button>
                {selectedStation && (
                  <button
                    onClick={() => deleteStation(selectedStation)}
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
            {activeTab === "tableau-de-bord" && <Dashboard metrics={metrics} />}

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
                  console.log("[page] onUpdateNozzleIndex wrapper called", {
                    pumpId,
                    nozzleId,
                    newIndex,
                    stationId: currentStation.id,
                  })

                  const pump = currentStation.pumps.find((p) => p.id === pumpId)
                  if (pump) {
                    // Update the index
                    updateNozzleIndex(
                      currentStation.id,
                      pumpId,
                      nozzleId,
                      newIndex
                    )

                    // Track the index update in history
                    const nozzle = pump.nozzles.find((n) => n.id === nozzleId)
                    if (nozzle) {
                      indexHistory.addIndexUpdate({
                        nozzleId,
                        pumpId,
                        previousIndex: nozzle.previousIndex,
                        currentIndex: newIndex,
                        liters: newIndex - nozzle.previousIndex,
                        salePrice: nozzle.salePrice,
                        costPrice: nozzle.costPrice,
                      })

                      // Update tank level if needed (only if tankId is truthy and not 0)
                      if (nozzle.tankId) {
                        tankHistory.updateTankFromPumpUsage(
                          nozzle.tankId,
                          newIndex - nozzle.previousIndex
                        )
                      }
                    }
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
              onClick={() => setShowStationModal(true)}
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
                // Update the tank
                updateTank(currentStation.id, editingTankId, {
                  name: payload.name,
                  capacity: payload.capacity,
                  currentLevel: payload.currentLevel || 0,
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
            addPump(currentStation.id, {
              pumpNumber: data.pumpNumber,
              nozzles: data.nozzles.map((n) => ({
                ...normalizeNozzle(n),
                currentIndex: normalizeNozzle(n).previousIndex,
              })),
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
