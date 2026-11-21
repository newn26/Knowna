import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // V3: navy + emerald. #10B981 fails 4.5:1 under white text, so solid buttons/links use the
        // deeper 600/700 steps and the pure accent (brand-400) is kept for icons, dots and dark surfaces.
        brand: { 50: '#ECFDF5', 100: '#D1FAE5', 400: '#10B981', 500: '#047857', 600: '#065F46', 700: '#064E3B' },
        ink: '#10243A',
        navy: { DEFAULT: '#10243A', 2: '#1D3553' },
        surface: '#F8FAFC',
        muted: '#64748B',
        fg: '#0F172A',
        // cool neutrals everywhere, matching the brief's border/text values
        gray: colors.slate,
      },
      fontFamily: { sans: ['Inter', '"Noto Sans Thai"', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgb(16 36 58 / 0.05), 0 1px 3px rgb(16 36 58 / 0.06)',
        lift: '0 12px 32px -8px rgb(16 36 58 / 0.18)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        rise: 'rise 500ms cubic-bezier(0.16,1,0.3,1) both',
        sheet: 'sheet 220ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
