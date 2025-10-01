import { useState } from "react"

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const login = (password: string) => {
    if (password === "admin123") {
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  const logout = () => setIsLoggedIn(false)

  return { isLoggedIn, login, logout }
}
