import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fb: {
          primary: "#D4A373",
          secondary: "#BC9D81",
          accent: "#D4A373",
          accentBg: "#fffbf8",
          topNotifyBg: "#fbf4e8",
          textBlack: "#302e2e",
          textGrey: "#3c3c3c",
          primaryBrown: "#7D5A20",
          borderGray: "#D1D4DB",
          somewhatWhite: "#fefefe",
        },
        anuprerna: {
          50: "#8D7961",
          100: "#B7A990",
          200: "#F0EEE9",
          250: "#28282D",
          300: "#efeee9",
          350: "#f6f6f6",
          400: "#808080",
          10: "#a7c957",
          20: "#f6bd60",
          gold: "#856637",
          darkGold: "#7D5A20",
          taupe: "#A6957A",
          taupeHover: "#938368",
          cream: "#FAF8F5",
          wholesaleBg: "#EFF0F7",
          iconDark: "#1E2530",
        },
        golden: "#FFD700",
        lightBrown: "#D4B996",
        lightPurple: "#E6E6FA",
        teal: "#008080",
        accentLink: "#948467",
      },
      fontFamily: {
        sans: ["var(--font-mulish)", "sans-serif"],
        serif: ["var(--font-dm-serif)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        jost: ["var(--font-jost)", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};
export default config;
