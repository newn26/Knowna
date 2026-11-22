import { ArrowRight, BadgeCheck, Check, Recycle, ScanLine, ShieldCheck, Sparkles } from 'lucide-react'
import { PHOTOS } from '../lib/photos'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe, ShoeFlat } from '../components/Shoe'
import { ConditionBar, Container, FakeQR, GradeBadge, LinkButton, Num, SWATCH, useReveal } from '../components/ui'
import { COLORS, GRADES, PRODUCT } from '../lib/catalog'
import { baht, preownedPrice } from '../lib/pricing'
import { CHECKLIST, gradeFor, rateFor } from '../lib/tradein'
import type { ColorId } from '../lib/types'

const display = { fontStretch: '78%' } as const

function Hero() {
  const [color, setColor] = useState<ColorId>('black')
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
          <p className="mt-2 max-w-md lg:mt-6 animate-rise text-lg text-sub [animation-delay:160ms]">
            รองเท้านักเรียนชายรุ่นเดียว ทำให้ดีที่สุด ใส่ได้ตั้งแต่ ป.1 ถึง ม.6 พอเท้าโต เอาคู่เดิมมาเทิร์นรับส่วนลด <b className="text-ink">สูงสุด 15%</b> แล้วคู่นั้นจะถูกล้าง ตรวจ และส่งต่อให้รุ่นน้อง
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
            <LinkButton to="/shop" size="lg">
              Shop Now <ArrowRight size={18} />
            </LinkButton>
            <LinkButton to="/trade-in" size="lg" variant="outline">
              Trade-in คู่เก่า
            </LinkButton>
          </div>
          <dl className="mt-10 grid max-w-md animate-rise grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
            {(
              [
                [PRODUCT.price, baht, 'คู่ใหม่'],
                [15, (n: number) => `${n}%`, 'ส่วนลดเทิร์นสูงสุด'],
                [preownedPrice(PRODUCT.price, 'B'), (n: number) => `${baht(n)}+`, 'Pre-owned'],
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
                <Shoe color={color} view="pair" className="relative w-full animate-step drop-shadow-xl" />
              </div>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-center gap-3">
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                aria-label={`ดูสี ${c.name}`}
                aria-pressed={color === c.id}
                className={`h-9 w-9 rounded-full ring-1 ring-inset ring-black/15 transition hover:scale-110 ${color === c.id ? 'outline outline-2 outline-offset-4 outline-ink' : ''}`}
                style={{ background: SWATCH[c.id] }}
              />
            ))}
            <span className="ml-2 w-28 text-sm font-medium">
              {COLORS.find((c) => c.id === color)!.name} — {COLORS.find((c) => c.id === color)!.nameTh}
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}

function Marquee() {
  const words = ['New', 'Pre-owned', 'Trade-in', 'ป.1 – ม.6', 'EU 30 – 45', 'Black · White · Brown', 'Quality Checked']
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

function Colors() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="mt-0 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl" style={display}>
              สามสี ครบทุกระเบียบ
            </h2>
          </div>
          <Link to="/shop" className="group inline-flex items-center gap-2 text-sm font-semibold">
            ดูทุกไซซ์ <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {COLORS.map((c, i) => (
            <Link
              key={c.id}
              to={`/product?color=${c.id}`}
              className="reveal group relative overflow-hidden rounded-3xl bg-stone p-6 transition duration-500 hover:-translate-y-1"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-3xl font-black uppercase" style={display}>
                    {c.name}
                  </p>
                  <p className="text-sm text-sub">{c.hint}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-card transition group-hover:bg-ink group-hover:text-paper">
                  <ArrowRight size={16} />
                </span>
              </div>
              <div className="mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-card">
                <img src={PHOTOS[c.id].src} alt={PHOTOS[c.id].alt} loading="lazy" className="h-full w-full bg-white object-contain transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-2 text-sm">
                <b className="tabular">{baht(PRODUCT.price)}</b> <span className="text-sub">· EU 30–45</span>
              </p>
            </Link>
          ))}
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
          <Shoe color="black" className="absolute -bottom-6 -right-10 w-[78%] transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-2" />
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
            <p className="mt-3 max-w-xs text-sub">ทุกคู่ผ่าน Inspection, Cleaning & Sanitizing และ Quality Check บอกสภาพเป็นเปอร์เซ็นต์ เห็นรูปจริงก่อนซื้อ</p>
          </div>
          <Shoe color="brown" wear={14} seed={4} className="absolute -bottom-6 -right-10 w-[78%] transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-2" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
            เริ่ม {baht(preownedPrice(PRODUCT.price, 'B'))} · ดูทั้งหมด <ArrowRight size={16} />
          </span>
        </Link>
      </Container>
    </section>
  )
}

