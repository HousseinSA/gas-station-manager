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
  const [error, setError] = React.useState<string | null>(null)
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
          <div className="flex items-center gap-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              onClick={() => {
                const payload = {
                  name: tankForm.name.trim(),
                  capacity: Number(tankForm.capacity) || 0,
                  currentLevel: Number(tankForm.currentLevel) || 0,
                }
                // validate
                if (!payload.name) {
                  setError("Le nom du r\u00e9servoir est requis")
                  return
                }
                if (payload.capacity <= 0) {
                  setError("La capacit\u00e9 doit être > 0")
                  return
                }
                // clamp current level to capacity
                if (payload.currentLevel > payload.capacity) {
                  payload.currentLevel = payload.capacity
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
                  setError(null)
                  onClose()
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {onSaveEdit ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TankModal
