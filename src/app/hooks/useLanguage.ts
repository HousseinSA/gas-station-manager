"use client"

import { useLocale, useTranslations } from "next-intl"

const useLanguage = () => {
  const t = useTranslations()
  const locale = useLocale()
  const isArabic = locale === "ar"

  return { t, isArabic }
}
export default useLanguage
