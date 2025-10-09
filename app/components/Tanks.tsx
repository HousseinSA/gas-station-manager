"use client"
import React from "react"
import { Plus, Trash2 } from "lucide-react"

interface Tank {
  id: number
  name: string
  capacity: number
  currentLevel: number
  dateAdded: string
  fuelType: "Gasoil" | "Essence"
}

interface TanksProps {
  tanks: Tank[]
  onAddTank: () => void
  onDeleteTank: (id: number) => void
  onEditTank?: (id: number) => void
}

const Tanks = ({ tanks, onAddTank, onDeleteTank, onEditTank }: TanksProps) => {
  console.log("tanks", tanks)
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16M8 8h.01M8 12h.01M8 16h.01M16 8h.01M16 12h.01M16 16h.01"
            />
          </svg>
          <span className="hidden sm:inline">Réservoirs</span>
          <span className="sm:hidden">Réservoirs</span>
        </h2>
        <button
          onClick={onAddTank}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter Réservoir</span>
          <span className="sm:inline">Ajouter</span>
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
            <div
              key={tank.id}
              className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 bg-gray-50/50 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`${titleClass} flex items-center gap-2`}>
                    <span>{tank.name}</span>
                    <span
                      className={`${
                        tank.fuelType === "Gasoil"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tank.fuelType}
                    </span>
                  </h3>
                </div>
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
