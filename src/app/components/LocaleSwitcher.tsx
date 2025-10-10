"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowDown, Globe } from "lucide-react"

const LOCALES = [
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
]

function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
}

export default function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const current = ((): string => {
    if (typeof document === "undefined") return "ar"
    const m = document.cookie.match(/(^|;)\s*NEXT_LOCALE=([^;]+)/)
    return m ? decodeURIComponent(m[2]) : "ar"
  })()

  const changeLocale = (locale: string) => {
    setLocaleCookie(locale)
    const parts = (pathname || "/").split("/").filter(Boolean)
    const first = parts[0]
    const isLocale = first.length === 2
    if (isLocale) parts[0] = locale
    else parts.unshift(locale)
    const newPath = `/${parts.join("/")}`
    router.push(newPath)
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* 🌐 Globe button for small screens */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="sm:hidden p-2 rounded bg-green-700 hover:bg-green-800 "
      >
        <Globe size={18} />
      </button>

      {/* Dropdown on small screens */}
      {open && (
        <div className="absolute right-0 mt-1 text-black
         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md p-1 sm:hidden z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLocale(l.code)}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                current === l.code
                  ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                  : ""
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Normal select for larger screens */}
      <div className="hidden sm:flex items-center gap-2">
        <select
          aria-label="Language"
          value={current}
          onChange={(e) => changeLocale(e.target.value)}
          className={`appearance-none bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer`}
          dir={current === "ar" ? "rtl" : "ltr"}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        {/* dropdown arrow */}
        <span className="absolute right-2 pointer-events-none text-gray-500 dark:text-gray-400 text-xs">
          <ArrowDown size={12} />
        </span>
      </div>
    </div>
  )
}
