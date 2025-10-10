"use client"
import { useEffect, useState } from "react"

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
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any) => setUsers(data || []))
      .catch(() => {})
  }, [])
  useEffect(() => {
    fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any) => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => {})
      .finally(() => setInitialized(true))
  }, [])

  const login = async (password: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return false
    const data = await res.json()
    setCurrentUser(data.user)
    setInitialized(true)
    return true
  }

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" })
    setCurrentUser(null)
  }

  const addUser = async (userData: Omit<User, "id" | "isAdmin">) => {
    if (!currentUser?.isAdmin) return
    if (userData.password === ADMIN_USER.password) {
      alert(
        "Impossible: le mot de passe ne peut pas être identique au mot de passe admin."
      )
      return
    }
    if (!userData.allowedStations || userData.allowedStations.length === 0) {
      alert(
        "Impossible: l'utilisateur doit avoir au moins une station accessible."
      )
      return
    }
    const res = await fetch("/api/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(err?.error || "Failed to create user")
      return
    }
    const created = await res.json()
    setUsers((prev) => [...prev, created])
  }

  const updateUser = async (
    userId: number,
    updates: Partial<Omit<User, "id" | "isAdmin">>
  ) => {
    if (!currentUser?.isAdmin) return
    if (updates.password && updates.password === ADMIN_USER.password) {
      alert(
        "Impossible: le mot de passe ne peut pas être identique au mot de passe admin."
      )
      return
    }
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
    const res = await fetch("/api/users", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...updates }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
  }

  const deleteUser = async (userId: number) => {
    if (!currentUser?.isAdmin) return
    const res = await fetch(`/api/users?id=${userId}`, {
      method: "DELETE",
      credentials: "include",
    })
    if (!res.ok) return
    setUsers((prev) => prev.filter((u) => u.id !== userId))
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
    initialized,
  }
}
