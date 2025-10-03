"use client"
import React, { useState } from "react"
import Modal from "./Modal"

interface UserModalProps {
  show: boolean
  onClose: () => void
  stations: { id: number; name: string }[]
  onAddUser: (user: {
    username: string
    password: string
    allowedStations: number[]
  }) => void
}

const UserModal = ({ show, onClose, stations, onAddUser }: UserModalProps) => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    allowedStations: [] as number[],
  })

  const handleSubmit = () => {
    if (!form.username || !form.password || form.allowedStations.length === 0) {
      alert(
        "Veuillez remplir tous les champs et sélectionner au moins une station"
      )
      return
    }

    onAddUser(form)
    setForm({ username: "", password: "", allowedStations: [] })
    onClose()
  }

  if (!show) return null

  return (
    <Modal show={show} onClose={onClose} title="Nouvel Utilisateur">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Nom d'utilisateur"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Mot de passe</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Mot de passe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Stations autorisées
          </label>
          <div className="space-y-2">
            {stations.map((station) => (
              <label key={station.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.allowedStations.includes(station.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm({
                        ...form,
                        allowedStations: [...form.allowedStations, station.id],
                      })
                    } else {
                      setForm({
                        ...form,
                        allowedStations: form.allowedStations.filter(
                          (id) => id !== station.id
                        ),
                      })
                    }
                  }}
                  className="mr-2"
                />
                {station.name}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UserModal
