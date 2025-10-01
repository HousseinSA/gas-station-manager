"use client"
import React from "react"
import { Plus, Trash2 } from "lucide-react"

interface Tank {
  id: number
  name: string
  capacity: number
  currentLevel: number
  dateAdded: string
}

interface TanksProps {
  tanks: Tank[]
  onAddTank: () => void
  onDeleteTank: (id: number) => void
}

const Tanks = ({ tanks, onAddTank, onDeleteTank }: TanksProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Réservoirs</h2>
        <button
          onClick={onAddTank}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter Réservoir
        </button>
      </div>
      <div className="space-y-4">
        {tanks.map((tank) => (
          <div key={tank.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold">{tank.name}</h3>
              <button
                onClick={() => onDeleteTank(tank.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Capacité:</span>{" "}
                {tank.capacity.toLocaleString()} L
              </div>
              <div>
                <span className="text-gray-600">Niveau actuel:</span>{" "}
                {tank.currentLevel.toFixed(2)} L
              </div>
              <div>
                <span className="text-gray-600">Date d'ajout:</span>{" "}
                {new Date(tank.dateAdded).toLocaleDateString("fr-FR")}
              </div>
              <div>
                <span className="text-gray-600">
                  Taux de remplissage:
                </span>{" "}
                {((tank.currentLevel / tank.capacity) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (tank.currentLevel / tank.capacity) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
        {tanks.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun réservoir ajouté
          </p>
        )}
      </div>
    </div>
  )
}

export default Tanks
