"use client"

import React from "react"
import { Fuel, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"

interface LoginProps {
  onLogin: (password: string) => void
}

const Login = ({ onLogin }: LoginProps) => {
  const t = useTranslations()
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = () => {
    onLogin(password)
  }

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Fuel className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">{t("appTitle")}</h1>
        <p className="text-center text-gray-600 mb-6">{t("stationsService")}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder={t("enterPassword")}
                aria-label={t("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            {t("signIn")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
