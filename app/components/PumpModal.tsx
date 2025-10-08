"use client"
import React, { useEffect, useState } from "react"
import Modal from "./Modal"
import { Station, Nozzle } from "../hooks/useStations"

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
            fuelType: "Gasoil",
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
      title={isEditing ? "Modifier Pompe" : "Nouvelle Pompe"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Numéro de Pompe
          </label>
          <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm text-gray-700">
            {isEditing && pumpForm.pumpNumber
              ? pumpForm.pumpNumber
              : "Auto (assigné lors de l'ajout)"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre de Pistolets
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
                    fuelType: "Gasoil",
                    tankId: currentStation?.tanks[0]?.id || 0,
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
            <h3 className="font-medium">Configuration des Pistolets</h3>
            {pendingNozzles.map((nozzle, index) => (
              <div
                key={nozzle.id}
                className="bg-gray-50 p-4 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm">Pistolet {index + 1}</h4>
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
                          ? "Impossible de supprimer: au moins un pistolet requis"
                          : "Supprimer"
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Type de Carburant
                    </label>
                    <select
                      value={nozzle.fuelType}
                      onChange={(e) => {
                        const val = e.target.value
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = { ...copy[index], fuelType: val }
                          return copy
                        })
                      }}
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
                      value={String(nozzle.tankId)}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = { ...copy[index], tankId: v }
                          return copy
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                    >
                      {currentStation?.tanks.map((tank) => (
                        <option key={tank.id} value={tank.id}>
                          {tank.name}
                        </option>
                      ))}
                      {(!currentStation?.tanks ||
                        currentStation.tanks.length === 0) && (
                        <option value={0}>Aucun réservoir</option>
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
                      onChange={(e) => {
                        const v =
                          e.target.value === "" ? 0 : parseFloat(e.target.value)
                        setPendingNozzles((prev) => {
                          const copy = [...prev]
                          copy[index] = { ...copy[index], costPrice: v }
                          return copy
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border rounded-lg"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">
                      Index d'installation
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
                      placeholder="0"
                      title={
                        isEditing &&
                        !nozzle.isNew &&
                        nozzle.currentIndex !== nozzle.previousIndex
                          ? "Cannot edit: Fuel has been sold from this nozzle"
                          : ""
                      }
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Index d'installation:{" "}
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
            Annuler
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
            {isEditing ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PumpModal
