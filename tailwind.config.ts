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
        primary: "var(--primary)",
        "primary-text": "var(--primary-text)",
        "card-header": "var(--card-header-bg)",
        "card-footer": "var(--card-footer-bg)",
        "card-grid-background": "var(--card-grid-background)",
        "end-card-bg": "var(--end-card-bg)",
        "sidebar-bg": "var(--sidebar-bg)",
        "input-bg": "var(--input-bg)",
        "social-tile-bg": "var(--social-tile-bg)",
        "social-icon-color": "var(--social-icon-color)",
        "social-text-color": "var(--social-text-color)",
        "body-primary-text": "var(--body-primary-text)",
        "header-footer-primary-text": "var(--header-footer-primary-text)",
        "header-footer-secondary-text": "var(--header-footer-secondary-text)",
        "send-text-button-bg": "var(--send-text-button-bg)",
        "send-text-button-text": "var(--send-text-button-text)",
        "save-contact-button-bg": "var(--save-contact-button-bg)",
        "save-contact-button-text": "var(--save-contact-button-text)",
        "link-icon-color": "var(--link-icon-color)",
        "link-text-color": "var(--link-text-color)",
        "end-card-header-secondary-text-color": "var(--end-card-header-secondary-text-color)",
        "share-modal-bg": "var(--share-modal-bg)",
        "button-text-dark": "var(--button-text-dark)",
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