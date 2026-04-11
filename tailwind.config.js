/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#007aff',
        danger: '#ff2d55',
        success: '#34c759',
        warning: '#ff9500',
        purple: '#5856d6',
      },
    },
  },
  plugins: [],
}
