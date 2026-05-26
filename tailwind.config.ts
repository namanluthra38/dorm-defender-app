import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  // include common extensions used in this project (js, jsx, ts, tsx, html)
  content: [
    "./index.html",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Premium Portal Redesign Colors
        "portal-primary": "var(--portal-primary, #3b5fad)",
        "portal-secondary": "#855300",
        "portal-error": "#ba1a1a",
        "portal-surface": "#f8f9ff",
        "portal-background": "var(--portal-background, #f8f9ff)",
        "inverse-on-surface": "#eaf1ff",
        "surface-container-high": "var(--surface-container-high, #dce9ff)",
        "secondary-fixed": "#ffddb8",
        "primary-container": "var(--primary-container, #2d4a77)",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#0f1f3a",
        "on-surface": "#0b1c30",
        "on-secondary-fixed": "#2a1700",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "tertiary-fixed-dim": "#89ceff",
        "inverse-surface": "#213145",
        "secondary-fixed-dim": "#ffb95f",
        "primary-fixed": "var(--primary-fixed, #dce1ff)",
        "inverse-primary": "#b6c4ff",
        "on-tertiary-fixed-variant": "#004c6e",
        "tertiary-container": "#004565",
        "tertiary-fixed": "#c9e6ff",
        "on-secondary-fixed-variant": "#653e00",
        "tertiary": "#002e44",
        "on-surface-variant": "#444651",
        "on-error-container": "#93000a",
        "on-secondary-container": "#684000",
        "surface-bright": "#f8f9ff",
        "primary-fixed-dim": "#b6c4ff",
        "on-primary-fixed-variant": "var(--on-primary-fixed-variant, #263f69)",
        "surface-variant": "var(--surface-variant, #d3e4fe)",
        "on-tertiary-container": "#36b6fb",
        "surface-container-low": "var(--surface-container-low, #eff4ff)",
        "outline-variant": "#c5c5d3",
        "surface-tint": "#4059aa",
        "surface-container": "var(--surface-container, #e5eeff)",
        "on-background": "#0b1c30",
        "surface-container-highest": "var(--surface-container-highest, #d3e4fe)",
        "surface-container-lowest": "#ffffff",
        "on-primary-container": "#90a8ff",
        "outline": "#757682",
        "on-tertiary-fixed": "#001e2f",
        "secondary-container": "#fea619",
        "surface-dim": "#cbdbf5",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
