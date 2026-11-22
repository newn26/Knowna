import { ArrowRight, BadgeCheck, Recycle, ScanLine, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { ConditionBar, Container, Eyebrow, LinkButton, SWATCH, useReveal } from '../components/ui'
import { COLORS, GRADES, PRODUCT } from '../lib/catalog'
import { baht, preownedPrice } from '../lib/pricing'
import { gradeFor, rateFor } from '../lib/tradein'
import type { ColorId } from '../lib/types'

const display = { fontStretch: '78%' } as const

function Hero() {
  const [color, setColor] = useState<ColorId>('black')
  return (
    <section className="relative overflow-hidden">
      <Container className="grid items-center gap-8 pb-12 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-14">
        <div className="relative z-10">
          <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            เอาคู่เก่ามาเทิร์น ลดคู่ใหม่ทันทีในบิลเดียว
          </p>
          <h1 className="mt-6 animate-rise font-display text-[clamp(3.2rem,11vw,8.5rem)] font-black uppercase leading-[0.84] tracking-tightest [word-spacing:0.14em] [animation-delay:80ms]" style={display}>
            Step up.
            <br />
            <span className="text-sub/70">Pass it</span> on<span className="text-signal">.</span>
          </h1>
          <p className="mt-6 max-w-md animate-rise text-lg text-sub [animation-delay:160ms]">
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
            {[
              [baht(PRODUCT.price), 'คู่ใหม่'],
              ['15%', 'ส่วนลดเทิร์นสูงสุด'],
              [`${baht(preownedPrice(PRODUCT.price, 'B'))}+`, 'Pre-owned'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-black tabular" style={display}>
                  {v}
                </dt>
                <dd className="text-xs text-sub">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute inset-x-6 top-1/2 -z-0 aspect-square -translate-y-1/2 rounded-full bg-stone sm:inset-x-14" />
          <span className="pointer-events-none absolute -top-2 right-0 select-none font-display text-[9rem] font-black leading-none text-ink/[0.04] sm:text-[13rem]" style={display}>
            {String(COLORS.findIndex((c) => c.id === color) + 1).padStart(2, '0')}
          </span>
          <div key={color} className="relative animate-fade">
            <Shoe color={color} view="pair" className="relative w-full animate-step drop-shadow-xl" />
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
    <div className="overflow-hidden border-y border-line bg-ink py-4 text-paper" aria-hidden>
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
            <Eyebrow n="01">One model, three colours</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl" style={display}>
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
              <Shoe color={c.id} className="mt-6 w-full transition duration-700 group-hover:-rotate-3 group-hover:scale-105" />
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
        <Link to="/shop" className="reveal group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-paper sm:p-10">
          <div>
            <Eyebrow className="!text-paper/60">
              <span className="text-paper">02</span> Shop New
            </Eyebrow>
            <h3 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl" style={display}>
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
            <Eyebrow n="03">Shop Pre-owned</Eyebrow>
            <h3 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl" style={display}>
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

function TradeInSection() {
  const [pct, setPct] = useState(92)
  const rate = rateFor(pct)
  const grade = gradeFor(pct)
  return (
    <section id="trade-in" className="bg-stone py-20 sm:py-28">
      <Container>
        <div className="reveal max-w-3xl">
          <Eyebrow n="04">How Trade-in works</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl" style={display}>
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
                  {rate ? `−${baht(Math.round(PRODUCT.price * rate))}` : 'ไม่รับเทิร์น'}
                </p>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={pct}
              onChange={(e) => setPct(+e.target.value)}
              className="mt-8 w-full accent-[rgb(var(--ink))]"
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
              คู่ใหม่ {baht(PRODUCT.price)} → จ่ายจริง <b className="tabular">{baht(PRODUCT.price - Math.round(PRODUCT.price * rate))}</b>
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
          <Eyebrow n="05">Size Finder</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl" style={display}>
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
    <section id="second-life" className="overflow-hidden bg-ink py-20 text-paper sm:py-28">
      <Container>
        <div className="reveal grid gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow className="!text-paper/60">
              <span className="text-paper">06</span>
              <span className="h-px w-8 bg-paper/20" /> Give shoes a second life
            </Eyebrow>
            <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-7xl" style={display}>
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
        <dl className="reveal mt-14 grid grid-cols-2 gap-8 border-t border-paper/15 pt-10 sm:grid-cols-4">
          {[
            ['1,284', 'คู่ที่ได้ใช้ต่อ'],
            ['5 จุด', 'ตรวจทุกคู่ก่อนขาย'],
            ['100%', 'ผ่านอบโอโซนฆ่าเชื้อ'],
            ['ใหม่', 'แผ่นรองและเชือกทุกคู่'],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="font-display text-4xl font-black tabular sm:text-5xl" style={display}>
                {v}
              </dt>
              <dd className="mt-1 text-sm text-paper/60">{l}</dd>
            </div>
          ))}
        </dl>
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
      <TradeInSection />
      <SizeTeaser />
      <SecondLife />
      <FinalCTA />
    </div>
  )
}
