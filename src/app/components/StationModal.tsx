"use client"
import React from "react"
import Modal from "./Modal"
import { useTranslations } from "next-intl"

interface StationForm {
  name: string
}

interface StationModalProps {
  show: boolean
  onClose: () => void
  stationForm: StationForm
  setStationForm: (form: StationForm) => void
  onAddStation: () => void
}

const StationModal = ({
  show,
  onClose,
  stationForm,
  setStationForm,
  onAddStation,
}: StationModalProps) => {
  const t = useTranslations()
  if (!show) return null

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={t("stationTitle") || "Nom de la Station"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("stationNameLabel") || "Nom de la Station"}
          </label>
          <input
            type="text"
            value={stationForm.name}
            onChange={(e) => setStationForm({ name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder={t("stationNameLabel")}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {(t && t("cancel")) || "Annuler"}
          </button>
          <button
            onClick={onAddStation}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {(t && t("add")) || "Ajouter"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default StationModal
