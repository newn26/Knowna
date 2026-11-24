// Diagrams of the swappable sole: a side view where the sole slides along the
// dovetail rail and a heel latch locks it, plus a cross-section of the rail.
// Schematic drawings, not product photos.
import { useEffect, useId, useState } from 'react'
import type { ColorId } from '../lib/types'
import { PALETTE, TONGUE, UPPER } from './Shoe'

export const SWAP_STEPS = [
  { id: 'locked', t: 'ล็อกอยู่', d: 'พื้นเกาะรางใต้รองเท้า สลักที่ส้นกันไม่ให้ไหลออก เดิน วิ่ง เตะบอลได้ตามปกติ' },
  { id: 'press', t: 'กดสลักที่ส้น', d: 'กดปุ่มสลักด้านหลังส้นค้างไว้ สลักจะยกออกจากพื้น' },
  { id: 'out', t: 'ดึงพื้นเก่าออกทางส้น', d: 'จับพื้นดึงไปทางส้น พื้นจะไหลออกตามราง เคาะทรายหรือเศษดินในรางออกก่อนใส่พื้นใหม่' },
  { id: 'in', t: 'สไลด์พื้นใหม่เข้า', d: 'เสียบลิ้นรางของพื้นใหม่ที่ส้น ดันไปทางปลายเท้าจนได้ยินเสียงคลิก แปลว่าล็อกแล้ว' },
] as const

const SOLE_BODY = 'M32 153 L398 153 C397 165 383 177 352 177 L42 177 Q32 177 32 169 Z'

function SolePiece({ color, worn, id }: { color: ColorId; worn: boolean; id: string }) {
  const p = PALETTE[color]
  return (
    <g>
      {/* dovetail tongue that rides inside the rail */}
      <rect x="46" y="147" width="336" height="7" rx="1.5" fill={p.edge} stroke={p.outline} strokeOpacity=".4" />
      <path d={SOLE_BODY} fill={`url(#${id}-sole)`} stroke={p.outline} strokeOpacity=".45" />
      {Array.from({ length: worn ? 8 : 22 }, (_, i) => {
        const x = worn ? 70 + i * 40 : 46 + i * 15
        return <line key={i} x1={x} y1="170" x2={x} y2="176" stroke={p.outline} strokeOpacity={worn ? 0.12 : 0.3} strokeWidth="2" />
      })}
      {worn && (
        <>
          <ellipse cx="300" cy="174" rx="46" ry="3.5" fill="#fff" opacity=".28" />
          <ellipse cx="74" cy="174" rx="30" ry="3" fill="#fff" opacity=".24" />
        </>
      )}
    </g>
  )
}

/** Side view. `step` follows SWAP_STEPS: 0 locked, 1 latch pressed, 2 old sole out, 3 new sole in. */
export function SoleRailSide({ color, step, className = '' }: { color: ColorId; step: number; className?: string }) {
  const p = PALETTE[color]
  const id = 'rail' + useId().replace(/:/g, '')
  const ease = 'transform 900ms cubic-bezier(.65,0,.35,1), opacity 700ms ease'
  const old = step < 2 ? { x: 0, o: 1 } : step === 2 ? { x: -190, o: 1 } : { x: -380, o: 0 }
  const fresh = step < 3 ? { x: -380, o: 0 } : { x: 0, o: 1 }
  const pressed = step === 1 || step === 2
  return (
    <svg viewBox="-200 30 640 170" className={className} role="img" aria-label={`ภาพอธิบายกลไกพื้นรองเท้า: ${SWAP_STEPS[step].t}`}>
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
      <ellipse cx="215" cy="186" rx="200" ry="6" fill="#000" opacity=".08" />

      {/* soles slide along the rail: toward the heel (left) to come out, toward the toe to go in */}
      <g style={{ transform: `translateX(${old.x}px)`, opacity: old.o, transition: ease }}>
        <SolePiece color={color} worn id={id} />
      </g>
      <g style={{ transform: `translateX(${fresh.x}px)`, opacity: fresh.o, transition: ease }}>
        <SolePiece color={color} worn={false} id={id} />
      </g>

      {/* upper with its rail plate */}
      <path d={UPPER} fill={`url(#${id}-up)`} stroke={p.outline} strokeOpacity=".45" strokeWidth="1.2" />
      <path d={TONGUE} fill={p.tongue} stroke={p.outline} strokeOpacity=".35" />
      <path d="M36 145 C31 120 32 94 44 67 C60 66 76 71 90 78 C94 102 96 124 101 145 Z" fill={p.counter} opacity=".9" />
      <rect x="30" y="141" width="370" height="8" rx="2" fill="#8a8f96" stroke="#3b3f45" strokeOpacity=".5" />
      <path d="M44 145 L384 145" stroke="#3b3f45" strokeOpacity=".55" strokeWidth="1.2" strokeDasharray="6 4" />

      {/* heel latch */}
      <g style={{ transform: `translateX(${pressed ? 6 : 0}px)`, transition: 'transform 300ms ease' }}>
        <rect x="14" y="138" width="14" height="30" rx="4" className={pressed ? 'fill-signal' : 'fill-[#5b6068]'} />
        <rect x="26" y="150" width={pressed ? 4 : 10} height="5" rx="1" fill="#3b3f45" style={{ transition: 'width 300ms ease' }} />
      </g>
      {step === 1 && <path d="M-14 153 L6 153 M0 147 L8 153 L0 159" className="stroke-signal" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {step === 2 && <path d="M-40 190 L-150 190 M-140 183 L-152 190 L-140 197" stroke="currentColor" strokeOpacity=".5" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {step === 3 && (
        <text x="-6" y="132" textAnchor="end" fontSize="18" fontWeight="800" className="fill-signal">
          คลิก!
        </text>
      )}
    </svg>
  )
}

/** Cross-section through the rail: the tongue is wider inside than at the opening, so it cannot drop out. */
export function DovetailSection({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 150" className={className} role="img" aria-label="ภาพตัดขวางรางหางเหยี่ยว: ลิ้นของพื้นกว้างด้านในแคบที่ปากราง จึงหลุดลงไม่ได้">
      {/* foot pressure */}
      {[70, 110, 150].map((x) => (
        <path key={x} d={`M${x} 2 L${x} 22 M${x - 6} 15 L${x} 23 L${x + 6} 15`} className="stroke-signal" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {/* rail plate on the shoe */}
      <path d="M20 30 L200 30 L200 72 L140 72 L158 44 L62 44 L80 72 L20 72 Z" fill="#8a8f96" stroke="#3b3f45" strokeWidth="1.5" />
      {/* sole with its dovetail tongue */}
      <path d="M20 73 L79 73 L61 45 L159 45 L141 73 L200 73 L200 112 Q200 120 192 120 L28 120 Q20 120 20 112 Z" className="fill-ink" fillOpacity=".82" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={32 + i * 20} y1="114" x2={32 + i * 20} y2="120" className="stroke-paper" strokeOpacity=".35" strokeWidth="3" />
      ))}
      <text x="110" y="62" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-paper">
        ลิ้นราง
      </text>
      <text x="110" y="140" textAnchor="middle" fontSize="11" fill="currentColor" opacity=".7">
        ปากรางแคบกว่าลิ้น พื้นจึงหลุดลงไม่ได้
      </text>
    </svg>
  )
}

/** Step-through of a sole swap. Plays by itself until someone picks a step. */
export function SoleSwapDemo({ color = 'brown', dark = false }: { color?: ColorId; dark?: boolean }) {
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setStep((s) => (s + 1) % SWAP_STEPS.length), 2600)
    return () => clearInterval(t)
  }, [auto])
  return (
    <div>
      <div className={`overflow-hidden rounded-3xl px-2 py-6 sm:px-6 ${dark ? 'bg-paper/5' : 'bg-stone'}`}>
        <SoleRailSide color={color} step={step} className="w-full" />
        <p className={`mt-1 text-center text-xs ${dark ? 'text-paper/50' : 'text-sub'}`}>ภาพอธิบายกลไก ไม่ใช่ภาพสินค้าจริง</p>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-4">
        {SWAP_STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => (setAuto(false), setStep(i))}
              aria-pressed={step === i}
              className={`h-full w-full rounded-2xl border p-4 text-left transition ${
                step === i ? (dark ? 'border-paper bg-paper/10' : 'border-ink bg-card') : dark ? 'border-paper/15 hover:border-paper/40' : 'border-line hover:border-sub'
              }`}
            >
              <span className="font-display text-sm font-bold tabular text-signal">0{i + 1}</span>
              <span className="mt-2 block font-semibold leading-tight">{s.t}</span>
              <span className={`mt-1 block text-sm ${dark ? 'text-paper/60' : 'text-sub'}`}>{s.d}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
