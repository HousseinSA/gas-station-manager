"use client"
import { useState } from "react"

interface User {
  id: number
  name: string
  password: string
  isAdmin: boolean
  allowedStations: number[]
}

const ADMIN_USER: User = {
  id: 1,
  name: "Admin",
  password: "admin123",
  isAdmin: true,
  allowedStations: [],
}

export function useAuth() {
  const [users, setUsers] = useState<User[]>([ADMIN_USER])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const login = (password: string) => {
    // For admin, check the admin password
    if (password === "admin123") {
      setCurrentUser(ADMIN_USER)
      return true
    }

    // For other users, check if password matches
    const user = users.find((u) => !u.isAdmin && u.password === password)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const addUser = (userData: Omit<User, "id" | "isAdmin">) => {
    if (!currentUser?.isAdmin) return
    // Prevent creating a user with the same password as admin
    if (userData.password === ADMIN_USER.password) {
      alert(
        "Impossible: le mot de passe ne peut pas être identique au mot de passe admin."
      )
      return
    }
    // Require at least one allowed station when creating a user
    if (!userData.allowedStations || userData.allowedStations.length === 0) {
      alert(
        "Impossible: l'utilisateur doit avoir au moins une station accessible."
      )
      return
    }
    const newUser = {
      ...userData,
      id: Date.now(),
      isAdmin: false,
    }
    setUsers([...users, newUser])
  }

  const updateUser = (
    userId: number,
    updates: Partial<Omit<User, "id" | "isAdmin">>
  ) => {
    if (!currentUser?.isAdmin) return
    // Prevent updating user to use admin password
    if (updates.password && updates.password === ADMIN_USER.password) {
      alert(
        "Impossible: le mot de passe ne peut pas être identique au mot de passe admin."
      )
      return
    }
    // If allowedStations is being updated, require at least one station
    if (
      updates.allowedStations &&
      Array.isArray(updates.allowedStations) &&
      updates.allowedStations.length === 0
    ) {
      alert(
        "Impossible: l'utilisateur doit avoir au moins une station accessible."
      )
      return
    }
    setUsers(
      users.map((user) => (user.id === userId ? { ...user, ...updates } : user))
    )
  }

  const deleteUser = (userId: number) => {
    if (!currentUser?.isAdmin) return
    setUsers(users.filter((user) => user.id !== userId))
  }

  const getUsers = () => {
    if (!currentUser?.isAdmin) return []
    return users.filter((u) => !u.isAdmin)
  }

  const canAccessStation = (stationId: number) => {
    if (!currentUser) return false
    if (currentUser.isAdmin) return true
    return currentUser.allowedStations.includes(stationId)
  }

  const canViewSection = (section: string) => {
    if (!currentUser) return false
    if (currentUser.isAdmin) return true
    // Regular users can only view the pompes section
    return section === "pompes"
  }

  return {
    currentUser,
    isLoggedIn: !!currentUser,
    isAdmin: currentUser?.isAdmin ?? false,
    // main admin is the special built-in admin user (ADMIN_USER)
    isMainAdmin: currentUser?.id === ADMIN_USER.id,
    users: getUsers(),
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    canAccessStation,
    canViewSection,
  }
}