const FLOW = [
  { icon: Sparkles, t: 'เลือกคู่ใหม่', d: 'สี ไซซ์ แล้วกด “Trade-in Old Pair”' },
  { icon: ScanLine, t: 'ยืนยันว่าซื้อจากเรา', d: 'Order History, Product ID หรือสแกน QR ใต้ลิ้น' },
  { icon: ShieldCheck, t: 'ประเมินสภาพ', d: 'ตอบเช็กลิสต์ 5 จุด + แนบรูป ระบบคำนวณ % ทันที' },
  { icon: BadgeCheck, t: 'หักส่วนลดในบิลนี้', d: 'ไม่ต้องรอ ไม่มีคูปอง ไรเดอร์รับคู่เก่าตอนส่งคู่ใหม่' },
]

const STORY = [
  { id: 'old', t: 'Old Pair', h: 'คู่เดิม เท้าโตแล้ว', d: 'ใส่มาทั้งปี ยังดีอยู่ แต่คับเกินไปสำหรับเทอมหน้า' },
  { id: 'verify', t: 'Verify', h: 'ยืนยันว่าซื้อจากเรา', d: 'สแกน QR ใต้ลิ้น ระบบเจอในประวัติการขายทันที' },
  { id: 'upper', t: 'Check 1/5', h: 'หนังด้านบน', d: 'ส่องจากด้านบน หารอยถลอก รอยย่น และสีลอก' },
  { id: 'sole', t: 'Check 2/5', h: 'พื้นรองเท้า', d: 'พลิกดูดอกยาง จุดสึกใต้ฝ่าเท้าและส้น พื้นหลุดหรืออ้า' },
  { id: 'insole', t: 'Check 3/5', h: 'แผ่นรองด้านใน', d: 'ส่องเข้าด้านใน แผ่นรองยุบ ขาด หรือมีกลิ่นติดแน่นไหม' },
  { id: 'stitch', t: 'Check 4/5', h: 'ตะเข็บและทรง', d: 'ไล่ตะเข็บรอบตัว ดูทรงเบี้ยวและส้นยุบ' },
  { id: 'laces', t: 'Check 5/5', h: 'เชือกและรูร้อย', d: 'รูร้อยครบ ไม่หลุด เชือกไม่ขาด' },
  { id: 'approved', t: '75%+ Approved', h: 'ผ่านเกณฑ์ 75%', d: 'คู่นี้ได้ 94% เกรด A ต่ำกว่า 75% ร้านไม่รับเทิร์น' },
  { id: 'discount', t: '10–15% Trade-in', h: 'ลดทันที 15%', d: '90–100% ลด 15% · 75–89% ลด 10% หักจากคู่ใหม่ในบิลเดียวกัน ไม่มีคูปอง' },
  { id: 'new', t: 'New Pair', h: 'คู่ใหม่ ไซซ์ใหม่', d: 'ไรเดอร์ส่งคู่ใหม่ แล้วรับคู่เก่ากลับไปในรอบเดียว' },
  { id: 'back', t: 'Trade-in', h: 'คู่เก่ากลับถึงร้าน', d: 'ปิดถุงพร้อมแท็ก Product ID เข้าคิวรอตรวจ' },
  { id: 'clean', t: 'Clean', h: 'ล้างและขัดใหม่', d: 'ล้างคราบ ขัดเงาหนัง เปลี่ยนเชือกใหม่' },
  { id: 'sanitize', t: 'Sanitize', h: 'อบโอโซนฆ่าเชื้อ', d: 'ฆ่าเชื้อด้านในทั้งคู่ เปลี่ยนแผ่นรองใหม่' },
  { id: 'qc', t: 'Quality Check', h: 'ตรวจรอบสุดท้าย', d: 'ช่างตรวจซ้ำ 5 จุด ให้เกรด และถ่ายรูปจริงก่อนขึ้นร้าน' },
  { id: 'preowned', t: 'Pre-owned', h: 'ขึ้นร้านมือสอง', d: 'บอกสภาพเป็นเปอร์เซ็นต์ ราคาเบาใจกว่าคู่ใหม่เกือบครึ่ง' },
  { id: 'next', t: 'Next Student', h: 'ก้าวต่อกับรุ่นน้อง', d: 'หนึ่งคู่ สองเจ้าของ และยังเทิร์นต่อได้อีกครั้ง' },
] as const
type StepId = (typeof STORY)[number]['id']
const CHAPTER_SPLIT = STORY.findIndex((s) => s.id === 'back') // before: the customer's trade-in; after: the old pair's journey

