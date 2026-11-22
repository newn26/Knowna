import { ArrowLeft, BadgeCheck, Droplets, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Shoe, type ShoeView } from '../components/Shoe'
import { Button, ConditionBar, Container, GradeBadge, PageHead, Price, SWATCH, useReveal } from '../components/ui'
import { getPreowned, listPreowned } from '../lib/api'
import { COLORS, colorInfo } from '../lib/catalog'
import { baht } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { CHECKLIST } from '../lib/tradein'
import type { ColorId, PreownedItem } from '../lib/types'

const date = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

function QCBadges({ compact = false }: { compact?: boolean }) {
  const items = [
    { icon: Droplets, t: 'Cleaning & Sanitizing' },
    { icon: BadgeCheck, t: 'Quality Checked' },
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

function Card({ p }: { p: PreownedItem }) {
  const sold = p.status === 'sold'
  return (
    <Link to={`/preowned/${p.id}`} className={`reveal group block ${sold ? 'pointer-events-none opacity-50' : ''}`}>
      <div className="relative grid aspect-[4/3.2] place-items-center overflow-hidden rounded-3xl bg-stone">
        <div className="absolute left-3 top-3">
          <GradeBadge grade={p.grade} pct={p.conditionPct} />
        </div>
        {sold && <span className="absolute right-3 top-3 rounded-full bg-bad px-2.5 py-1 text-xs font-semibold text-white">ขายแล้ว</span>}
        <Shoe color={p.color} wear={100 - p.conditionPct} seed={p.wearSeed} photo={p.photos[0]} className="w-[86%] transition duration-700 group-hover:-translate-y-1.5 group-hover:-rotate-2" />
        <span className="absolute bottom-3 right-3 font-display text-xs font-bold text-sub tabular">{p.id}</span>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {colorInfo(p.color).name} · EU {p.size}
          </p>
          <p className="text-xs text-sub">ขึ้นร้าน {date(p.listedAt)}</p>
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
        eyebrow="Pre-owned Store"
        title={
          <>
            Second step<span className="text-signal">.</span>
          </>
        }
        sub="รองเท้าที่ลูกค้าเทิร์นกลับมา ผ่าน Inspection, ล้างและอบโอโซนฆ่าเชื้อ เปลี่ยนแผ่นรองและเชือกใหม่ แล้ว Quality Check อีกรอบ ทุกคู่บอกสภาพเป็นเปอร์เซ็นต์ตรง ๆ"
      />
      <Container>
        <div className="grid gap-3 rounded-3xl bg-stone p-5 sm:grid-cols-4">
          {[
            [Sparkles, 'Inspection 5 จุด', 'หนัง พื้น แผ่นรอง ตะเข็บ เชือก'],
            [Droplets, 'Cleaning & Sanitizing', 'ล้าง ขัด อบโอโซน'],
            [ShieldCheck, 'Quality Check', 'ช่างตรวจซ้ำก่อนขึ้นร้าน'],
            [BadgeCheck, 'Grade A / B', 'A ≥ 90% · B 75–89%'],
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
          {COLORS.map((c) => (
            <button key={c.id} onClick={() => set('color', c.id)} className={`${chip(color === c.id)} inline-flex items-center gap-2`}>
              <span className="h-3 w-3 rounded-full ring-1 ring-black/20" style={{ background: SWATCH[c.id] }} />
              {c.name}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line" />
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
              ดูคู่ใหม่ {baht(890)} →
            </Link>
          </div>
        )}
        <div className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items === null
            ? Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/3.2] animate-pulse rounded-3xl bg-stone" />)
            : shown.map((p) => <Card key={p.id} p={p} />)}
        </div>
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

  if (p === undefined) return <Container className="py-24 text-center text-sub">กำลังโหลด…</Container>
  if (p === null)
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">ไม่พบสินค้า {id}</p>
        <Link to="/preowned" className="mt-3 inline-block underline">
          กลับไปร้าน Pre-owned
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
        <ArrowLeft size={16} /> Pre-owned Store
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-3xl bg-stone">
            <div key={view} className="w-[88%] animate-fade">
              <Shoe color={p.color} view={view} wear={100 - p.conditionPct} seed={p.wearSeed} photo={p.photos[VIEWS.indexOf(view)]} className="w-full" />
            </div>
            <span className="absolute bottom-4 left-4 rounded-full bg-card px-3 py-1 text-xs text-sub">
              {p.photos.length ? 'รูปถ่ายจริงของคู่นี้' : 'ภาพจำลองรอยใช้งานของคู่นี้ · รูปจริงจะแสดงเมื่อเชื่อมระบบหลังร้าน'}
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
        </div>

        <div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={p.grade} pct={p.conditionPct} />
            <span className="text-sm text-sub tabular">{p.id}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={{ fontStretch: '80%' }}>
            Pre-owned
            <span className="block text-sub/70">
              {colorInfo(p.color).name} · EU {p.size}
            </span>
          </h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <Price value={p.price} was={p.originalPrice} className="text-2xl" />
            <span className="rounded-full bg-signal/10 px-2.5 py-0.5 text-sm font-semibold text-signal">ประหยัด {baht(save)}</span>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm sm:grid-cols-4">
            {[
              ['Size', `EU ${p.size}`],
              ['Color', colorInfo(p.color).name],
              ['Condition', `${p.conditionPct}%`],
              ['Grade', p.grade],
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
            <p className="mt-1.5 text-xs text-sub">เส้นสีส้ม = เกณฑ์ขั้นต่ำ 75% ที่ร้านรับขาย</p>
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
                  Add to Cart
                </Button>
                <Button size="lg" onClick={() => add(true)}>
                  Buy Now
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
