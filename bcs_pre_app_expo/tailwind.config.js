/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: {
          50: '#e6fcf5',
          100: '#c3fae8',
          500: '#12b886',
          600: '#0ca678',
          700: '#099268',
        },
        accent: {
          50: '#fff9db',
          100: '#fff3bf',
          500: '#fcc419',
          600: '#fab005',
          700: '#f59f00',
        },
        slate: {
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
}

