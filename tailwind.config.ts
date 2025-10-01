import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        main: "var(--color-main)",
        secondary: "var(--color-secondary)",
        primary: "var(--color-primary)",
        "primary-light": "var(--color-primary-light)",
      },
    },
  },
  plugins: [],
}
export default config
