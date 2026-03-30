/** @type {import('tailwindcss').Config} */
export default {
  /* Utilities precisam vencer o body { color: #a7afb7 } do Connect Plus em todas as páginas Tailwind */
  important: ":is(#pontos-nota-root, #pricing-onboarding-root)",
  corePlugins: {
    preflight: false,
  },
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 4px 24px -4px rgb(0 0 0 / 0.08), 0 8px 16px -8px rgb(0 0 0 / 0.06)",
        "soft-lg": "0 12px 40px -8px rgb(0 0 0 / 0.12), 0 4px 16px -4px rgb(0 0 0 / 0.06)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.55s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
