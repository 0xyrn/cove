/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        canvas: { light: '#FAFAF8', dark: '#1A1A1E', grid: '#E5E3DD' },
        card: { bg: '#FFFFFF', border: '#E5E3DD', header: '#F7F6F3' },
        term: { bg: '#1A1A2E', text: '#C8C8D4' },
        theme: {
          canvas: 'var(--bg-canvas)',
          card: 'var(--bg-card)',
          header: 'var(--bg-header)',
          hover: 'var(--bg-hover)',
          border: 'var(--border)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', 'monospace'],
        sans: ['"Inter"', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
