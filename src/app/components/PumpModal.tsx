"use client"
import React, { useEffect, useState } from "react"
import Modal from "./Modal"
import { Station, Nozzle } from "../hooks/useStations"
import { useTranslations } from "next-intl"
import { Trash } from "lucide-react"

interface PumpForm {
  id?: number
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
  onSavePump?: (data: { pumpNumber: string; nozzles: Nozzle[] }) => void
  currentStation?: Station | null
  isEditing?: boolean
}

const PumpModal = ({
  show,
  onClose,
  pumpForm,
  setPumpForm,
  onAddPump,
  onSavePump,
  currentStation,
  isEditing,
}: PumpModalProps) => {
  const t = useTranslations()
  const [pendingNozzles, setPendingNozzles] = useState<Nozzle[]>([])
  const [pendingCount, setPendingCount] = useState<number>(1)
  useEffect(() => {
    if (show) {
      const initialCount = pumpForm.nozzleCount
        ? parseInt(pumpForm.nozzleCount)
        : 1
      setPendingCount(initialCount)
      if (pumpForm.nozzles && pumpForm.nozzles.length > 0) {
        setPendingNozzles(pumpForm.nozzles.slice(0, initialCount))
      } else {
        setPendingNozzles([
          {
            id: Date.now(),
            nozzleNumber: 1,
            fuelType: currentStation?.tanks[0]?.fuelType || "Gasoil",
            tankId: currentStation?.tanks[0]?.id || 0,
            salePrice: 0,
            costPrice: 0,
            previousIndex: 0,
            currentIndex: 0,
            installIndex: 0,
            isNew: true,
          },
        ])
      }
    }
  }, [show, pumpForm.nozzleCount, pumpForm.nozzles, currentStation?.tanks])

  const isFormValid = () => {
    return (
      pendingNozzles.length > 0 &&
      pendingNozzles.every(
        (nozzle) =>
          nozzle.fuelType &&
          Number(nozzle.tankId) > 0 &&
          Number(nozzle.salePrice) > 0 &&
          Number(nozzle.costPrice) > 0 &&
          typeof nozzle.previousIndex === "number" &&
          nozzle.previousIndex > 0
      )
    )
  }

  if (!show) return null

  return (
    <Modal
      onClose={onClose}
      show={show}
      title={isEditing ? `${t("edit")} ${t("pumps")}` : t("addPump")}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("pumpNumber") || "Numéro de Pompe"}
          </label>
          <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-700">
            {isEditing && pumpForm.pumpNumber
              ? pumpForm.pumpNumber
              : t("autoAssigned") || "Auto (assigné lors de l'ajout)"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t("nozzleCount") || "Nombre de Pistolets"}
          </label>
          <select
            value={String(pendingCount) || "1"}
            onChange={(e) => {
              const count = parseInt(e.target.value)
              setPendingCount(count)
              setPendingNozzles((prev) => {
                const copy = [...prev]
                if (copy.length > count) return copy.slice(0, count)
                while (copy.length < count) {
                  copy.push({
                    id: Date.now() + copy.length,
                    nozzleNumber: copy.length + 1,
                    fuelType: "", // Will be set when tank is selected
                    tankId: 0,
                    salePrice: 0,
                    costPrice: 0,
                    previousIndex: 0,
                    currentIndex: 0,
                    installIndex: 0,
                    isNew: true,
                  })
                }
                return copy
              })
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>

        {pendingNozzles.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium">
              {t("nozzleConfiguration") || "Configuration des Pistolets"}
            </h3>
            {pendingNozzles.map((nozzle, index) => (
              <div
                key={nozzle.id}
                className="bg-gray-50 p-4 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">
                    {t("nozzle") || "Pistolet"} {index + 1}
                  </h4>
                  <div>
                    <button
                      onClick={() => {
                        setPendingNozzles((prev) => {
                          const copy = prev.filter((_, i) => i !== index)
                          if (copy.length === 0) {
                            const defaultNozzle: Nozzle = {
                              id: Date.now(),
                              nozzleNumber: 1,
                              fuelType: "Gasoil",
                              tankId: currentStation?.tanks[0]?.id || 0,
                              salePrice: 0,
                              costPrice: 0,
                              previousIndex: 0,
                              currentIndex: 0,
                              isNew: true,
                            }
                            return [defaultNozzle]
                          }
                          return copy.map((n, idx) => ({
                            ...n,
                            nozzleNumber: idx + 1,
                          }))
                        })
                        setPendingCount((c) => Math.max(1, c - 1))
                      }}
                      className={`text-sm ${
                        pendingNozzles.length <= 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-700"
                      }`}
                      disabled={pendingNozzles.length <= 1}
                      title={
                        pendingNozzles.length <= 1
                          ? t("atLeastOneNozzle")
                          : t("delete")
                      }
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t("tank") || "Réservoir"}
                      </label>
                      <select
                        value={String(
                          nozzle.tankId || currentStation?.tanks[0]?.id || ""
                        )}
                        onChange={(e) => {
                          const selectedTankId = parseInt(e.target.value)
                          const selectedTank = currentStation?.tanks.find(
                            (t) => t.id === selectedTankId
                          )

                          setPendingNozzles((prev) => {
                            const copy = [...prev]
                            copy[index] = {
                              ...copy[index],
                              tankId: selectedTankId,
                              fuelType: selectedTank?.fuelType || "Gasoil",
                            }
                            return copy
                          })
                        }}
                        className="w-full px-3 py-2 text-sm border rounded-lg cursor-pointer"
                        disabled={!nozzle.isNew}
                      >
                        {currentStation?.tanks.map((tank) => (
                          <option key={tank.id} value={tank.id}>
                            {tank.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {t("fuelType") }
                      </label>

                      <div
                        className={`px-3 py-2 text-sm rounded-lg font-medium text-white text-center ${
                          nozzle.fuelType === "Gasoil"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        { currentStation?.tanks.find(
                          (t) => t.id === nozzle.tankId
                        )?.fuelType || currentStation?.tanks[0]?.fuelType}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {t("salePrice") || "Prix de Vente (MRU/L)"}
                    </label>
                    <input
                      type="number"
                      value={nozzle.salePrice === 0 ? "" : nozzle.salePrice}
                      onChange={(e) => {
                        const v =
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = { ...copy[index], salePrice: v }
                          return copy
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      step="0.01"
                      placeholder={t("pricePlaceholder") || "0,00"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      {t("costPrice") || "Prix de Coût (MRU/L)"}
                    </label>
                    <input
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      type="number"
                      value={nozzle.costPrice === 0 ? "" : nozzle.costPrice}
                      onChange={(e) => {
                        const v =
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = { ...copy[index], costPrice: v }
                          return copy
                        })
                      }}
                      step="0.01"
                      placeholder={t("pricePlaceholder") || "0,00"}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">
                      {t("installIndex") || "Index d'installation"}
                    </label>
                    <input
                      type="number"
                      value={
                        nozzle.previousIndex === 0 ? "" : nozzle.previousIndex
                      }
                      onChange={(e) => {
                        const val =
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = {
                            ...copy[index],
                            previousIndex: val,
                            installIndex: val,
                            nozzleNumber: index + 1,
                          }
                          return copy
                        })
                      }}
                      disabled={
                        isEditing &&
                        !nozzle.isNew &&
                        nozzle.currentIndex !== nozzle.previousIndex
                      }
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        isEditing &&
                        !nozzle.isNew &&
                        nozzle.currentIndex !== nozzle.previousIndex
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={t("indexPlaceholder") || "0"}
                      title={
                        isEditing &&
                        !nozzle.isNew &&
                        nozzle.currentIndex !== nozzle.previousIndex
                          ? t("cannotEditNozzle")
                          : ""
                      }
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {t("installIndex")}:{" "}
                      {nozzle.installIndex ?? nozzle.previousIndex ?? 0}
                    </div>
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
            {t("cancel")}
          </button>
          <button
            onClick={() => {
              if (onSavePump) {
                onSavePump({
                  pumpNumber: pumpForm.pumpNumber,
                  nozzles: pendingNozzles,
                })
              } else {
                setPumpForm({
                  ...pumpForm,
                  nozzles: pendingNozzles,
                  nozzleCount: pendingNozzles.length.toString(),
                })
                onAddPump()
              }
            }}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-lg ${
              isFormValid()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isEditing ? t("edit") : t("add")}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PumpModal
