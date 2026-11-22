import { ArrowRight, BadgeCheck, Check, Recycle, ScanLine, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { ConditionBar, Container, LinkButton, Num, SWATCH, useReveal } from '../components/ui'
import { COLORS, GRADES, PRODUCT, SIZES } from '../lib/catalog'
import { PHOTOS, USED, WORN } from '../lib/photos'
import { baht, preownedPrice } from '../lib/pricing'
import { CHECKLIST, gradeFor, rateFor } from '../lib/tradein'
import type { ColorId } from '../lib/types'

const display = { fontStretch: '78%' } as const

function Hero() {
  const [color, setColor] = useState<ColorId>('brown')
  return (
    <section className="relative overflow-hidden">
      <Container className="grid items-center gap-8 pb-12 pt-8 lg:grid-cols-[1fr_1.15fr] lg:pb-24 lg:pt-14">
        {/* phones: headline → shoe → copy (display:contents lets the shoe slot between); desktop keeps two columns */}
        <div className="contents lg:relative lg:z-10 lg:block">
          <div className="relative z-10 order-1">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              เอาคู่เก่ามาเทิร์น ลดคู่ใหม่ทันทีในบิลเดียว
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-black uppercase leading-[0.84] tracking-tightest [word-spacing:0.14em]" style={display}>
              <span className="block animate-rise [animation-delay:80ms]">Step up.</span>
              <span className="block animate-rise [animation-delay:180ms]">
                <span className="text-sub/70">Pass it</span> on<span className="text-signal">.</span>
              </span>
            </h1>
          </div>
          <div className="order-3">
            <p className="mt-2 max-w-md animate-rise text-lg text-sub [animation-delay:160ms] lg:mt-6">
              รองเท้าผ้าใบนักเรียนชาย ป.1–ป.6 พอเท้าลูกโต เอาคู่เดิมมาเทิร์นรับส่วนลด <b className="text-ink">สูงสุด 15%</b> แล้วคู่นั้นจะถูกซัก ตรวจ และส่งต่อให้รุ่นน้อง
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              <LinkButton to="/shop" size="lg">
                ซื้อคู่ใหม่ <ArrowRight size={18} />
              </LinkButton>
              <LinkButton to="/trade-in" size="lg" variant="outline">
                เทิร์นคู่เก่า
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-md animate-rise grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
              {(
                [
                  [PRODUCT.price, baht, 'คู่ใหม่'],
                  [15, (n: number) => `${n}%`, 'ส่วนลดเทิร์นสูงสุด'],
                  [preownedPrice(PRODUCT.price, 'B'), (n: number) => `${baht(n)}+`, 'มือสองเริ่มต้น'],
                ] as const
              ).map(([v, f, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-black" style={display}>
                    <Num from={0} value={v} format={f} />
                  </dt>
                  <dd className="text-xs text-sub">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="relative order-2 mx-auto w-full max-w-xl lg:order-none lg:max-w-none">
          <div className="absolute inset-x-[16%] top-1/2 -z-0 aspect-square -translate-y-1/2 rounded-full bg-stone lg:inset-x-14" />
          <div className="parallax relative">
            <div className="animate-rise [animation-delay:200ms]">
              <div key={color} className="animate-swap">
                <img src={PHOTOS[color].side.src} alt={PHOTOS[color].side.alt} className="relative w-full animate-step drop-shadow-[0_24px_24px_rgba(0,0,0,.18)]" />
              </div>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-center gap-3">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                aria-label={`ดูสี${c.nameTh}`}
                aria-pressed={color === c.id}
                className={`h-9 w-9 rounded-full ring-1 ring-inset ring-black/15 transition hover:scale-110 ${color === c.id ? 'outline outline-2 outline-offset-4 outline-ink' : ''}`}
                style={{ background: SWATCH[c.id] }}
              />
            ))}
            <span className="ml-2 w-24 text-sm font-medium">สี{COLORS.find((c) => c.id === color)!.nameTh}</span>
          </div>
        </div>
      </Container>
    </section>
  )
}

function Marquee() {
  const words = ['คู่ใหม่', 'มือสอง', 'เทิร์นคู่เก่า', 'ป.1 – ป.6', 'EU 28 – 40', 'ผ้าใบน้ำตาล', 'ตรวจทุกคู่']
  return (
    <div className="fixed-tone overflow-hidden border-y border-line bg-ink py-4 text-paper" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl font-black uppercase" style={display}>
        {[...words, ...words, ...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            {w}
            <span className="h-2 w-2 rounded-full bg-signal" />
          </span>
        ))}
      </div>
    </div>
  )
}

function Spotlight() {
  const [color, setColor] = useState<ColorId>('brown')
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <Link to={`/product?color=${color}`} className="reveal group block overflow-hidden rounded-3xl bg-stone">
          <img key={color} src={PHOTOS[color].pair.src} alt={PHOTOS[color].pair.alt} loading="lazy" className="aspect-[3/2] w-full animate-swap object-cover transition duration-700 group-hover:scale-[1.03]" />
        </Link>
        <div className="reveal">
          <h2 className="mt-0 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl" style={display}>
            คู่เดียว ใส่ได้ทั้งเทอม
          </h2>
          <ul className="mt-6 space-y-3">
            {PRODUCT.details.slice(0, 4).map((d) => (
              <li key={d} className="flex gap-3 text-sub">
                <Check size={18} className="mt-1 shrink-0 text-signal" />
                {d}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                aria-pressed={color === c.id}
                className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${color === c.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
              >
                <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20" style={{ background: SWATCH[c.id] }} />
                {c.nameTh}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-sub">{COLORS.find((c) => c.id === color)!.hint}</p>
          <p className="mt-6 flex items-baseline gap-3">
            <b className="font-display text-4xl font-black tabular" style={display}>
              {baht(PRODUCT.price)}
            </b>
            <span className="text-sm text-sub">
              EU {SIZES[0]}–{SIZES[SIZES.length - 1]}
            </span>
          </p>
          <LinkButton to={`/product?color=${color}`} size="lg" className="mt-6">
            เลือกไซซ์ <ArrowRight size={18} />
          </LinkButton>
        </div>
      </Container>
    </section>
  )
}

function TwoStores() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container className="grid gap-4 lg:grid-cols-2">
        <Link to="/shop" className="fixed-tone reveal group relative flex min-h-[420px] [--rim-a:0.55] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-paper sm:p-10">
          <div>
            <h3 className="mt-0 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl" style={display}>
              คู่ใหม่
              <br />
              กล่องใหม่
            </h3>
            <p className="mt-3 max-w-xs text-paper/70">ทุกคู่มี Product ID และ QR ใต้ลิ้น เก็บไว้ ใช้เทิร์นได้วันที่เท้าโต</p>
          </div>
          <img src={PHOTOS.black.side.src} alt="" className="absolute -bottom-4 -right-12 w-[82%] transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-2" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink">
            {baht(PRODUCT.price)} · ช้อปเลย <ArrowRight size={16} />
          </span>
        </Link>
        <Link to="/preowned" className="reveal group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl border border-line bg-card p-8 sm:p-10">
          <div>
            <h3 className="mt-0 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl" style={display}>
              มือสอง
              <br />
              ที่ไม่มือสอง
            </h3>
            <p className="mt-3 max-w-xs text-sub">ทุกคู่ผ่านการตรวจ 5 จุด ซัก ฆ่าเชื้อ และตรวจซ้ำ บอกสภาพเป็นเปอร์เซ็นต์ พร้อมจุดที่มีรอยใช้งาน</p>
          </div>
          <img src={USED.src} alt="" className="absolute -bottom-4 -right-12 w-[82%] transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-2" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
            เริ่ม {baht(preownedPrice(PRODUCT.price, 'B'))} · ดูทั้งหมด <ArrowRight size={16} />
          </span>
        </Link>
      </Container>
    </section>
  )
}

const FLOW = [
  { icon: Sparkles, t: 'เลือกคู่ใหม่', d: 'เลือกไซซ์ แล้วกด “เทิร์นคู่เก่า”' },
  { icon: ScanLine, t: 'ยืนยันว่าซื้อจากเรา', d: 'ประวัติการสั่งซื้อ, Product ID หรือสแกน QR ใต้ลิ้น' },
  { icon: ShieldCheck, t: 'ประเมินสภาพ', d: 'ตอบเช็กลิสต์ 5 จุด + แนบรูป ระบบคำนวณ % ทันที' },
  { icon: BadgeCheck, t: 'หักส่วนลดในบิลนี้', d: 'ไม่ต้องรอ ไม่มีคูปอง ไรเดอร์รับคู่เก่าตอนส่งคู่ใหม่' },
]

const CHAPTERS = [
  { id: 'old', label: 'คู่เดิม', h: 'เท้าโต คู่เดิมคับแล้ว', d: 'ใส่มาทั้งปี ยังดีอยู่ แค่ไม่พอสำหรับเทอมหน้า อย่าเพิ่งทิ้ง' },
  { id: 'check', label: 'ตรวจ', h: 'ตรวจ 5 จุด รู้ผลทันที', d: 'สภาพ 75% ขึ้นไปรับเทิร์น ต่ำกว่านั้นส่งคืนเจ้าของ' },
  { id: 'discount', label: 'ส่วนลด', h: 'ลดคู่ใหม่ทันที', d: '90–100% ลด 15% · 75–89% ลด 10% หักในบิลเดียวกัน ไม่มีคูปอง' },
  { id: 'next', label: 'ส่งต่อ', h: 'ส่งต่อให้รุ่นน้อง', d: 'คู่เก่าถูกซัก อบโอโซน ตรวจซ้ำ แล้วขึ้นร้านมือสองในราคาเกือบครึ่ง' },
] as const

// The shoe's pose along the scroll (t = 0…1): x/y in vw/vh, scale, tilt (rz) and spin (ry) in degrees.
const POSES = [
  { t: 0, x: 8, y: -6, s: 0.86, rz: -8, ry: 0 },
  { t: 0.14, x: 8, y: -7, s: 0.9, rz: -6, ry: 0 },
  { t: 0.4, x: 6, y: -10, s: 1.05, rz: 0, ry: 360 },
  { t: 0.64, x: 24, y: -12, s: 0.6, rz: -16, ry: 360 },
  { t: 0.86, x: 8, y: -8, s: 0.86, rz: 4, ry: 720 },
  { t: 1, x: 60, y: -6, s: 0.7, rz: 16, ry: 720 },
]
const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2)
function poseAt(p: number, sideways: number) {
  const i = Math.max(0, POSES.findIndex((k) => k.t >= p) - 1)
  const a = POSES[i]
  const b = POSES[Math.min(i + 1, POSES.length - 1)]
  const u = b.t === a.t ? 1 : ease((p - a.t) / (b.t - a.t))
  const m = (k: 'x' | 'y' | 's' | 'rz' | 'ry') => a[k] + (b[k] - a[k]) * u
  return `translate3d(${m('x') * sideways}vw, ${m('y')}vh, 0) rotateZ(${m('rz')}deg) rotateY(${m('ry')}deg) scale(${m('s')})`
}

/** Full-screen, scroll-scrubbed: the pair spins and travels while four short chapters swap beside it. */
function TradeInStory() {
  const ref = useRef<HTMLElement>(null)
  const shoe = useRef<HTMLDivElement>(null)
  const [chapter, setChapter] = useState(0)
  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = ref.current!.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
        if (shoe.current) shoe.current.style.transform = still ? 'none' : poseAt(p, innerWidth < 640 ? 0.25 : 1) // phones: the shoe already fills the width, so travel less
        setChapter(Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length)))
      })
    }
    update()
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', update)
      removeEventListener('resize', update)
    }
  }, [])
  const at = CHAPTERS[chapter].id
  const fade = (on: boolean) =>
    `transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${on ? 'opacity-100 translate-y-0 blur-0' : 'pointer-events-none opacity-0 translate-y-4 blur-sm'}`
  return (
    <section ref={ref} aria-label="คู่เก่าไปไหนต่อ" className="relative bg-stone" style={{ height: `${CHAPTERS.length * 90}vh` }}>
      <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden [perspective:1600px]">
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <div ref={shoe} className="relative w-[120vw] max-w-[1400px] will-change-transform sm:w-[84vw]">
            <img src={USED.src} alt="" className="w-full drop-shadow-[0_30px_30px_rgba(0,0,0,.2)]" />
            <img src={PHOTOS.brown.side.src} alt="" className={`absolute inset-0 w-full transition-opacity duration-1000 ${at === 'next' ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>

        <Container className="relative flex h-full flex-col justify-between py-6 sm:py-10">
          <ol className="flex gap-2" aria-hidden>
            {CHAPTERS.map((c, i) => (
              <li key={c.id} className="flex-1 sm:max-w-40">
                <span className="block h-1 overflow-hidden rounded-full bg-ink/10">
                  <span className={`block h-full origin-left bg-ink transition-transform duration-500 ${i <= chapter ? 'scale-x-100' : 'scale-x-0'}`} />
                </span>
                <span className={`mt-2 block text-xs font-semibold transition-colors ${i === chapter ? 'text-ink' : 'text-sub'}`}>{c.label}</span>
              </li>
            ))}
          </ol>

          <div className="grid">
            {CHAPTERS.map((c, i) => (
              <div key={c.id} className={`max-w-xl [grid-area:1/1] ${fade(i === chapter)}`} aria-hidden={i !== chapter}>
                <h2 className="font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-7xl" style={display}>
                  {c.h}
                </h2>
                <p className="mt-3 max-w-md text-sub sm:text-lg">{c.d}</p>
              </div>
            ))}
            <div className="mt-5 flex min-h-12 flex-wrap items-center gap-2 [grid-area:2/1]">
              {at === 'check' &&
                CHECKLIST.map((c, i) => (
                  <span key={c.id} className="flex animate-rise items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm" style={{ animationDelay: `${i * 70}ms` }}>
                    <Check size={14} className="text-ok" /> {c.label}
                  </span>
                ))}
              {at === 'discount' && (
                <p className="animate-rise font-display text-3xl font-black tabular sm:text-4xl" style={display}>
                  <span className="text-sub line-through decoration-2">{baht(PRODUCT.price)}</span> <span className="text-signal">{baht(PRODUCT.price - Math.round(PRODUCT.price * 0.15))}</span>
                </p>
              )}
              {at === 'next' && (
                <Link to="/preowned" className="inline-flex animate-rise items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
                  มือสองเริ่ม {baht(preownedPrice(PRODUCT.price, 'B'))} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

function TradeInSection() {
  const [pct, setPct] = useState(92)
  const rate = rateFor(pct)
  const grade = gradeFor(pct)
  return (
    <section id="trade-in" className="bg-stone py-20 sm:py-28">
      <Container>
        <div className="reveal max-w-3xl">
          <h2 className="mt-0 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl" style={display}>
            เท้าโต ไม่ต้องทิ้ง<span className="text-signal">.</span>
          </h2>
          <p className="mt-4 text-lg text-sub">รองเท้าที่ซื้อจาก KNOWNA สภาพ 75% ขึ้นไป เปลี่ยนเป็นส่วนลดคู่ใหม่ได้ทันที ในรายการสั่งซื้อเดียวกัน</p>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="reveal group bg-card p-6 transition hover:bg-paper" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="flex items-center justify-between">
                <span className="font-display text-5xl font-black text-line transition group-hover:text-signal" style={display}>
                  0{i + 1}
                </span>
                <Icon size={22} className="text-sub" />
              </div>
              <p className="mt-6 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-sub">{d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="reveal rounded-3xl bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-semibold">ลองคำนวณส่วนลด</p>
              <span className="text-sm text-sub">ลากเพื่อเปลี่ยนสภาพรองเท้า</span>
            </div>
            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-sub">สภาพคู่เก่า</p>
                <p className="font-display text-7xl font-black tabular leading-none" style={display}>
                  {pct}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-sub">{rate ? `เกรด ${grade} · ลด ${rate * 100}%` : 'ต่ำกว่าเกณฑ์'}</p>
                <p className={`font-display text-4xl font-black tabular transition-colors ${rate ? 'text-signal' : 'text-sub'}`} style={display}>
                  {rate ? (
                    <>
                      −<Num value={Math.round(PRODUCT.price * rate)} format={baht} />
                    </>
                  ) : (
                    'ไม่รับเทิร์น'
                  )}
                </p>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={pct}
              onChange={(e) => setPct(+e.target.value)}
              className="mt-8 h-8 w-full accent-[rgb(var(--ink))]"
              aria-label="สภาพรองเท้า (%)"
            />
            <div className="mt-2">
              <ConditionBar pct={pct} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-sub tabular">
              <span>50%</span>
              <span className="text-signal">75% เกณฑ์ขั้นต่ำ</span>
              <span>100%</span>
            </div>
            <p className="mt-6 text-sm">
              คู่ใหม่ {baht(PRODUCT.price)} → จ่ายจริง <b>
                <Num value={PRODUCT.price - Math.round(PRODUCT.price * rate)} format={baht} />
              </b>
            </p>
          </div>
          <div className="reveal grid gap-3 text-sm">
            {[
              ['90–100%', 'ส่วนลด 15%', 'เกรด A'],
              ['75–89%', 'ส่วนลด 10%', 'เกรด B'],
              ['ต่ำกว่า 75%', 'ไม่รับเทิร์น', 'ส่งคืนเจ้าของ'],
            ].map(([r, d, g], i) => (
              <div key={r} className={`flex items-center justify-between gap-4 rounded-2xl p-5 ${i === 2 ? 'border border-dashed border-line text-sub' : 'bg-card'}`}>
                {i === 2 && <img src={WORN.src} alt={WORN.alt} className="w-28 shrink-0" />}
                <div className="mr-auto">
                  <p className="font-display text-2xl font-black tabular" style={display}>
                    {r}
                  </p>
                  <p className="text-xs text-sub">{g}</p>
                </div>
                <p className={`font-semibold ${i < 2 ? 'text-signal' : ''}`}>{d}</p>
              </div>
            ))}
            <p className="px-1 text-xs text-sub">ไม่แลกเป็นเงินสด · ไม่มีคูปองหรือวันหมดอายุ · ใช้ได้กับการซื้อคู่ใหม่ในบิลเดียวกันเท่านั้น</p>
            <LinkButton to="/trade-in" variant="signal" className="mt-1">
              เริ่มเทิร์นคู่เก่า <ArrowRight size={16} />
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  )
}

function SizeTeaser() {
  const [g, setG] = useState(GRADES[2])
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="reveal">
          <h2 className="mt-0 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl" style={display}>
            ลูกเรียนชั้นไหน?
          </h2>
          <p className="mt-4 max-w-md text-sub">เลือกระดับชั้นเพื่อดูไซซ์ที่นักเรียนส่วนใหญ่ใส่ หรือวัดความยาวเท้าเพื่อได้เบอร์ที่แม่นที่สุด</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {GRADES.map((x) => (
              <button
                key={x.id}
                onClick={() => setG(x)}
                className={`h-11 min-w-[3.5rem] rounded-full border px-4 text-sm font-semibold transition ${g.id === x.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="reveal rounded-3xl border border-line bg-card p-8">
          <p className="text-sm text-sub">
            นักเรียน {g.label} ({g.age}) ส่วนใหญ่ใส่
          </p>
          <p key={g.id} className="mt-2 animate-rise font-display text-7xl font-black tabular sm:text-8xl" style={display}>
            EU {g.range[0]}–{g.range[1]}
          </p>
          <div className="mt-6 flex gap-1">
            {SIZES.map((s) => (
              <span key={s} className={`h-10 flex-1 rounded transition-colors duration-500 ${s >= g.range[0] && s <= g.range[1] ? 'bg-ink' : 'bg-line'}`} title={`EU ${s}`} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-sub tabular">
            <span>{SIZES[0]}</span>
            <span>{SIZES[SIZES.length - 1]}</span>
          </div>
          <LinkButton to={`/size?grade=${g.id}`} variant="outline" className="mt-8 w-full">
            วัดเท้าให้แม่น 2 ขั้นตอน
          </LinkButton>
        </div>
      </Container>
    </section>
  )
}

const LOOP = ['รับคู่เก่า', 'ตรวจ 5 จุด', 'ซักและฆ่าเชื้อ', 'ตรวจซ้ำ', 'ขึ้นร้านมือสอง']

function SecondLife() {
  return (
    <section id="second-life" className="fixed-tone overflow-hidden bg-ink py-20 text-paper sm:py-28">
      <Container>
        <div className="reveal grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mt-0 font-display text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-7xl" style={display}>
              หนึ่งคู่
              <br />
              <span className="text-paper/40">สองเจ้าของ</span>
            </h2>
          </div>
          <p className="self-end text-lg text-paper/70">
            เด็กโตเร็ว รองเท้าหลายคู่ถูกเก็บเข้าตู้ทั้งที่ยังดีอยู่ เราเลยรับกลับมาล้าง ฆ่าเชื้อ ตรวจซ้ำ แล้วขายต่อในราคาที่ผู้ปกครองเบาใจ ทุกคู่ที่ได้ใช้ต่อ คือขยะที่ไม่ต้องเกิด
          </p>
        </div>
        <ol className="mt-14 grid gap-3 sm:grid-cols-5">
          {LOOP.map((s, i) => (
            <li key={s} className="reveal relative rounded-2xl border border-paper/15 p-5" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="font-display text-sm font-bold text-signal tabular">0{i + 1}</span>
              <p className="mt-6 font-semibold leading-tight">{s}</p>
              {i < LOOP.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-ink text-paper/40 sm:block" />}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="pt-20 sm:pt-28">
      <Container>
        <div className="reveal relative overflow-hidden rounded-[2rem] bg-stone px-6 py-16 text-center sm:px-16 sm:py-24">
          <Recycle className="mx-auto text-signal" size={28} />
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl" style={display}>
            เปิดเทอมนี้ เริ่มคู่ใหม่ ส่งต่อคู่เก่า
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <LinkButton to="/shop" size="lg">
              ซื้อคู่ใหม่
            </LinkButton>
            <LinkButton to="/trade-in" size="lg" variant="signal">
              เทิร์นคู่เก่า
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default function Home() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <Hero />
      <Marquee />
      <Spotlight />
      <TwoStores />
      <TradeInStory />
      <TradeInSection />
      <SizeTeaser />
      <SecondLife />
      <FinalCTA />
    </div>
  )
}
