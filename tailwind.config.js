/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (see src/index.css) so light/dark themes swap in one place.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: v('paper'), // page background
        card: v('card'), // raised surfaces
        ink: v('ink'), // primary text and solid buttons
        sub: v('sub'), // secondary text
        line: v('line'), // borders and dividers
        stone: v('stone'), // tinted neutral panels
        signal: v('signal'), // Trade-in accent, used sparingly
        ok: v('ok'),
        bad: v('bad'),
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        display: ['Archivo', '"IBM Plex Sans Thai"', 'sans-serif'],
      },
      letterSpacing: { tightest: '-0.045em' },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        sheet: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        step: { '0%,100%': { transform: 'translateY(0) rotate(0)' }, '50%': { transform: 'translateY(-6px) rotate(-1.5deg)' } },
        scan: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(100%)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        page: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        swap: { from: { opacity: '0', transform: 'translateX(18px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        bump: { '0%,100%': { transform: 'none' }, '40%': { transform: 'scale(1.28) rotate(-8deg)' } },
        turn: { from: { opacity: '0', transform: 'rotateY(-80deg) scale(.9)' }, to: { opacity: '1', transform: 'none' } },
        flip: { from: { opacity: '0', transform: 'rotateX(-150deg) scale(.9)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(0.16,1,0.3,1) both',
        fade: 'fade 400ms ease both',
        sheet: 'sheet 320ms cubic-bezier(0.16,1,0.3,1)',
        step: 'step 6s ease-in-out infinite',
        scan: 'scan 1.4s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        page: 'page 450ms cubic-bezier(0.16,1,0.3,1) both',
        swap: 'swap 500ms cubic-bezier(0.16,1,0.3,1) both',
        bump: 'bump 450ms cubic-bezier(0.16,1,0.3,1)',
        turn: 'turn 800ms cubic-bezier(0.16,1,0.3,1) both',
        flip: 'flip 900ms cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
}
