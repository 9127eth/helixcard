import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        black: '#221122',
        red: '#FF6A42',
        blue: '#B9E4FE',
        teal: '#93DBD6',
        'dark-pink': '#FECAB9',
        'light-pink': '#F1DBD9',
        'off-white': '#F5FDFD',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
