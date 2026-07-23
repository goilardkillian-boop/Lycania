import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette inspirée du logo Lycania: lune rouge sang, nuit presque noire, glycines violettes.
        lycania: {
          void: '#0b0507',
          night: '#160a0d',
          panel: '#1f0f13',
          border: '#3a1620',
          blood: '#c4283c',
          bloodDark: '#7c1626',
          moon: '#e8465b',
          wisteria: '#8b7bd8',
          wisteriaSoft: '#b3a6ec',
          bone: '#f3e9ea',
          muted: '#a98d92'
        }
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['system-ui', 'sans-serif']
      },
      backgroundImage: {
        'blood-moon': 'radial-gradient(circle at 50% 30%, #4a1620 0%, #160a0d 55%, #0b0507 100%)'
      }
    }
  },
  plugins: []
} satisfies Config
