"use client"
import React, { useState } from "react"
import { Trash2, Edit, Plus } from "lucide-react"
import Modal from "./Modal"

interface User {
  id: number
  name: string
  password: string
  allowedStations: number[]
}

interface UserManagementViewProps {
  users: User[]
  stations: { id: number; name: string }[]
  onAddUser: (user: Omit<User, "id">) => void
  onDeleteUser: (userId: number) => void
  onUpdateUser: (userId: number, updates: Partial<User>) => void
}

const UserManagementView = ({
  users,
  stations,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
}: UserManagementViewProps) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [userForm, setUserForm] = useState({
    name: "",
    password: "",
    allowedStations: [] as number[],
  })

  const handleAddUser = () => {
    if (
      !userForm.name ||
      !userForm.password ||
      userForm.allowedStations.length === 0
    ) {
      alert(
        "Veuillez remplir tous les champs et sélectionner au moins une station"
      )
      return
    }
    onAddUser({
      name: userForm.name,
      password: userForm.password,
      allowedStations: userForm.allowedStations,
    })
    setUserForm({ name: "", password: "", allowedStations: [] })
    setShowAddModal(false)
  }

  const handleUpdateUser = () => {
    if (!editingUser) return
    if (
      !userForm.name ||
      !userForm.password ||
      userForm.allowedStations.length === 0
    ) {
      alert(
        "Veuillez remplir tous les champs et sélectionner au moins une station"
      )
      return
    }
    onUpdateUser(editingUser.id, {
      name: userForm.name,
      password: userForm.password,
      allowedStations: userForm.allowedStations,
    })
    setEditingUser(null)
    setUserForm({ name: "", password: "", allowedStations: [] })
    setShowEditModal(false)
  }

  const UserFormContent = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom d'utilisateur
        </label>
        <input
          type="text"
          value={userForm.name}
          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Nom d'utilisateur"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Mot de passe</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={userForm.password}
            onChange={(e) =>
              setUserForm({ ...userForm, password: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Stations autorisées
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {stations.map((station) => (
            <label key={station.id} className="flex items-center">
              <input
                type="checkbox"
                checked={userForm.allowedStations.includes(station.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setUserForm({
                      ...userForm,
                      allowedStations: [
                        ...userForm.allowedStations,
                        station.id,
                      ],
                    })
                  } else {
                    setUserForm({
                      ...userForm,
                      allowedStations: userForm.allowedStations.filter(
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
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gestion des Utilisateurs</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter Utilisateur
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">{user.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  Stations:{" "}
                  {user.allowedStations
                    .map((id) => stations.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUser(user)
                    setUserForm({
                      name: user.name,
                      password: user.password, // Pre-fill with existing password
                      allowedStations: user.allowedStations,
                    })
                    setShowEditModal(true)
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                      )
                    ) {
                      onDeleteUser(user.id)
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* No permission fields */}
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun utilisateur ajouté
          </p>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setUserForm({ name: "", password: "", allowedStations: [] })
        }}
        title="Nouvel Utilisateur"
      >
        {UserFormContent()}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
          setUserForm({ name: "", password: "", allowedStations: [] })
        }}
        title="Modifier Utilisateur"
      >
        {UserFormContent()}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={() => {
              setShowEditModal(false)
              setEditingUser(null)
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleUpdateUser}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Modifier
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagementView
