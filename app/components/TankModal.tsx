"use client"
import React from "react"
import Modal from "./Modal"

interface TankForm {
  name: string
  capacity: string
  currentLevel: string
}

interface TankModalProps {
  show: boolean
  onClose: () => void
  tankForm: TankForm
  setTankForm: (form: TankForm) => void
  // onAddTank receives the new tank payload
  onAddTank: (tank: {
    name: string
    capacity: number
    currentLevel: number
  }) => void
  // onSaveEdit receives the updated tank payload
  onSaveEdit?: (tank: {
    name: string
    capacity: number
    currentLevel: number
  }) => void
}

const TankModal = ({
  show,
  onClose,
  tankForm,
  setTankForm,
  onAddTank,
  onSaveEdit,
}: TankModalProps) => {
  if (!show) return null

  return (
    <Modal show={show} onClose={onClose} title="Nouveau Réservoir">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom du Réservoir
          </label>
          <input
            type="text"
            value={tankForm.name}
            onChange={(e) => setTankForm({ ...tankForm, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Ex: Réservoir Gasoil 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Capacité (Litres)
          </label>
          <input
            type="number"
            value={tankForm.capacity}
            onChange={(e) =>
              setTankForm({ ...tankForm, capacity: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Ex: 10000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Niveau Actuel (Litres)
          </label>
          <input
            type="number"
            value={tankForm.currentLevel}
            onChange={(e) =>
              setTankForm({ ...tankForm, currentLevel: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Ex: 8000"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              const payload = {
                name: tankForm.name.trim(),
                capacity: Number(tankForm.capacity) || 0,
                currentLevel: Number(tankForm.currentLevel) || 0,
              }
              console.log("[TankModal] save clicked", {
                isEdit: !!onSaveEdit,
                payload,
              })
              try {
                if (onSaveEdit) {
                  onSaveEdit(payload)
                } else {
                  onAddTank(payload)
                }
              } finally {
                // close modal locally after invoking handler
                onClose()
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {onSaveEdit ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TankModal
