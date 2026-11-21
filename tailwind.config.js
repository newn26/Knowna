/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#EEF3FF', 100: '#DCE7FF', 500: '#0156FF', 600: '#0047D6', 700: '#0039AB' },
        ink: '#000000',
        surface: '#F5F7FF',
        muted: '#6B7280',
      },
      fontFamily: { sans: ['Poppins', '"Noto Sans Thai"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
