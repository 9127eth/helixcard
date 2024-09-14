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
        orange: {
          500: '#F97316',
          600: '#EA580C',
        },
        gray: {
          300: '#D1D5DB',
          400: '#9CA3AF',
          600: '#4B5563',
          800: '#1F2937',
        },
        indigo: {
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
