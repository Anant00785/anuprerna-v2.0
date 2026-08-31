import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './contexts/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { xs: '420px' },
      // FIX 1: Use the --font-jost CSS variable injected by next/font/google.
      // Falls back through system-ui → sans-serif if the variable is not yet
      // resolved (e.g. CSS extraction pass before hydration).
      fontFamily: { sans: ['var(--font-jost)', 'system-ui', 'sans-serif'] },
      colors: {
        clay:   '#7D5B20',
        clayd:  '#6c5b48',
        bark:   '#8E7862',
        sand:   '#F0EEE9',
        cream:  '#fffcf7',
        // wholesale-section gradient palette (from fabric theme)
        primary:        '#cdbfa3',
        secondary:      '#e7d9da',
        'soft-lavender':'#d6d2e8',
        'light-blue':   '#cdd9e8',
      },
      maxWidth: { 'screen-xl': '1280px' },
    },
  },
  plugins: [],
};
export default config;
