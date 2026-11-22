// Product illustration. Stands in for photography until real photos exist:
// pass `photo` to show a real image instead. Pre-owned pairs pass `wear` (0–25)
// and `seed` so each listing shows its own creases and scuffs.
import { useId } from 'react'
import type { ColorId } from '../lib/types'

const SOLE = 'M30 146 L30 166 Q30 174 40 174 L352 174 C380 174 395 166 399 154 L400 146 Z'
const UPPER = 'M36 145 C30 118 31 92 44 66 C74 62 104 72 126 85 L156 80 C168 61 193 52 214 57 C240 71 272 92 308 104 C352 114 386 124 397 139 L399 145 Z'
const TONGUE = 'M150 84 C160 62 186 48 214 52 C223 55 228 61 228 67 C202 66 178 74 160 88 Z'

const PALETTE: Record<ColorId, Record<string, string>> = {
  black: { upper: '#1d1d1d', hi: '#4a4a4a', counter: '#151515', tongue: '#262626', sole: '#0c0c0c', edge: '#2c2c2c', lace: '#0f0f0f', stitch: '#6b6b6b', eyelet: '#9a9a9a', lining: '#4a3a2e', outline: '#000000' },
  white: { upper: '#f5f3ee', hi: '#ffffff', counter: '#e8e4da', tongue: '#efece5', sole: '#e3ded3', edge: '#cdc6b8', lace: '#fafafa', stitch: '#b8b0a1', eyelet: '#8f887d', lining: '#cfc3ad', outline: '#a8a092' },
  brown: { upper: '#6b3f22', hi: '#9a643c', counter: '#56321a', tongue: '#74472a', sole: '#24170f', edge: '#3d2a1c', lace: '#3a2414', stitch: '#b08259', eyelet: '#d1ad84', lining: '#3a2618', outline: '#2a170b' },
}

export type ShoeView = 'side' | 'pair' | 'toe' | 'heel'

const VIEWBOX: Record<ShoeView, string> = {
  side: '0 20 430 190',
  pair: '0 0 470 220',
  toe: '215 40 205 150',
  heel: '10 40 205 150',
}

