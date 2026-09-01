import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF9F7",
        amber: {
          50:  "#FFF8F0",
          100: "#FEF3E2",
          200: "#FDE9C5",
          300: "#FAD49A",
          400: "#F5B870",
          500: "#E89B44",
          600: "#C97C2A",
          700: "#A86120",
          800: "#8A4C19",
          900: "#6D3C13",
        },
        stone: {
          50:  "#FAF9F7",
          100: "#F3F1ED",
          200: "#E8E4DE",
          300: "#D4CECC",
          400: "#AAA39E",
          500: "#847D77",
          600: "#635D58",
          700: "#4A4540",
          800: "#302C28",
          900: "#1A1714",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans:  ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        lg:    "10px",
        xl:    "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card:     "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        dropdown: "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
