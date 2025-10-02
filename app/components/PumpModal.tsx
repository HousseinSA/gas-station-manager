"use client"
import React, { useEffect } from "react"
import Modal from "./Modal"
import { Station, Tank, Nozzle } from "../hooks/useStations"

interface PumpForm {
  pumpNumber: string
  nozzleCount: string
  nozzles: Nozzle[]
}

interface PumpModalProps {
  show: boolean
  onClose: () => void
  pumpForm: PumpForm
  setPumpForm: (form: PumpForm) => void
  onAddPump: () => void
  updateNozzleForm: (
    index: number,
    field: keyof Nozzle,
    value: Nozzle[keyof Nozzle]
  ) => void
  prepareNozzles: (count: number) => void
  currentStation?: Station | null
  isEditing?: boolean
}

const PumpModal = ({
  show,
  onClose,
  pumpForm,
  setPumpForm,
  onAddPump,
  updateNozzleForm,
  prepareNozzles,
  currentStation,
  isEditing,
}: PumpModalProps) => {
  useEffect(() => {
    if (show) {
      const initialCount = pumpForm.nozzleCount
        ? parseInt(pumpForm.nozzleCount)
        : 1
      if (!pumpForm.nozzleCount || pumpForm.nozzleCount === "") {
        setPumpForm({ ...pumpForm, nozzleCount: "1" })
      }
      prepareNozzles(initialCount)
    }
  }, [show])

  // Validation function to check if form is complete
  const isFormValid = () => {
    // Check pump number
    if (!pumpForm.pumpNumber.trim()) return false

    // Check each nozzle has all required fields
    return pumpForm.nozzles.every(
      (nozzle) =>
        nozzle.fuelType &&
        nozzle.tankId > 0 &&
        nozzle.salePrice > 0 &&
        nozzle.costPrice > 0 &&
        typeof nozzle.previousIndex === "number"
    )
  }

  if (!show) return null

  return (
    <Modal
      onClose={onClose}
      show={show}
      title={isEditing ? "Modifier Pompe" : "Nouvelle Pompe"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Numéro de Pompe
          </label>
          <input
            type="text"
            value={pumpForm.pumpNumber}
            onChange={(e) =>
              setPumpForm({ ...pumpForm, pumpNumber: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Ex: 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre de Pistolets
          </label>
          <select
            value={pumpForm.nozzleCount || "1"}
            onChange={(e) => {
              const count = parseInt(e.target.value)
              // Update the form state with the new nozzle count
              setPumpForm({ ...pumpForm, nozzleCount: count.toString() })
              // Prepare nozzles immediately
              prepareNozzles(count)
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        {pumpForm.nozzles.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium">Configuration des Pistolets</h3>
            {pumpForm.nozzles.map((nozzle, index) => (
              <div
                key={nozzle.id}
                className="bg-gray-50 p-4 rounded-lg space-y-3"
              >
                <h4 className="font-medium text-sm">Pistolet {index + 1}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Type de Carburant
                    </label>
                    <select
                      value={nozzle.fuelType}
                      onChange={(e) =>
                        updateNozzleForm(index, "fuelType", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      <option value="Gasoil">Gasoil</option>
                      <option value="Essence">Essence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Réservoir
                    </label>
                    <select
                      value={nozzle.tankId}
                      onChange={(e) =>
                        updateNozzleForm(
                          index,
                          "tankId",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      {currentStation?.tanks.map((tank) => (
                        <option key={tank.id} value={tank.id}>
                          {tank.name}
                        </option>
                      ))}
                      {(!currentStation?.tanks ||
                        currentStation.tanks.length === 0) && (
                        <option value="0">Aucun réservoir</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Prix de Vente (MRU/L)
                    </label>
                    <input
                      type="number"
                      value={nozzle.salePrice === 0 ? "" : nozzle.salePrice}
                      onChange={(e) =>
                        updateNozzleForm(
                          index,
                          "salePrice",
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Prix de Coût (MRU/L)
                    </label>
                    <input
                      type="number"
                      value={nozzle.costPrice === 0 ? "" : nozzle.costPrice}
                      onChange={(e) =>
                        updateNozzleForm(
                          index,
                          "costPrice",
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">
                      Index Précédent
                    </label>
                    <input
                      type="number"
                      value={
                        nozzle.previousIndex === 0 ? "" : nozzle.previousIndex
                      }
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        updateNozzleForm(index, "previousIndex", val)
                      }}
                      disabled={
                        isEditing &&
                        nozzle.currentIndex !== nozzle.previousIndex
                      }
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        isEditing &&
                        nozzle.currentIndex !== nozzle.previousIndex
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder="0"
                      title={
                        isEditing &&
                        nozzle.currentIndex !== nozzle.previousIndex
                          ? "Cannot edit: Fuel has been sold from this nozzle"
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onAddPump}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-lg ${
              isFormValid()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isEditing ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PumpModal
