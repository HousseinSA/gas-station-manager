"use client"
import React from "react"

interface Nozzle {
  id: number
  nozzleNumber: number
  fuelType: string
  tankId: number
  salePrice: number
  costPrice: number
  previousIndex: number
  currentIndex: number
}

interface PumpForm {
  pumpNumber: string
  nozzleCount: string
  nozzles: Nozzle[]
}

interface Tank {
  id: number
  name: string
  capacity: number
  currentLevel: number
  dateAdded: string
}

interface PumpModalProps {
  show: boolean
  onClose: () => void
  pumpForm: PumpForm
  setPumpForm: (form: PumpForm) => void
  onAddPump: () => void
  updateNozzleForm: (index: number, field: string, value: any) => void
  prepareNozzles: (count: number) => void
  currentStation?: {
    tanks: Tank[]
  }
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
  currentStation 
}: PumpModalProps) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Nouvelle Pompe</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
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
                value={pumpForm.nozzleCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value)
                  setPumpForm({ ...pumpForm, nozzleCount: count.toString() })
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
                    key={index}
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
                          {currentStation?.tanks.map((tank, idx) => (
                            <option key={tank.id} value={idx}>
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
                          value={nozzle.previousIndex === 0 ? "" : nozzle.previousIndex}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : parseInt(e.target.value)
                            updateNozzleForm(index, "previousIndex", val)
                            updateNozzleForm(index, "currentIndex", val)
                          }}
                          className="w-full px-3 py-2 text-sm border rounded-lg"
                          step="1"
                          placeholder="0"
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PumpModal
