"use client"
import React from "react"
import { Plus } from "lucide-react"

interface PumpHeaderProps {
  onAddPump: () => void
}

const PumpHeader = ({ onAddPump }: PumpHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Pompes & Pistolets</h2>
      <button
        onClick={onAddPump}
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter Pompe
      </button>
    </div>
  )
}

export default PumpHeader
