import { ArrowLeft, ArrowLeftRight, BadgeCheck, Droplets, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Shoe, type ShoeView } from '../components/Shoe'
import { Button, ConditionBar, Container, GradeBadge, PageHead, Price, SWATCH, useReveal } from '../components/ui'
import { getPreowned, listPreowned } from '../lib/api'
import { COLORS, PRODUCT, colorInfo } from '../lib/catalog'
import { baht } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { CHECKLIST } from '../lib/tradein'
import type { ColorId, PreownedItem } from '../lib/types'
import { PHOTOS, USED } from '../lib/photos'

// Sample photo for a listing: grade-B brown pairs show the used shot, the rest the clean cut-out of their colour.
const look = (p: PreownedItem) => (p.color === 'brown' && p.grade === 'B' ? USED : PHOTOS[p.color].side)

const GRADE_TEXT = { A: 'เหมือนใหม่', B: 'มีรอยใช้งานเล็กน้อย' }

const date = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

function QCBadges({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: Droplets, t: 'ซักและฆ่าเชื้อแล้ว' },
    { icon: BadgeCheck, t: 'ตรวจซ้ำแล้ว' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ icon: Icon, t }) => (
        <span key={t} className={`inline-flex items-center gap-1 rounded-full border border-line bg-card font-medium ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}`}>
          <Icon size={compact ? 11 : 13} className="text-ok" /> {t}
        </span>
      ))}
    </div>
  )
}

function Card({ p, i }: { p: PreownedItem; i: number }) {
  const sold = p.status === 'sold'
  return (
    <Link to={`/preowned/${p.id}`} className={`reveal group block ${sold ? 'pointer-events-none grayscale' : ''}`} style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
      <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-3xl bg-stone">
        <div className="absolute left-3 top-3">
          <GradeBadge grade={p.grade} pct={p.conditionPct} />
        </div>
        {sold && <span className="absolute right-3 top-3 rounded-full bg-bad px-2.5 py-1 text-xs font-semibold text-paper">ขายแล้ว</span>}
        <img src={look(p).src} alt={look(p).alt} loading="lazy" className="w-[86%] drop-shadow-[0_14px_14px_rgba(0,0,0,.16)] transition duration-700 group-hover:-translate-y-1.5 group-hover:-rotate-2" />
        <span className="absolute bottom-3 right-3 font-display text-xs font-bold text-sub tabular">{p.id}</span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            สี{colorInfo(p.color).nameTh} · EU {p.size}
          </p>
          <p className="text-xs text-sub">
            {GRADE_TEXT[p.grade]} · ขึ้นร้าน {date(p.listedAt)}
          </p>
        </div>
        <Price value={p.price} was={p.originalPrice} className="text-sm" />
      </div>
      <div className="mt-2.5">
        <ConditionBar pct={p.conditionPct} />
      </div>
      <div className="mt-3">
        <QCBadges compact />
      </div>
    </Link>
  )
}