function rand(seed: number) {
  let s = seed || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function Body({ color, wear = 0, seed = 1, id }: { color: ColorId; wear?: number; seed?: number; id: string }) {
  const p = PALETTE[color]
  const r = rand(seed)
  const creases = Math.round(wear / 4)
  const scuffs = Math.round(wear / 5)
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-up`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.hi} />
          <stop offset="0.45" stopColor={p.upper} />
          <stop offset="1" stopColor={p.counter} />
        </linearGradient>
        <linearGradient id={`${id}-sole`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.edge} />
          <stop offset="1" stopColor={p.sole} />
        </linearGradient>
      </defs>
      {/* rim light: off (--rim-a: 0) on light surfaces, on in dark mode and on dark cards */}
      <g transform="translate(0 -1.5)" fill="none" stroke="#d8d3cb" strokeWidth="3" style={{ strokeOpacity: 'var(--rim-a, 0)' }}>
        <path d={SOLE} />
        <path d={UPPER} />
        <path d={TONGUE} />
      </g>
      {/* outsole */}
      <path d={SOLE} fill={`url(#${id}-sole)`} stroke={p.outline} strokeOpacity=".35" />
      {Array.from({ length: 22 }, (_, i) => (
        <line key={i} x1={46 + i * 15} y1="168" x2={46 + i * 15} y2="173" stroke={p.outline} strokeOpacity=".25" strokeWidth="2" />
      ))}
      {/* heel block */}
      <path d="M30 151 L114 151 L116 174 L40 174 Q30 174 30 166 Z" fill={p.sole} opacity=".55" />
      <path d="M114 151 L116 174" stroke={p.outline} strokeOpacity=".3" />
      {/* welt strip */}
      <path d="M31 144 L399 144 L400 151 L30 151 Z" fill={p.edge} />
      <path d="M36 147.5 L394 147.5" stroke={p.stitch} strokeWidth="1.2" strokeDasharray="4 3" />
      {/* lining visible in the ankle opening */}
      <path d="M46 68 C76 61 106 70 128 85 C102 80 74 74 46 74 Z" fill={p.lining} />
      {/* upper */}
      <path
        d={UPPER}
        fill={`url(#${id}-up)`}
        stroke={p.outline}
        strokeOpacity=".45"
        strokeWidth="1.2"
      />
      {/* tongue */}
      <path d={TONGUE} fill={p.tongue} stroke={p.outline} strokeOpacity=".35" />
      {/* heel counter */}
      <path d="M36 145 C31 120 32 94 44 67 C60 66 76 71 90 78 C94 102 96 124 101 145 Z" fill={p.counter} opacity=".9" />
      <path d="M90 78 C94 102 96 124 101 145" stroke={p.stitch} strokeWidth="1.1" strokeDasharray="3.5 3" fill="none" />
      {/* eyestay */}
      <path d="M126 85 C156 97 206 105 252 101 C264 100 272 97 279 93" stroke={p.outline} strokeOpacity=".5" strokeWidth="1.4" fill="none" />
      <path d="M128 90 C158 101 206 109 254 105" stroke={p.stitch} strokeWidth="1.1" strokeDasharray="3.5 3" fill="none" />
      {/* laces and eyelets */}
      {[
        [170, 95],
        [192, 98.5],
        [214, 100.5],
        [236, 101],
      ].map(([x, y], i) => (
        <g key={i}>
          <path d={`M${x} ${y} L${x + 20} ${y - 17}`} stroke={p.lace} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx={x} cy={y} r="2.6" fill={p.eyelet} />
        </g>
      ))}
      <path d="M176 76 C160 64 150 74 168 79 M178 76 C188 60 202 66 184 78" stroke={p.lace} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M178 78 C172 92 166 100 160 108 M180 78 C184 92 188 100 192 106" stroke={p.lace} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* toe cap */}
      <path d="M314 106 C328 119 331 133 327 145" stroke={p.outline} strokeOpacity=".45" strokeWidth="1.3" fill="none" />
      <path d="M320 108 C334 121 337 134 333 145" stroke={p.stitch} strokeWidth="1.1" strokeDasharray="3.5 3" fill="none" />
      {/* gloss */}
      <path d="M248 88 C286 102 326 112 366 121" stroke="#fff" strokeOpacity={color === 'white' ? 0.5 : 0.22} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M52 92 C50 108 52 124 56 136" stroke="#fff" strokeOpacity={color === 'white' ? 0.6 : 0.12} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* wear: creases across the vamp and scuffs on toe and heel */}
      {Array.from({ length: creases }, (_, i) => {
        const x = 262 + r() * 40
        return <path key={'c' + i} d={`M${x} ${96 + r() * 6} q 6 ${8 + r() * 4} 2 ${14 + r() * 6}`} stroke={p.outline} strokeOpacity=".35" strokeWidth="1" fill="none" />
      })}
      {Array.from({ length: scuffs }, (_, i) => {
        const toe = r() > 0.4
        const x = toe ? 350 + r() * 38 : 38 + r() * 20
        const y = toe ? 122 + r() * 18 : 110 + r() * 28
        return <ellipse key={'s' + i} cx={x} cy={y} rx={3 + r() * 5} ry={1 + r() * 1.5} fill={color === 'white' ? '#9b937f' : '#ffffff'} opacity={color === 'white' ? 0.35 : 0.18} transform={`rotate(${-20 + r() * 40} ${x} ${y})`} />
      })}
    </g>
  )
}

export function Shoe({
  color,
  view = 'side',
  wear = 0,
  seed = 1,
  photo,
  className = '',
  shadow = true,
  label,
}: {
  color: ColorId
  view?: ShoeView
  wear?: number
  seed?: number
  photo?: string
  className?: string
  shadow?: boolean
  label?: string
}) {
  // unique per instance: the same colour/view can appear twice on a page (e.g. cart drawer + page)
  const id = 'shoe' + useId().replace(/:/g, '')
  const alt = label ?? `รองเท้านักเรียนสี${color === 'black' ? 'ดำ' : color === 'white' ? 'ขาว' : 'น้ำตาล'}`
  if (photo) return <img src={photo} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />
  return (
    <svg viewBox={VIEWBOX[view]} className={className} role="img" aria-label={alt}>
      {shadow && <ellipse cx={view === 'pair' ? 250 : 215} cy={view === 'pair' ? 196 : 179} rx={view === 'pair' ? 210 : 185} ry="7" fill="#000" opacity=".14" />}
      {view === 'pair' ? (
        <>
          <g transform="translate(58 4) scale(.94)" opacity=".92">
            <Body color={color} wear={wear} seed={seed + 7} id={id + 'b'} />
          </g>
          <g transform="translate(0 22)">
            <Body color={color} wear={wear} seed={seed} id={id} />
          </g>
        </>
      ) : (
        <Body color={color} wear={wear} seed={seed} id={id} />
      )}
    </svg>
  )
}

// Top-down and underside views for the inspection walkthrough (same palette, toe to the right).
const OUTLINE = 'M30 100 C30 58 62 40 112 36 C190 30 300 34 352 52 C384 64 396 84 396 100 C396 116 384 136 352 148 C300 166 190 170 112 164 C62 160 30 142 30 100 Z'
const UPPER_TOP = 'M38 100 C38 63 67 47 113 43 C190 37 298 41 348 58 C377 69 388 86 388 100 C388 114 377 131 348 142 C298 159 190 163 113 157 C67 153 38 137 38 100 Z'

export function ShoeFlat({ color, side, wear = 0, className = '', label }: { color: ColorId; side: 'top' | 'sole'; wear?: number; className?: string; label?: string }) {
  const p = PALETTE[color]
  const id = 'flat' + useId().replace(/:/g, '')
  const eyes = [180, 202, 224, 246]
  return (
    <svg viewBox="0 0 420 200" className={className} role="img" aria-label={label ?? (side === 'top' ? 'มุมบนของรองเท้า' : 'พื้นรองเท้า')}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.counter} />
          <stop offset="0.5" stopColor={p.hi} />
          <stop offset="1" stopColor={p.counter} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>
      <ellipse cx="214" cy="178" rx="180" ry="9" fill="#000" opacity=".12" />
      <path d={OUTLINE} fill={side === 'top' ? p.sole : p.edge} stroke={p.outline} strokeOpacity=".35" />
      {side === 'top' ? (
        <>
          <path d={UPPER_TOP} fill={`url(#${id}-g)`} stroke={p.outline} strokeOpacity=".4" />
          <path d={UPPER_TOP} fill="none" stroke={p.stitch} strokeWidth="1.2" strokeDasharray="4 3" transform="translate(214 100) scale(.93) translate(-214 -100)" />
          <path d="M318 50 C300 72 300 128 318 150" stroke={p.outline} strokeOpacity=".45" strokeWidth="1.3" fill="none" />
          <ellipse cx="116" cy="100" rx="60" ry="36" fill={p.lining} stroke={p.outline} strokeOpacity=".4" />
          <ellipse cx="118" cy="100" rx="51" ry="28" fill={p.lining} opacity=".75" />
          <text x="118" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={p.stitch} opacity=".9">
            KAOWNA
          </text>
          <path d="M168 82 L262 86 C271 90 271 110 262 114 L168 118 Z" fill={p.tongue} stroke={p.outline} strokeOpacity=".3" />
          {eyes.map((x) => (
            <g key={x}>
              <path d={`M${x} 76 L${x + 22} 124 M${x} 124 L${x + 22} 76`} stroke={p.lace} strokeWidth="4" strokeLinecap="round" />
              <circle cx={x} cy="76" r="3" fill={p.eyelet} />
              <circle cx={x} cy="124" r="3" fill={p.eyelet} />
            </g>
          ))}
          <ellipse cx="350" cy="88" rx="26" ry="9" fill="#fff" opacity={color === 'white' ? 0.5 : 0.15} />
        </>
      ) : (
        <g clipPath={`url(#${id}-c)`}>
          {/* heel block, then chevron tread toward the toe */}
          <rect x="20" y="20" width="102" height="170" fill={p.sole} />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1="30" x2="120" y1={44 + i * 14} y2={44 + i * 14} stroke={p.edge} strokeWidth="4" />
          ))}
          <rect x="122" y="20" width="290" height="170" fill={p.sole} opacity=".85" />
          {Array.from({ length: 19 }, (_, i) => (
            <path key={i} d={`M${134 + i * 14} 40 l 9 60 l -9 60`} stroke={p.edge} strokeWidth="4" fill="none" />
          ))}
          <text x="250" y="105" textAnchor="middle" fontSize="12" fontWeight="800" fill={p.edge} letterSpacing="2">
            KAOWNA
          </text>
          {/* worn patches under the ball of the foot and the heel */}
          <ellipse cx="300" cy="100" rx="40" ry="30" fill="#fff" opacity={Math.min(0.18, wear / 120)} />
          <ellipse cx="72" cy="100" rx="30" ry="26" fill="#fff" opacity={Math.min(0.15, wear / 140)} />
        </g>
      )}
    </svg>
  )
}
