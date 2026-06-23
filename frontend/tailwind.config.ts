import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f1b18",
        muted: "#6f6761",
        copper: "#b3654f",
        paper: "#f8f6f3"
      }
    }
  },
  plugins: []
};

export default config;