export default function Preowned() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<PreownedItem[] | null>(null)
  const color = params.get('color') as ColorId | null
  const size = params.get('size') ? Number(params.get('size')) : null
  const grade = params.get('grade')
  const ref = useReveal<HTMLDivElement>()
  useEffect(() => {
    listPreowned().then(setItems)
  }, [])
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v === null || next.get(k) === v) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }
  const shown = (items ?? []).filter((p) => (!color || p.color === color) && (!size || p.size === size) && (!grade || p.grade === grade)).sort((a, b) => (a.status === b.status ? 0 : a.status === 'sold' ? 1 : -1))
  const sizes = [...new Set((items ?? []).filter((p) => p.status === 'available').map((p) => p.size))].sort((a, b) => a - b)
  const chip = (on: boolean) => `h-9 rounded-full border px-3.5 text-sm font-medium transition ${on ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`

  return (
    <div ref={ref}>
      <PageHead
        title={
          <>
            Second step<span className="text-signal">.</span>
          </>
        }
        sub="รองเท้าที่ลูกค้าเทิร์นกลับมา ผ่านการตรวจ 5 จุด ล้างและอบโอโซนฆ่าเชื้อ เปลี่ยนแผ่นรองและเชือกใหม่ แล้วตรวจซ้ำอีกรอบ ทุกคู่บอกสภาพเป็นเปอร์เซ็นต์ตรง ๆ"
      />
      <Container>
        <div className="grid gap-3 rounded-3xl bg-stone p-5 sm:grid-cols-4">
          {[
            [Sparkles, 'ตรวจ 5 จุด', 'ผ้าใบ พื้น แผ่นรอง ตะเข็บ เชือก'],
            [Droplets, 'ซักและฆ่าเชื้อ', 'ซัก ตาก อบโอโซน'],
            [ShieldCheck, 'ตรวจซ้ำ', 'ช่างอีกคนตรวจก่อนขึ้นร้าน'],
            [BadgeCheck, 'เกรด A / B', 'A ≥ 90% · B 75–89%'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Sparkles
            return (
              <div key={t as string} className="flex gap-3">
                <I size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{t as string}</p>
                  <p className="text-xs text-sub">{d as string}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {COLORS.length > 1 && COLORS.map((c) => (
            <button key={c.id} onClick={() => set('color', c.id)} className={`${chip(color === c.id)} inline-flex items-center gap-2`}>
              <span className="h-3 w-3 rounded-full ring-1 ring-black/20" style={{ background: SWATCH[c.id] }} />
              {c.nameTh}
            </button>
          ))}
          {COLORS.length > 1 && <span className="mx-1 h-5 w-px bg-line" />}
          {['A', 'B'].map((g) => (
            <button key={g} onClick={() => set('grade', g)} className={chip(grade === g)}>
              เกรด {g}
            </button>
          ))}
          <select value={size ?? ''} onChange={(e) => set('size', e.target.value || null)} className="h-9 rounded-full border border-line bg-card px-3 text-sm" aria-label="ไซซ์">
            <option value="">ทุกไซซ์</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                EU {s}
              </option>
            ))}
          </select>
          {(color || size || grade) && (
            <button onClick={() => setParams({}, { replace: true })} className="text-sm text-sub underline underline-offset-4">
              ล้างตัวกรอง
            </button>
          )}
          <span className="ml-auto text-sm text-sub">{items ? `${shown.filter((p) => p.status === 'available').length} คู่พร้อมขาย` : 'กำลังโหลด…'}</span>
        </div>

        {items && shown.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
            <p className="font-semibold">ยังไม่มีคู่ที่ตรงตัวกรอง</p>
            <p className="mt-1 text-sm text-sub">ของเข้าใหม่ทุกวันจากการเทิร์น หรือเลือกคู่ใหม่ไปก่อน</p>
            <Link to={`/product?${color ? `color=${color}&` : ''}${size ? `size=${size}` : ''}`} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              ดูคู่ใหม่ {baht(PRODUCT.price)} →
            </Link>
          </div>
        )}
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items === null
            ? Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton aspect-[4/3.2] rounded-3xl" />)
            : shown.map((p, i) => <Card key={p.id} p={p} i={i} />)}
        </div>

        <section id="inspection" className="reveal mt-24 grid scroll-mt-24 gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="font-display text-4xl font-black uppercase leading-none sm:text-5xl" style={{ fontStretch: '80%' }}>
              ตรวจทุกคู่ ก่อนถึงมือคุณ
            </h2>
            <p className="mt-4 max-w-md text-sub">ทุกคู่ในร้านนี้มาจากลูกค้าที่ซื้อจาก KNOWNA เท่านั้น เราจึงรู้ว่ารองเท้าผ่านอะไรมา และตรวจได้ตามมาตรฐานเดียวกัน</p>
            <dl className="mt-8 space-y-3 text-sm">
              {[
                ['เกรด A · 90–100%', 'เหมือนใหม่ แทบไม่มีรอย ดอกยางเต็ม'],
                ['เกรด B · 75–89%', 'มีรอยใช้งานเล็กน้อย ทรงและพื้นยังดี'],
                ['ต่ำกว่า 75%', 'ร้านไม่รับเข้า จึงไม่มีขายในร้านนี้'],
              ].map(([g, d]) => (
                <div key={g} className="flex gap-4 rounded-2xl bg-stone p-4">
                  <dt className="w-32 shrink-0 font-semibold">{g}</dt>
                  <dd className="text-sub">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ol className="relative space-y-6 border-l border-line pl-8">
            {[
              ['ยืนยันที่มา', 'เช็ก Product ID ใต้ลิ้นกับประวัติการขาย รับเฉพาะคู่ที่ขายจากร้านเรา'],
              ['ตรวจ 5 จุด', 'ผ้าใบด้านบน พื้น แผ่นรอง ตะเข็บและทรง เชือกและรูร้อย คิดคะแนนถ่วงน้ำหนักเป็น %'],
              ['ซัก', 'ซักคราบทั้งคู่ เปลี่ยนเชือกใหม่ทุกคู่'],
              ['ฆ่าเชื้อ', 'อบโอโซนฆ่าเชื้อด้านใน และเปลี่ยนแผ่นรองใหม่'],
              ['ตรวจซ้ำ', 'ช่างอีกคนตรวจซ้ำ ให้เกรด ถ่ายรูปจริงของคู่นั้น แล้วจึงขึ้นร้าน'],
            ].map(([t, d], i) => (
              <li key={t} className="relative">
                <span className="absolute -left-[45px] grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-paper">{i + 1}</span>
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-sub">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </Container>
    </div>
  )
}

const VIEWS: ShoeView[] = ['side', 'pair', 'toe', 'heel']

export function PreownedDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState<PreownedItem | null | undefined>(undefined)
  const [view, setView] = useState<ShoeView>('side')
  const inCart = useStore((s) => s.cart.some((l) => l.preownedId === id))
  useEffect(() => {
    getPreowned(id).then(setP)
  }, [id])

  if (p === undefined)
    return (
      <Container className="grid gap-10 pt-16 lg:grid-cols-[1.15fr_1fr]" aria-busy>
        <div className="skeleton aspect-[5/4] rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-12 w-2/3 rounded-xl" />
          <div className="skeleton h-6 w-1/3 rounded-xl" />
          <div className="skeleton h-28 rounded-2xl" />
        </div>
      </Container>
    )
  if (p === null)
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">ไม่พบสินค้า {id}</p>
        <Link to="/preowned" className="mt-3 inline-block underline">
          กลับไปร้านมือสอง
        </Link>
      </Container>
    )

  const add = (go?: boolean) => {
    actions.addLine({ kind: 'preowned', color: p.color, size: p.size, qty: 1, unitPrice: p.price, preownedId: p.id })
    if (go) return navigate('/checkout')
    actions.toast(`เพิ่ม ${p.id} ลงตะกร้าแล้ว`)
    actions.openCart()
  }
  const save = p.originalPrice - p.price

  return (
    <Container className="pb-10 pt-6 sm:pt-10">
      <Link to="/preowned" className="inline-flex items-center gap-2 text-sm text-sub hover:text-ink">
        <ArrowLeft size={16} /> ร้านมือสอง
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-3xl bg-stone">
            <div key={view} className="w-[88%] animate-fade">
              {view === 'side' ? <img src={look(p).src} alt={look(p).alt} className="w-full drop-shadow-[0_20px_20px_rgba(0,0,0,.16)]" /> : <Shoe color={p.color} view={view} wear={100 - p.conditionPct} seed={p.wearSeed} className="w-full" />}
            </div>
            <span className="absolute bottom-4 left-4 rounded-full bg-card px-3 py-1 text-xs text-sub">
              {view === 'side' ? 'ภาพตัวอย่างสร้างด้วย AI' : 'ภาพจำลองรอยใช้งาน'} · รูปจริงของคู่นี้จะแสดงเมื่อเชื่อมระบบหลังร้าน
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                aria-label={`มุม ${v}`}
                className={`grid aspect-square place-items-center rounded-2xl bg-stone p-2 ring-2 transition ${view === v ? 'ring-ink' : 'ring-transparent hover:ring-line'}`}
              >
                <Shoe color={p.color} view={v} wear={100 - p.conditionPct} seed={p.wearSeed} className="w-full" shadow={false} />
              </button>
            ))}
          </div>
          <BeforeAfter p={p} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={p.grade} pct={p.conditionPct} />
            <span className="text-sm text-sub tabular">{p.id}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={{ fontStretch: '80%' }}>
            มือสอง
            <span className="block text-sub/70">
              สี{colorInfo(p.color).nameTh} · EU {p.size}
            </span>
          </h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <Price value={p.price} was={p.originalPrice} className="text-2xl" />
            <span className="rounded-full bg-signal/10 px-2.5 py-0.5 text-sm font-semibold text-signal">ประหยัด {baht(save)}</span>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm sm:grid-cols-4">
            {[
              ['ไซซ์', `EU ${p.size}`],
              ['สี', colorInfo(p.color).nameTh],
              ['สภาพ', `${p.conditionPct}%`],
              ['เกรด', p.grade],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-4">
                <dt className="text-xs uppercase tracking-wider text-sub">{k}</dt>
                <dd className="mt-1 font-display text-2xl font-black tabular" style={{ fontStretch: '85%' }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <ConditionBar pct={p.conditionPct} />
            <p className="mt-1.5 text-xs text-sub">
              เกรด {p.grade} = {GRADE_TEXT[p.grade]} · เส้นสีส้มคือเกณฑ์ขั้นต่ำ 75% ที่ร้านรับเข้า ·{' '}
              <Link to="/preowned#inspection" className="underline underline-offset-2">
                ตรวจยังไง
              </Link>
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {p.status === 'sold' ? (
              <p className="rounded-2xl bg-stone p-4 text-center font-semibold sm:col-span-2">คู่นี้ขายแล้ว</p>
            ) : inCart ? (
              <Button size="lg" className="sm:col-span-2" onClick={() => navigate('/checkout')}>
                อยู่ในตะกร้าแล้ว · ไปชำระเงิน
              </Button>
            ) : (
              <>
                <Button size="lg" variant="outline" onClick={() => add()}>
                  ใส่ตะกร้า
                </Button>
                <Button size="lg" onClick={() => add(true)}>
                  ซื้อเลย
                </Button>
              </>
            )}
          </div>

          <section className="mt-10 rounded-3xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">รายงาน QC</h2>
              <QCBadges compact />
            </div>
            <ul className="mt-4 divide-y divide-line text-sm">
              {CHECKLIST.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <span>{c.label}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-ok">
                    <BadgeCheck size={15} /> ผ่าน
                  </span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-sub">
              {p.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-xs text-sub">
              <div>
                <dt>ล้างและฆ่าเชื้อ</dt>
                <dd className="text-ink">{date(p.qc.cleanedAt)}</dd>
              </div>
              <div>
                <dt>ตรวจ QC โดย</dt>
                <dd className="text-ink">
                  {p.qc.inspector} · {date(p.qc.checkedAt)}
                </dd>
              </div>
            </dl>
          </section>
          <p className="mt-4 text-sm text-sub">คู่นี้ยังใช้ Product ID เดิม ถ้าเท้าโตอีก เอามาเทิร์นต่อได้ตามเงื่อนไขปกติ</p>
        </div>
      </div>
    </Container>
  )
}

/** Drag to compare the pair as it came in (more wear, dull) with how it looks after cleaning and QC. */
function BeforeAfter({ p }: { p: PreownedItem }) {
  const [x, setX] = useState(50)
  return (
    <div className="mt-6">
      <div className="relative aspect-[5/3] select-none overflow-hidden rounded-3xl bg-stone">
        <div className="absolute inset-0 grid place-items-center">
          <img src={look(p).src} alt="" className="w-[82%]" />
        </div>
        <div className="absolute inset-0 grid place-items-center bg-stone" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
          <img src={p.color === 'brown' ? USED.src : PHOTOS[p.color].side.src} alt="" className="w-[82%] [filter:saturate(.55)_brightness(.8)_sepia(.35)]" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${x}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-paper shadow-lg">
            <ArrowLeftRight size={16} />
          </span>
        </div>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-semibold">ตอนรับเข้า</span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">หลัง QC</span>
        <input
          type="range"
          min={0}
          max={100}
          value={x}
          onChange={(e) => setX(+e.target.value)}
          aria-label="เลื่อนเทียบสภาพตอนรับเข้ากับหลัง QC"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
        />
      </div>
      <p className="mt-2 text-xs text-sub">ลากเพื่อเทียบสภาพตอนร้านรับเข้า กับหลังล้าง ฆ่าเชื้อ และ QC (ภาพจำลอง)</p>
    </div>
  )
}
