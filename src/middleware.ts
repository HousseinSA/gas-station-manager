// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing, Locale } from "./i18n/routing"

export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: "always",
  localeDetection: false,
})

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|api|.*\\..*).*)"],
}
