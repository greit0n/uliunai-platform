/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'blood-red': '#dc2626',
        'dark-red': '#8B0000',
        'horror-gray': '#1a1a1a',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.3)',
        'blood': '0 4px 20px rgba(139, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
