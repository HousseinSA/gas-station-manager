"use client"
import React, { useState } from "react"
import { Plus, Trash2, LogOut, Fuel } from "lucide-react"

// Hooks
import { useAuth } from "./hooks/useAuth"
import { useStations } from "./hooks/useStations"
import { useMetrics } from "./hooks/useMetrics"

// Components
import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import Tanks from "./components/Tanks"
import Pumps from "./components/Pumps"
import StationModal from "./components/StationModal"
import TankModal from "./components/TankModal"
import PumpModal from "./components/PumpModal"

const GasStationApp = () => {
  const { isLoggedIn, login, logout } = useAuth()
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
  } = useStations()
  const metrics = useMetrics(currentStation)

  // UI states
  const [activeTab, setActiveTab] = useState("tableau-de-bord")
  const [showStationModal, setShowStationModal] = useState(false)
  const [showTankModal, setShowTankModal] = useState(false)
  const [showPumpModal, setShowPumpModal] = useState(false)
  const [isEditingPump, setIsEditingPump] = useState(false)

  // Temporary form states
  const [stationForm, setStationForm] = useState({ name: "" })
  const [tankForm, setTankForm] = useState({
    name: "",
    capacity: "",
    currentLevel: "",
  })
  const [pumpForm, setPumpForm] = useState({
    pumpNumber: "",
    nozzleCount: "1",
    nozzles: [],
  })

  // ───── Handlers ─────
  const handleLogin = (pwd: string) => {
    if (!login(pwd)) {
      alert("Mot de passe incorrect ! Essayez : admin123")
    }
  }

  const handleAddStation = () => {
    if (!stationForm.name.trim()) return
    addStation(stationForm.name)
    setStationForm({ name: "" })
    setShowStationModal(false)
  }

  const handleAddTank = () => {
    if (!currentStation || !tankForm.name.trim() || !tankForm.capacity) return
    addTank(currentStation.id, {
      name: tankForm.name,
      capacity: parseFloat(tankForm.capacity),
      currentLevel: parseFloat(tankForm.currentLevel || "0"),
    })
    setTankForm({ name: "", capacity: "", currentLevel: "" })
    setShowTankModal(false)
  }

  const handleAddPump = () => {
    if (
      !currentStation ||
      !pumpForm.pumpNumber.trim() ||
      pumpForm.nozzles.length === 0
    )
      return

    // Check if we're editing an existing pump or adding a new one
    const isEditing = pumpForm.nozzles.length > 0 && pumpForm.nozzles[0].id !== undefined

    if (isEditing) {
      // Find the pump ID from the first nozzle
      const pumpId = pumpForm.nozzles[0].id

      // Update the existing pump
      updatePump(currentStation.id, pumpId, {
        pumpNumber: pumpForm.pumpNumber,
        nozzles: pumpForm.nozzles,
      })
    } else {
      // Add a new pump
      addPump(currentStation.id, {
        pumpNumber: pumpForm.pumpNumber,
        nozzles: pumpForm.nozzles,
      })
    }

    setPumpForm({ pumpNumber: "", nozzleCount: "1", nozzles: [] })
    setShowPumpModal(false)
  }

  const updateNozzleForm = (index: number, field: string, value: any) => {
    const updatedNozzles = [...pumpForm.nozzles]
    updatedNozzles[index] = { ...updatedNozzles[index], [field]: value }
    setPumpForm({ ...pumpForm, nozzles: updatedNozzles })
  }

  const prepareNozzles = (count: number) => {
    if (count < 1) count = 1
    if (count > 4) count = 4  // Limit to maximum 4 nozzles per pump

    // Only create nozzles if count is different from current nozzles length
    if (pumpForm.nozzles.length === count) return

    const newNozzles = []

    // Create the exact number of nozzles needed
    for (let i = 0; i < count; i++) {
      // If we already have this nozzle, use it
      if (i < pumpForm.nozzles.length) {
        newNozzles.push(pumpForm.nozzles[i])
      } else {
        // Create new nozzle with default values (no default prices or indexes)
        newNozzles.push({
          id: Date.now() + i,
          nozzleNumber: i + 1,
          fuelType: "Gasoil",
          tankId: 0,
          salePrice: 0,  // No default value
          costPrice: 0,  // No default value
          previousIndex: 0,  // No default value
          currentIndex: 0,  // No default value
        })
      }
    }

    setPumpForm({ ...pumpForm, nozzles: newNozzles })
  }

  // Format number with thousand separators for currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-MR').format(value)
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
              <p className="text-sm text-green-100">Mauritanie</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded hover:bg-green-800"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
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
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
                ].map((tab) => (
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
              />
            )}

            {/* Pumps */}
            {activeTab === "pompes" && (
              <Pumps
                pumps={currentStation.pumps}
                onAddPump={() => {
                  setIsEditingPump(false);
                  setShowPumpModal(true);
                }}
                onDeletePump={(pumpId) => deletePump(currentStation.id, pumpId)}
                onUpdateNozzleIndex={(pumpId, nozzleId, newIndex) =>
                  updateNozzleIndex(
                    currentStation.id,
                    pumpId,
                    nozzleId,
                    Number(newIndex)
                  )
                }
                formatCurrency={formatCurrency}
                setPumpForm={setPumpForm}
                setShowPumpModal={setShowPumpModal}
                setIsEditingPump={setIsEditingPump}
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
        onClose={() => setShowTankModal(false)}
        tankForm={tankForm}
        setTankForm={setTankForm}
        onAddTank={handleAddTank}
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
        updateNozzleForm={updateNozzleForm}
        prepareNozzles={prepareNozzles}
        currentStation={currentStation}
        isEditing={isEditingPump}
      />
    </div>
  )
}

export default GasStationApp
