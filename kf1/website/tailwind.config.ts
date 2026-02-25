
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
      colors: {
        'blood-red': '#8B0000',
        'dark-red': '#4A0000',
        'horror-gray': '#1a1a1a',
      },
      backgroundImage: {
        'blood-gradient': 'linear-gradient(135deg, #8B0000 0%, #4A0000 100%)',
        'dark-gradient': 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.3)',
        'blood': '0 4px 20px rgba(139, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
} satisfies Config
