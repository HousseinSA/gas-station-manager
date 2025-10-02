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
  onAddTank: () => void
}

const TankModal = ({
  show,
  onClose,
  tankForm,
  setTankForm,
  onAddTank,
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
            onClick={onAddTank}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default TankModal
