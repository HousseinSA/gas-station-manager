import { defineRouting } from "next-intl/routing"

const locales = ["fr", "ar", "en"] as const

export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
})

export type Locale = (typeof routing.locales)[number]
