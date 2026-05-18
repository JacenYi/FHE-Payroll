/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        surface: '#141226',
        card: '#1C1A33',
        border: '#2D2A55',
        primary: '#8B5CF6',
        accent: '#A78BFA',
        highlight: '#22D3EE',
        success: '#34D399',
        'text-primary': '#F5F3FF',
        'text-muted': '#A1A1AA',
      },
    },
  },
  plugins: [],
}