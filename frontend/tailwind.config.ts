import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        welve: {
          50:  "#F4F1FE",
          100: "#EDEBFB",
          200: "#DDD8F8",
          300: "#C5BAF4",
          400: "#A892F0",
          500: "#7C5CFC",
          600: "#6644D4",
          700: "#5234AC",
          800: "#3D2880",
          900: "#2C1C5C",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card:    "0 2px 12px rgba(124,92,252,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        table:   "0 2px 8px rgba(124,92,252,0.08)",
        sheet:   "−4px 0 32px rgba(0,0,0,0.12)",
        "modal": "0 8px 40px rgba(0,0,0,0.18)",
      },
      borderRadius: {
        input: "12px",
        card:  "16px",
        modal: "20px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(16px)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":        "fade-up 220ms cubic-bezier(0.23,1,0.32,1) both",
        "fade-in":        "fade-in 180ms ease-out both",
        "scale-in":       "scale-in 200ms cubic-bezier(0.23,1,0.32,1) both",
        "slide-up":       "slide-up 280ms cubic-bezier(0.23,1,0.32,1) both",
        "slide-in-right": "slide-in-right 280ms cubic-bezier(0.32,0.72,0,1) both",
        "shimmer":        "shimmer 1.8s ease-in-out infinite",
        "count-up":       "count-up 400ms cubic-bezier(0.23,1,0.32,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
