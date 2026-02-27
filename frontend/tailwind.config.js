/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        dark: {
          50: "#e2e8f0",
          100: "#cbd5e1",
          200: "#94a3b8",
          300: "#64748b",
          400: "#475569",
          500: "#334155",
          600: "#1e293b",
          700: "#0f172a",
          800: "#0b1120",
          900: "#070d1a",
          950: "#040810",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          light: "#a78bfa",
          dark: "#7c3aed",
          blue: "#6366f1",
          cyan: "#22d3ee",
          emerald: "#34d399",
          rose: "#f472b6",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(139, 92, 246, 0.2)",
        "glow-blue": "0 0 20px rgba(99, 102, 241, 0.3)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};