// Five-point check as a camera move around the pair: top → flip to sole → into the opening → back to the side → laces.
const CHECKS: Partial<Record<StepId, { view: 'top' | 'sole' | 'side'; zoom: number; origin: string; part: string }>> = {
  upper: { view: 'top', zoom: 1, origin: '50% 50%', part: 'upper' },
  sole: { view: 'sole', zoom: 1, origin: '50% 50%', part: 'sole' },
  insole: { view: 'top', zoom: 2, origin: '24% 50%', part: 'insole' },
  stitch: { view: 'side', zoom: 1.7, origin: '12% 62%', part: 'stitch' },
  laces: { view: 'top', zoom: 2.2, origin: '64% 50%', part: 'laces' },
}

/** Sticky, scroll-driven walk through one pair's trade-in. Scroll position picks the step; CSS transitions do the motion. */
function TradeInStory() {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = ref.current!.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
        setStep(Math.min(STORY.length - 1, Math.floor(p * STORY.length)))
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
  const at = STORY[step].id
  const check = CHECKS[at]
  const checkIdx = CHECKLIST.findIndex((c) => c.id === check?.part)
  const move = 'transition-[transform,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none'
  const show = (on: boolean, off = 'translate-y-3') => (on ? 'opacity-100 translate-y-0' : `pointer-events-none opacity-0 ${off}`)
  // where the old pair sits: aside for verify, hidden while the camera inspects, leaves for the new pair, back for its own journey
  const oldPair: Partial<Record<StepId, string>> = {
    verify: '-translate-x-[14%] scale-90',
    approved: '-translate-x-[14%] scale-90',
    discount: '-translate-x-[14%] scale-[.85] opacity-30',
    new: '-translate-x-[130%] scale-90 opacity-0',
    qc: '-translate-x-[8%] scale-95',
    preowned: 'scale-95',
    next: 'translate-x-[10%] scale-90',
  }
  const oldClass = check ? 'scale-75 opacity-0' : (oldPair[at] ?? '')
  const wear = at === 'clean' ? 12 : at === 'sanitize' ? 6 : ['qc', 'preowned', 'next'].includes(at) ? 3 : 22
  const discount = Math.round(PRODUCT.price * 0.15)
  const yours = step < CHAPTER_SPLIT
  return (
    <section ref={ref} aria-label="เส้นทางของรองเท้าหนึ่งคู่" className="relative" style={{ height: `${STORY.length * 50}vh` }}>
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center overflow-hidden">
        <Container className="grid items-center gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div>
            <p className="font-display text-sm font-bold text-signal tabular">
              {String(step + 1).padStart(2, '0')} / {STORY.length} · {STORY[step].t}
            </p>
            <div className="mt-3 grid">
              {STORY.map((s, i) => (
                <div key={s.id} className={`[grid-area:1/1] ${move} ${show(step === i)}`} aria-hidden={step !== i}>
                  <h2 className="font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl" style={display}>
                    {s.h}
                  </h2>
                  <p className="mt-3 max-w-sm text-sub sm:text-lg">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `${CHAPTER_SPLIT}fr ${STORY.length - CHAPTER_SPLIT}fr` }} aria-hidden>
              {(
                [
                  ['การเทิร์นของคุณ', 0, CHAPTER_SPLIT, true],
                  ['เส้นทางของคู่เก่า', CHAPTER_SPLIT, STORY.length, false],
                ] as const
              ).map(([label, from, to, mine]) => (
                <div key={label}>
                  <p className={`mb-2 text-xs font-semibold transition-colors ${mine === yours ? 'text-ink' : 'text-sub'}`}>{label}</p>
                  <div className="flex gap-1">
                    {STORY.slice(from, to).map((s, k) => (
                      <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                        <span className={`block h-full origin-left bg-ink transition-transform duration-500 ${from + k <= step ? 'scale-x-100' : 'scale-x-0'}`} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] max-h-[50dvh] w-full overflow-hidden rounded-3xl bg-stone [perspective:1200px] lg:max-h-none" aria-hidden>
            <div className="absolute inset-0 grid place-items-center">
              <div className={`w-[78%] ${move} ${oldClass}`}>
                <Shoe color="black" wear={wear} seed={11} className="w-full" />
              </div>
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <div className={`w-[78%] ${move} ${at === 'new' ? '' : 'translate-x-[130%] opacity-0'}`}>
                <Shoe color="black" className="w-full" />
              </div>
            </div>

            {/* inspection camera: a view change turns/flips the pair, a zoom change glides to the part */}
            {check && (
              <div className="absolute inset-0 grid place-items-center [transform-style:preserve-3d]">
                <div key={check.view} className={`w-[78%] ${check.view === 'sole' ? 'animate-flip' : 'animate-turn'}`}>
                  <div className={`${move}`} style={{ transform: `scale(${check.zoom})`, transformOrigin: check.origin }}>
                    {check.view === 'side' ? <Shoe color="black" wear={22} seed={11} className="w-full" /> : <ShoeFlat color="black" side={check.view} wear={22} className="w-full" />}
                  </div>
                </div>
              </div>
            )}

            {(at === 'verify' || check || at === 'clean' || at === 'sanitize') && (
              <span className={`absolute inset-0 animate-scan bg-gradient-to-b from-transparent ${at === 'clean' ? 'via-white/40' : at === 'sanitize' ? 'via-ok/20' : 'via-signal/20'} to-transparent`} />
            )}
            <Tag on={at === 'old'} at="left-4 top-4">
              EU 36 · ใส่มา 1 ปี
            </Tag>
            <Tag on={!!check} at="left-4 top-4" dark>
              ตรวจ {checkIdx + 1}/5 · {CHECKLIST[Math.max(0, checkIdx)].label}
            </Tag>
            <div className={`absolute right-4 top-4 flex items-center gap-3 rounded-2xl bg-card p-3 shadow-lg ${move} ${show(at === 'verify', '-translate-y-3')}`}>
              <FakeQR value="KW-BK36-240117" size={44} />
              <div className="text-xs">
                <p className="font-semibold tabular">KW-BK36-240117</p>
                <p className="flex items-center gap-1 text-ok">
                  <Check size={13} /> ซื้อจาก KAOWNA
                </p>
              </div>
            </div>
            <ul className="absolute inset-x-4 bottom-4 flex flex-wrap gap-1.5">
              {CHECKLIST.map((c, i) => {
                const current = i === checkIdx
                const done = at === 'qc' || (check && i < checkIdx)
                return (
                  <li
                    key={c.id}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${move} ${current ? 'bg-ink text-paper' : 'bg-card'} ${show(!!check || at === 'qc', 'translate-y-2')}`}
                    style={{ transitionDelay: at === 'qc' ? `${i * 90}ms` : '0ms' }}
                  >
                    {done ? <Check size={12} className="text-ok" /> : <span className={`h-1.5 w-1.5 rounded-full ${current ? 'bg-signal' : 'bg-line'}`} />} {c.label}
                  </li>
                )
              })}
            </ul>
            <div className={`absolute inset-x-6 bottom-6 rounded-2xl bg-card p-4 shadow-lg ${move} ${show(at === 'approved', 'translate-y-4')}`}>
              <div className="flex items-end justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ok">
                  <Check size={16} /> ผ่านเกณฑ์
                </span>
                <span className="font-display text-4xl font-black" style={display}>
                  <Num value={step >= STORY.findIndex((s) => s.id === 'approved') ? 94 : 0} format={(n) => `${n}%`} />
                </span>
              </div>
              <div className="mt-3">
                <ConditionBar pct={at === 'approved' ? 94 : 0} />
              </div>
            </div>
            <div className={`absolute inset-0 grid place-items-center ${move} ${at === 'discount' ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'}`}>
              <div className="text-center">
                <p className="font-display text-7xl font-black text-signal sm:text-8xl" style={display}>
                  −15%
                </p>
                <p className="mt-1 font-semibold">
                  {baht(PRODUCT.price)} → <Num value={at === 'discount' ? PRODUCT.price - discount : PRODUCT.price} format={baht} />
                </p>
              </div>
            </div>
            <Tag on={at === 'new'} at="left-4 top-4" dark>
              New · EU 37
            </Tag>
            <Tag on={at === 'back'} at="left-4 top-4">
              รับคู่เก่ากลับแล้ว
            </Tag>
            <Tag on={at === 'clean'} at="left-4 top-4">
              Clean · ล้าง ขัด เปลี่ยนเชือก
            </Tag>
            <Tag on={at === 'sanitize'} at="left-4 top-4">
              Sanitize · อบโอโซน
            </Tag>
            <div className={`absolute left-4 top-4 ${move} ${show(['qc', 'preowned', 'next'].includes(at), '-translate-y-3')}`}>
              <GradeBadge grade="A" pct={94} />
            </div>
            <Tag on={at === 'preowned' || at === 'next'} at="bottom-4 right-4" dark>
              Pre-owned {baht(preownedPrice(PRODUCT.price, 'A'))}
            </Tag>
            <Tag on={at === 'next'} at="right-4 top-4">
              ส่งต่อให้รุ่นน้อง ป.6
            </Tag>
          </div>
        </Container>
      </div>
    </section>
  )
}

function Tag({ on, at, dark = false, children }: { on: boolean; at: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`absolute ${at} rounded-full px-3 py-1.5 text-xs font-semibold transition-[transform,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${dark ? 'bg-ink text-paper' : 'bg-card'} ${on ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'}`}
    >
      {children}
    </span>
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
          <p className="mt-4 text-lg text-sub">รองเท้าที่ซื้อจาก KAOWNA สภาพ 75% ขึ้นไป เปลี่ยนเป็นส่วนลดคู่ใหม่ได้ทันที ในรายการสั่งซื้อเดียวกัน</p>
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
              <div key={r} className={`flex items-center justify-between rounded-2xl p-5 ${i === 2 ? 'border border-dashed border-line text-sub' : 'bg-card'}`}>
                <div>
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
              เริ่ม Trade-in <ArrowRight size={16} />
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  )
}

function SizeTeaser() {
  const [g, setG] = useState(GRADES[6])
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
            {Array.from({ length: 16 }, (_, i) => 30 + i).map((s) => (
              <span key={s} className={`h-10 flex-1 rounded transition-colors duration-500 ${s >= g.range[0] && s <= g.range[1] ? 'bg-ink' : 'bg-line'}`} title={`EU ${s}`} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-sub tabular">
            <span>30</span>
            <span>45</span>
          </div>
          <LinkButton to={`/size?grade=${g.id}`} variant="outline" className="mt-8 w-full">
            วัดเท้าให้แม่น 2 ขั้นตอน
          </LinkButton>
        </div>
      </Container>
    </section>
  )
}

const LOOP = ['Trade-in', 'Inspection', 'Cleaning & Sanitizing', 'Quality Check', 'Pre-owned Store']

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
              Shop Now
            </LinkButton>
            <LinkButton to="/trade-in" size="lg" variant="signal">
              Trade-in คู่เก่า
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
      <Colors />
      <TwoStores />
      <TradeInStory />
      <TradeInSection />
      <SizeTeaser />
      <SecondLife />
      <FinalCTA />
    </div>
  )
}
