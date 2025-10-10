"use client"
import React from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2, Edit, Fuel } from "lucide-react"
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
  installIndex?: number
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
    id?: number
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
  const t = useTranslations()

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
        alert(
          t("indexCannotBeLower") ||
            "L'index ne peut pas être inférieur à l'index précédent."
        )
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
      <div className="inline-flex items-center">
        <div className="relative">
          <input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className={`w-32 px-3 py-1.5 border border-gray-200 rounded-md text-left 
              focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 
              transition-all duration-200
              ${
                isEmpty
                  ? "bg-gray-100 cursor-not-allowed hover:border-gray-200"
                  : "hover:border-gray-400"
              }
            `}
            min={nozzle.previousIndex}
            placeholder={`${
              (t("minLabel") || "Min:") + " " + nozzle.previousIndex
            }`}
            disabled={isEmpty}
            title={
              isEmpty
                ? t("reservoirEmptyCannotIncrease") ||
                  "Réservoir vide - impossible d'augmenter l'index"
                : (t("minLabel") || "Min:") + " " + nozzle.previousIndex
            }
          />
          <div className="absolute -top-2 -left-2">
            <div className="text-[10px] bg-gray-100 px-1 rounded text-gray-600">
              Index
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Fuel className="w-6 h-6 text-gray-600" />
          <span className="hidden sm:inline">{t("pumpsAndNozzles")}</span>
          <span className="sm:hidden">{t("pumps") || "Pompes"}</span>
        </h2>
        {isAdmin && (
          <div>
            <button
              onClick={() => (tanks && tanks.length > 0 ? onAddPump() : null)}
              disabled={!(tanks && tanks.length > 0)}
              title={
                !(tanks && tanks.length > 0)
                  ? t("addTankFirst") ||
                    "Ajoutez un réservoir avant d'ajouter une pompe"
                  : ""
              }
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 ${
                tanks && tanks.length > 0
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("addPump")}
              </span>
              <span className="sm:hidden">{t("add") || "Ajouter"}</span>
            </button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {pumps.map((pump) => (
          <div
            key={pump.id}
            className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 bg-gray-50/50 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Fuel className="w-5 h-5 text-gray-600" />
                <span>
                  {(t("pumpLabel") || "Pompe") + " " + pump.pumpNumber}
                </span>
              </h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Set the pump form to the current pump values for editing
                      setPumpForm({
                        id: pump.id,
                        pumpNumber: pump.pumpNumber,
                        nozzleCount: pump.nozzles.length.toString(),
                        nozzles: pump.nozzles,
                      })
                      setIsEditingPump(true)
                      setShowPumpModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const msg =
                        t("confirmDeletePump") ||
                        `Voulez-vous vraiment supprimer la pompe ${pump.pumpNumber} ? Cette action est irréversible.`
                      if (confirm(msg)) onDeletePump(pump.id)
                    }}
                    className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors duration-200"
                    title={
                      t("deletePumpTitle") ||
                      `Supprimer la pompe ${pump.pumpNumber}`
                    }
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {pump.nozzles.map((nozzle) => {
                const rawLiters =
                  Number(nozzle.currentIndex) - Number(nozzle.previousIndex)
                const liters = Number.isFinite(rawLiters) ? rawLiters : 0
                const salePrice = Number(nozzle.salePrice) || 0
                const costPrice = Number(nozzle.costPrice) || 0
                const revenue = liters * salePrice
                const profit = revenue - liters * costPrice

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
                          <div>
                            <span
                              className={`font-medium mr-2 ${
                                nozzle.fuelType === "Gasoil"
                                  ? "text-green-700"
                                  : nozzle.fuelType === "Essence"
                                  ? "text-orange-600"
                                  : "text-gray-800"
                              }`}
                            >
                              Pistolet {nozzle.nozzleNumber} - {nozzle.fuelType}
                            </span>
                            <span className="text-xs text-gray-500">
                              (Install index:{" "}
                              {nozzle.installIndex ?? nozzle.previousIndex})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                            <span className=" text-sm font-semibold text-gray-600">
                              Réservoir:
                            </span>
                            <span
                              className={`${
                                percent !== null
                                  ? percent <= 10
                                    ? "text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100"
                                    : percent <= 20
                                    ? "text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100"
                                    : "text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-100"
                                  : "text-gray-500"
                              }`}
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
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="grid grid-cols-3 felx-wrap gap-6">
                        <div className="flex flex-col items-center p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <span className="text-xs text-blue-600 font-medium mb-1">
                            Litres
                          </span>
                          <span className="font-semibold text-blue-700">
                            {liters.toFixed(2)} L
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                          <span className="text-xs text-indigo-600 font-medium mb-1">
                            Revenu
                          </span>
                          <span className="font-semibold text-indigo-700">
                            {formatCurrency(revenue)} MRU
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <span className="text-xs text-gray-600 font-medium mb-1">
                            Bénéfice
                          </span>
                          <span
                            className={`font-semibold ${
                              profit > 0
                                ? "text-green-500"
                                : profit < 0
                                ? "text-red-500"
                                : "text-gray-700"
                            }`}
                          >
                            {formatCurrency(profit)} MRU
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {pumps.length === 0 && (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200">
           {t('noPumps')}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pumps
