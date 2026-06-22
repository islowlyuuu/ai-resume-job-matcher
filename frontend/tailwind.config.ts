import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201a",
        moss: "#586b4d",
        clay: "#b75f3d",
        paper: "#f7f4ee"
      }
    }
  },
  plugins: []
};

export default config;
