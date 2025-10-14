import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px"
      }
    },
    extend: {
      colors: {
        background: "hsl(210 40% 96%)",
        foreground: "hsl(210 15% 16%)",
        muted: "hsl(210 30% 90%)",
        accent: {
          DEFAULT: "hsl(188 76% 44%)",
          foreground: "#fff"
        },
        danger: "hsl(0 84% 60%)",
        warning: "hsl(37 92% 50%)",
        success: "hsl(142 76% 36%)",
        border: "hsl(210 30% 82%)",
        card: "hsl(0 0% 100%)",
        ring: "hsl(188 76% 44%)",
        slate: {
          950: "hsl(222 47% 11%)"
        }
      },
      fontFamily: {
        sans: ["Inter", "var(--font-sans)"]
      },
      boxShadow: {
        sm: "0 2px 8px -2px rgba(15, 23, 42, 0.08)",
        md: "0 8px 24px -6px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        pill: "999px"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
