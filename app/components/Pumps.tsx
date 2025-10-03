"use client"
import React from "react"
import { Plus, Trash2 } from "lucide-react"

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

interface Pump {
  id: number
  pumpNumber: string
  nozzles: Nozzle[]
}

interface PumpsProps {
  pumps: Pump[]
  isAdmin: boolean
  onAddPump: () => void
  onDeletePump: (id: number) => void
  onUpdateNozzleIndex: (
    pumpId: number,
    nozzleId: number,
    newIndex: number
  ) => void
  formatCurrency: (value: number) => string
  setPumpForm: (form: {
    pumpNumber: string
    nozzleCount: string
    nozzles: Nozzle[]
  }) => void
  setShowPumpModal: (show: boolean) => void
  setIsEditingPump: (editing: boolean) => void
}

const Pumps = ({
  pumps,
  isAdmin,
  onAddPump,
  onDeletePump,
  onUpdateNozzleIndex,
  formatCurrency,
  setPumpForm,
  setShowPumpModal,
  setIsEditingPump,
}: PumpsProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pompes & Pistolets</h2>
        {isAdmin && (
          <button
            onClick={onAddPump}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter Pompe
          </button>
        )}
      </div>
      <div className="space-y-4">
        {pumps.map((pump) => (
          <div key={pump.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold">Pompe {pump.pumpNumber}</h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Set the pump form to the current pump values for editing
                      setPumpForm({
                        pumpNumber: pump.pumpNumber,
                        nozzleCount: pump.nozzles.length.toString(),
                        nozzles: pump.nozzles,
                      })
                      setIsEditingPump(true)
                      setShowPumpModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeletePump(pump.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            {pump.nozzles.map((nozzle) => {
              const liters = nozzle.currentIndex - nozzle.previousIndex
              const revenue = liters * nozzle.salePrice
              const profit = revenue - liters * nozzle.costPrice

              return (
                <div key={nozzle.id} className="bg-gray-50 rounded p-3 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      Pistolet {nozzle.nozzleNumber} - {nozzle.fuelType}
                    </span>
                    <span className="text-sm text-gray-600">
                      Réservoir {nozzle.tankId + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">Index précédent:</span>
                      <span className="ml-2 font-medium">
                        {nozzle.previousIndex}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prix de vente:</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(nozzle.salePrice)} MRU/L
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Index actuel:</span>
                      <input
                        type="number"
                        value={nozzle.currentIndex}
                        onChange={(e) => {
                          const newValue =
                            e.target.value === ""
                              ? nozzle.previousIndex
                              : parseFloat(e.target.value)
                          if (
                            !isNaN(newValue) &&
                            newValue >= nozzle.previousIndex
                          ) {
                            onUpdateNozzleIndex(pump.id, nozzle.id, newValue)
                          }
                        }}
                        className="ml-2 w-28 px-2 py-1 border rounded"
                        min={nozzle.previousIndex}
                        step="1"
                        placeholder={`Min: ${nozzle.previousIndex}`}
                      />
                    </div>
                    <div>
                      <span className="text-gray-600">Prix de coût:</span>
                      <span className="ml-2 font-medium">
                        {formatCurrency(nozzle.costPrice)} MRU/L
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded text-sm">
                    <div className="grid grid-cols-3 gap-2 font-medium">
                      <div>
                        <span className="text-gray-600">Litres:</span>
                        <span className="ml-1">{liters.toFixed(2)} L</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenu:</span>
                        <span className="ml-1">
                          {formatCurrency(revenue)} MRU
                        </span>
                      </div>
                      <div
                        className={
                          profit >= 0 ? "text-green-700" : "text-red-600"
                        }
                      >
                        <span className="text-gray-600">Bénéfice:</span>
                        <span className="ml-1">
                          {formatCurrency(profit)} MRU
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {pumps.length === 0 && (
          <p className="text-center text-gray-500 py-8">Aucune pompe ajoutée</p>
        )}
      </div>
    </div>
  )
}

export default Pumps
