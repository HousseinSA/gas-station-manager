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
  const t = (global as any).useTranslations
    ? (global as any).useTranslations
    : null
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom d'utilisateur
        </label>
        <input
          type="text"
          value={userForm.name}
          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors duration-200"
          placeholder="Entrez le nom d'utilisateur"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={userForm.password}
            onChange={(e) =>
              setUserForm({ ...userForm, password: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors duration-200"
            placeholder="Entrez le mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-md hover:bg-gray-100"
          >
            {showPassword ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Stations autorisées
        </label>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {stations.map((station) => (
            <label
              key={station.id}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
            >
              <div className="relative flex items-center">
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
                  className="w-5 h-5 border-2 border-gray-300 rounded text-green-600 focus:ring-green-500/20 focus:ring-2 transition-colors duration-200"
                />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                  {station.name}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4">
      <div className="flex justify-between items-center mb-6">
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="hidden sm:inline">
            {(t && t("manageUsers")) || "Gestion des Utilisateurs"}
          </span>
          <span className="sm:hidden">
            {(t && t("usersTab")) || "Utilisateurs"}
          </span>
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">
            {(t && t("addUserBtn")) || "Ajouter Utilisateur"}
          </span>
          <span className="sm:inline">{(t && t("add")) || "Ajouter"}</span>
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 bg-gray-50/50 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span className="font-medium text-gray-700">
                    {(t && t("stationsLabel")) || "Stations:"}
                  </span>
                  <span className="text-gray-600">
                    {user.allowedStations
                      .map((id) => stations.find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUser(user)
                    setUserForm({
                      name: user.name,
                      password: user.password,
                      allowedStations: user.allowedStations,
                    })
                    setShowEditModal(true)
                  }}
                  className="p-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200"
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
                      setUserForm({
                        name: "",
                        password: "",
                        allowedStations: [],
                      })
                      setEditingUser(null)
                      setShowEditModal(false)
                      setShowAddModal(false)
                    }
                  }}
                  className="p-1.5 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* No permission fields */}
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {(t && t("noUsers")) || "Aucun utilisateur ajouté"}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setUserForm({ name: "", password: "", allowedStations: [] })
        }}
        title={(t && t("newUserTitle")) || "Nouvel Utilisateur"}
      >
        {UserFormContent()}
        <div className="flex gap-3 justify-end pt-6">
          <button
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700"
          >
            {(t && t("cancel")) || "Annuler"}
          </button>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            {(t && t("add")) || "Ajouter"}
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
        title={(t && t("editUserTitle")) || "Modifier Utilisateur"}
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
            {(t && t("cancel")) || "Annuler"}
          </button>
          <button
            onClick={handleUpdateUser}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {(t && t("edit")) || "Modifier"}
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagementView
