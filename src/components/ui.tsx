import { Check } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { COLORS } from '../lib/catalog'
import { baht } from '../lib/pricing'
import type { Step } from '../lib/status'
import type { ColorId } from '../lib/types'

type Variant = 'solid' | 'outline' | 'signal' | 'ghost'

const btn: Record<Variant, string> = {
  solid: 'bg-ink text-paper hover:bg-ink/85',
  outline: 'border border-ink/80 text-ink hover:bg-ink hover:text-paper',
  signal: 'bg-signal text-paper hover:brightness-110',
  ghost: 'text-ink hover:bg-ink/5',
}

export const buttonClass = (v: Variant = 'solid', size: 'md' | 'lg' | 'sm' = 'md') =>
  `group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[.97] disabled:pointer-events-none disabled:opacity-40 ${
    size === 'lg' ? 'h-14 px-8 text-base' : size === 'sm' ? 'h-9 px-4 text-sm' : 'h-12 px-6 text-[15px]'
  } ${btn[v]}`

export function Button({ variant = 'solid', size = 'md', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg' | 'sm' }) {
  return <button {...p} className={`${buttonClass(variant, size)} ${className}`} />
}

export function LinkButton({ to, variant = 'solid', size = 'md', className = '', children }: { to: string; variant?: Variant; size?: 'md' | 'lg' | 'sm'; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
    </Link>
  )
}

export const Price = ({ value, was, className = '' }: { value: number; was?: number; className?: string }) => (
  <span className={`tabular ${className}`}>
    <span className="font-semibold">{baht(value)}</span>
    {was && was > value && <span className="ml-2 text-sub line-through decoration-1">{baht(was)}</span>}
  </span>
)

export const SWATCH: Record<ColorId, string> = { black: '#1d1d1d', white: '#f5f3ee', brown: '#6b3f22' }

export function ColorPicker({ value, onChange }: { value: ColorId; onChange: (c: ColorId) => void }) {
  return (
    <div className="flex gap-3" role="group" aria-label="สี">
      {COLORS.map((c) => (
        <button
          key={c.id}
          aria-pressed={value === c.id}
          onClick={() => onChange(c.id)}
          className={`group flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition ${value === c.id ? 'border-ink' : 'border-line hover:border-sub'}`}
        >
          <span className={`h-7 w-7 rounded-full ring-1 ring-inset ring-black/15 transition duration-300 group-hover:scale-110 ${value === c.id ? 'scale-110' : ''}`} style={{ background: SWATCH[c.id] }} />
          <span className="font-medium">{c.name}</span>
        </button>
      ))}
    </div>
  )
}

export function SizeGrid({
  sizes,
  value,
  onChange,
  stockOf,
  highlight,
}: {
  sizes: number[]
  value: number | null
  onChange: (s: number) => void
  stockOf?: (s: number) => number
  highlight?: [number, number] | null
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="ไซซ์">
      {sizes.map((s) => {
        const left = stockOf ? stockOf(s) : 99
        const out = left <= 0
        const inRange = highlight && s >= highlight[0] && s <= highlight[1]
        return (
          <button
            key={s}
            aria-pressed={value === s}
            disabled={out}
            onClick={() => onChange(s)}
            className={`relative h-12 rounded-xl border text-sm font-semibold tabular transition ${
              value === s ? 'scale-[1.04] border-ink bg-ink text-paper' : inRange ? 'border-ink/50 bg-stone' : 'border-line hover:border-ink'
            } ${out ? 'cursor-not-allowed text-sub/50 line-through' : ''}`}
          >
            {s}
            {!out && left <= 3 && <span title={`เหลือ ${left} คู่`} aria-label={`เหลือ ${left} คู่`} className="absolute -top-1.5 right-1 rounded-full bg-signal px-1.5 text-[10px] font-bold leading-4 text-paper">{left}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Qty({ value, onChange, max = 10 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="inline-flex h-12 items-center rounded-full border border-line">
      <button aria-label="ลด" className="h-full w-11 text-lg disabled:opacity-30" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-8 text-center font-semibold tabular">{value}</span>
      <button aria-label="เพิ่ม" className="h-full w-11 text-lg disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}

export function GradeBadge({ grade, pct }: { grade: string; pct: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper tabular">
      เกรด {grade} · {pct}%
    </span>
  )
}

export function ConditionBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line" aria-label={`สภาพ ${pct}%`}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-ink transition-all duration-700" style={{ width: `${pct}%` }} />
      <div className="absolute inset-y-0 w-px bg-signal" style={{ left: '75%' }} title="เกณฑ์รับเทิร์น 75%" />
    </div>
  )
}

export function Field({ label, error, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const errId = useId()
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...p}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`h-12 w-full rounded-xl border bg-card px-4 text-[15px] outline-none transition placeholder:text-sub/45 focus:border-ink ${error ? 'border-bad' : 'border-line'}`}
      />
      {error && (
        <span id={errId} className="mt-1 block text-xs text-bad">
          {error}
        </span>
      )}
    </label>
  )
}

export function Timeline({ steps, now }: { steps: Step[]; now: number }) {
  const done = steps.filter((s) => s.at <= now).length
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const state = i < done - 1 || (i === done - 1 && done === steps.length) ? 'done' : i === done - 1 ? 'current' : 'todo'
        return (
          <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-12px)] w-px ${i < done - 1 ? 'bg-ink' : 'bg-line'}`} />}
            <span
              className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                state === 'todo' ? 'border-line bg-paper text-sub' : 'border-ink bg-ink text-paper'
              }`}
            >
              {state === 'current' && <span className="absolute inset-0 animate-ping rounded-full bg-ink/30" />}
              {state === 'todo' ? i + 1 : <Check size={13} strokeWidth={3} />}
            </span>
            <div>
              <p className={`font-semibold ${state === 'todo' ? 'text-sub' : ''}`}>{s.label}</p>
              <p className="text-sm text-sub">{s.detail}</p>
              {state !== 'todo' && <p className="mt-0.5 text-xs text-sub tabular">{new Date(s.at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Not a scannable QR: a deterministic pattern standing in for the tag printed under the tongue. */
export function FakeQR({ value, size = 96 }: { value: string; size?: number }) {
  const n = 21
  let h = 2166136261
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h ^= value.charCodeAt(i % value.length) + i
    h = Math.imul(h, 16777619)
    cells.push((h >>> 7) % 2 === 0)
  }
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox
        const dy = y - oy
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
      }
    }
    return -1
  }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width={size} height={size} className="rounded bg-white" aria-label={`QR ของ ${value}`} role="img">
      {cells.map((on, i) => {
        const x = i % n
        const y = Math.floor(i / n)
        const f = finder(x, y)
        return (f === 1 || (f === -1 && on)) && <rect key={i} x={x} y={y} width="1" height="1" fill="#111" />
      })}
    </svg>
  )
}

/** Adds .in to every .reveal inside the returned ref once it scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = root.querySelectorAll('.reveal:not(.in)')
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  })
  return ref
}

export const Container = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>
)

export function PageHead({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <Container className="pb-8 pt-10 sm:pt-16">
      <h1 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tightest sm:text-6xl" style={{ fontStretch: '80%' }}>
        {title}
      </h1>
      {sub && <p className="mt-4 max-w-2xl text-sub">{sub}</p>}
    </Container>
  )
}

export const Spinner = ({ className = '' }: { className?: string }) => (
  <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden />
)

/** Modal behaviour: focus moves in, Tab stays inside, Esc closes, focus returns to the opener. */
export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const focusables = () =>
      [...ref.current!.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')]
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current()
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (!ref.current!.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      opener?.focus()
    }
  }, [])
  return ref
}

/** Number that counts to its new value (ease-out, ~450ms). Jumps straight there under reduced motion. */
export function Num({ value, from, format = String }: { value: number; from?: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(from ?? value)
  const last = useRef(from ?? value)
  useEffect(() => {
    const start = last.current
    if (start === value || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      last.current = value
      return setShown(value)
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 450)
      const v = Math.round(start + (value - start) * (1 - (1 - k) ** 3))
      last.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className="tabular">{format(shown)}</span>
}
