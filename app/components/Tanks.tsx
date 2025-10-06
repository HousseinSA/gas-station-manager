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
  onEditTank?: (id: number) => void
}

const Tanks = ({ tanks, onAddTank, onDeleteTank, onEditTank }: TanksProps) => {
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
        {tanks.map((tank) => {
          const pct =
            tank.capacity > 0 ? (tank.currentLevel / tank.capacity) * 100 : 0
          const titleClass =
            pct <= 10
              ? "text-red-600 font-bold"
              : pct <= 20
              ? "text-yellow-600 font-bold"
              : "font-bold"
          const barClass =
            pct <= 10
              ? "bg-red-600"
              : pct <= 20
              ? "bg-yellow-500"
              : "bg-green-600"
          return (
            <div key={tank.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className={titleClass}>{tank.name}</h3>
                <div className="flex gap-2">
                  {onEditTank && (
                    <button
                      onClick={() => onEditTank(tank.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Éditer
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const msg = `Voulez-vous vraiment supprimer le réservoir ${tank.name} ?`
                      if (confirm(msg)) onDeleteTank(tank.id)
                    }}
                    className="text-red-600 hover:text-red-700"
                    title={`Supprimer ${tank.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
                  <span className="text-gray-600">Date d&apos;ajout:</span>{" "}
                  {new Date(tank.dateAdded).toLocaleDateString("fr-FR")}
                </div>
                <div>
                  <span className="text-gray-600">Taux de remplissage:</span>{" "}
                  {((tank.currentLevel / tank.capacity) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-3">
                <div
                  className={`${barClass} h-3 rounded-full transition-all`}
                  style={{
                    width: `${Math.min(
                      (tank.currentLevel / tank.capacity) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )
        })}
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
