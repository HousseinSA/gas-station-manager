"use client"
import React, { useState } from "react"
import { Fuel } from "lucide-react"

interface LoginProps {
  onLogin: (password: string) => void
}

const Login = ({ onLogin }: LoginProps) => {
  const [password, setPassword] = useState("")

  const handleSubmit = () => {
    onLogin(password)
  }
  // bg-gradient-to-br from-green-900 to-green-700
  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Fuel className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">
          Système de Gestion
        </h1>
        <p className="text-center text-gray-600 mb-6">Stations-Service</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Entrez le mot de passe"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
