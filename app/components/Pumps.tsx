"use client"
import React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Tank } from "../hooks/useStations"

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
  tanks: Tank[]
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
  tanks,
}: PumpsProps) => {
  // Local subcomponent to manage editable nozzle index draft state
  const NozzleRow: React.FC<{
    nozzle: Nozzle
    pumpId: number
    tanks: Tank[]
  }> = ({ nozzle, pumpId, tanks }) => {
    const tank = tanks?.find((t) => t.id === nozzle.tankId)
    const isEmpty = tank ? tank.currentLevel <= 0 : false
    const [draft, setDraft] = React.useState<string>(
      String(nozzle.currentIndex)
    )

    React.useEffect(() => {
      setDraft(String(nozzle.currentIndex))
    }, [nozzle.currentIndex])

    const commit = () => {
      const newValue = draft === "" ? nozzle.previousIndex : parseFloat(draft)
      if (isNaN(newValue)) {
        setDraft(String(nozzle.currentIndex))
        return
      }
      // Allow decreasing to correct mistakes, but never accept below previousIndex
      if (newValue < nozzle.previousIndex) {
        alert("L'index ne peut pas être inférieur à l'index précédent.")
        setDraft(String(nozzle.currentIndex))
        return
      }
      if (newValue !== nozzle.currentIndex) {
        onUpdateNozzleIndex(pumpId, nozzle.id, newValue)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        ;(e.target as HTMLInputElement).blur()
      }
      if (e.key === "Escape") {
        setDraft(String(nozzle.currentIndex))
        ;(e.target as HTMLInputElement).blur()
      }
    }

    return (
      <div>
        <div className="inline-flex items-center ml-2">
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className={`w-32 px-3 py-1.5 border rounded text-left focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
              isEmpty ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            min={nozzle.previousIndex}
            placeholder={`Min: ${nozzle.previousIndex}`}
            disabled={isEmpty}
            title={
              isEmpty
                ? "Réservoir vide - impossible d'augmenter l'index"
                : `Min: ${nozzle.previousIndex}`
            }
          />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pompes & Pistolets</h2>
        {isAdmin && (
          <div>
            <button
              onClick={() => (tanks && tanks.length > 0 ? onAddPump() : null)}
              disabled={!(tanks && tanks.length > 0)}
              title={
                !(tanks && tanks.length > 0)
                  ? "Ajoutez un réservoir avant d'ajouter une pompe"
                  : ""
              }
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                tanks && tanks.length > 0
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              <Plus className="w-4 h-4" />
              Ajouter Pompe
            </button>
          </div>
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
                    onClick={() => {
                      const msg = `Voulez-vous vraiment supprimer la pompe ${pump.pumpNumber} ? Cette action est irréversible.`
                      if (confirm(msg)) onDeletePump(pump.id)
                    }}
                    className="text-red-600 hover:text-red-700"
                    title={`Supprimer la pompe ${pump.pumpNumber}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            {pump.nozzles.map((nozzle) => {
              const rawLiters =
                Number(nozzle.currentIndex) - Number(nozzle.previousIndex)
              const liters = Number.isFinite(rawLiters) ? rawLiters : 0
              const salePrice = Number(nozzle.salePrice) || 0
              const costPrice = Number(nozzle.costPrice) || 0
              const revenue = liters * salePrice
              const profit = revenue - liters * costPrice
              // Debug small values to help trace issues in dev console
              console.log("[Pumps] computed", {
                pumpId: pump.id,
                nozzleId: nozzle.id,
                liters,
                revenue,
                profit,
              })

              return (
                <div key={nozzle.id} className="bg-gray-50 rounded p-3 mb-2">
                  {(() => {
                    const tank =
                      tanks?.find((t) => t.id === nozzle.tankId) || null
                    const percent = tank
                      ? (tank.currentLevel / tank.capacity) * 100
                      : null
                    let nameClass = "text-sm text-gray-600"
                    if (percent !== null) {
                      if (percent <= 10) nameClass = "text-sm text-red-600"
                      else if (percent <= 20)
                        nameClass = "text-sm text-yellow-600"
                      else nameClass = "text-sm text-gray-600"
                    }

                    return (
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          Pistolet {nozzle.nozzleNumber} - {nozzle.fuelType}
                        </span>
                        <span
                          className={nameClass}
                          title={
                            tank
                              ? `${tank.name} — ${tank.currentLevel.toFixed(
                                  2
                                )} / ${tank.capacity} L (${percent!.toFixed(
                                  0
                                )}%)`
                              : "Réservoir non assigné"
                          }
                        >
                          {tank?.name || "Réservoir non assigné"}
                        </span>
                      </div>
                    )
                  })()}
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
                      <div className="inline-flex items-center ml-2">
                        <NozzleRow
                          nozzle={nozzle}
                          pumpId={pump.id}
                          tanks={tanks}
                        />
                      </div>
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
