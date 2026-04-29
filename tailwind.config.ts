import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pink: "var(--pink)",
        "hot-pink": "var(--hot-pink)",
        "deep-pink": "var(--deep-pink)",
        blush: "var(--blush)",
        cream: "var(--cream)",
        wine: "var(--wine)",
        mauve: "var(--mauve)",
        gold: "var(--gold)",
        "gold-light": "var(--gold-light)",
        lavender: "var(--lavender)",
        mint: "var(--mint)",
        peach: "var(--peach)",
        sky: "var(--sky)",
        "pillar-engage": "var(--pillar-engage)",
        "pillar-educate": "var(--pillar-educate)",
        "pillar-inspire": "var(--pillar-inspire)",
        "pillar-connect": "var(--pillar-connect)",
        "pillar-convert": "var(--pillar-convert)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        ui: ["var(--font-ui)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        handwritten: ["var(--font-handwritten)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
