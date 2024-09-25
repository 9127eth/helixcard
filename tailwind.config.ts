import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
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
        'card-header': 'var(--card-header-bg)',
        'card-footer': 'var(--card-footer-bg)',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
      },
      backgroundColor: {
        'card-grid-background': 'var(--card-grid-background)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;

