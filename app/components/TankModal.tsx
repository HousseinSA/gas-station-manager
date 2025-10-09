"use client"
import React from "react"
import Modal from "./Modal"

interface TankForm {
  name: string
  capacity: string
  currentLevel: string
  fuelType: "Gasoil" | "Essence"
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
    fuelType: "Gasoil" | "Essence"
  }) => void
  // onSaveEdit receives the updated tank payload
  onSaveEdit?: (tank: {
    name: string
    capacity: number
    currentLevel: number
    fuelType: "Gasoil" | "Essence"
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
  const [originalCapacity, setOriginalCapacity] = React.useState<number>(0)
  const [originalLevel, setOriginalLevel] = React.useState<number>(0)

  const isEditing = Boolean(onSaveEdit)
  React.useEffect(() => {
    if (isEditing && show) {
      setOriginalCapacity(parseFloat(tankForm.capacity) || 0)
      setOriginalLevel(parseFloat(tankForm.currentLevel) || 0)
    }
  }, [isEditing, show, tankForm])

  if (!show) return null

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isEditing ? "Modifier Réservoir" : "Nouveau Réservoir"}
    >
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
            onChange={(e) => {
              const newValue = Number(e.target.value)
              if (isEditing && newValue < originalCapacity) {
                return // Don't allow values lower than original
              }
              setTankForm({ ...tankForm, capacity: e.target.value })
            }}
            min={isEditing ? originalCapacity : 0}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Ex: 10000"
          />
          {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Type de Carburant
          </label>
          <select
            value={tankForm.fuelType}
            onChange={(e) =>
              setTankForm({
                ...tankForm,
                fuelType: e.target.value as "Gasoil" | "Essence",
              })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white ${
              isEditing ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            disabled={isEditing}
          >
            <option value="Gasoil">Gasoil</option>
            <option value="Essence">Essence</option>
          </select>
          {isEditing && (
            <div className="text-xs text-gray-500 mt-1">
              Le type de carburant ne peut pas être modifié après la création
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Niveau Actuel (Litres)
          </label>
          <input
            type="number"
            value={tankForm.currentLevel}
            onChange={(e) => {
              const newValue = Number(e.target.value)
              if (isEditing && newValue < originalLevel) {
                return // Don't allow values lower than original
              }
              setTankForm({ ...tankForm, currentLevel: e.target.value })
            }}
            min={isEditing ? originalLevel : 0}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
              isEditing ? "bg-gray-50" : ""
            }`}
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
                  fuelType: tankForm.fuelType as "Gasoil" | "Essence",
                }
                if (onSaveEdit) {
                  onSaveEdit(payload)
                } else {
                  onAddTank(payload)
                }
                setError(null)
                onClose()
              }}
              disabled={
                isEditing &&
                (Number(tankForm.capacity) < originalCapacity ||
                  Number(tankForm.currentLevel) < originalLevel)
              }
              className={`px-4 py-2 ${
                isEditing &&
                (Number(tankForm.capacity) < originalCapacity ||
                  Number(tankForm.currentLevel) < originalLevel)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              } text-white rounded-lg`}
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
