import { ArrowRight, Check, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, ExchangeRule, LinkButton, Num, SWATCH, useReveal } from '../components/ui'
import { COLORS, EXCHANGE, GRADES, PRODUCT, SIZES } from '../lib/catalog'
import { PHOTOS } from '../lib/photos'
import { baht } from '../lib/pricing'
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
              {EXCHANGE.short} · แบรนด์ออกค่าส่งคู่ใหม่
            </p>
            <h1 className="mt-6 font-display text-[clamp(3rem,9vw,7rem)] font-black leading-[1.12] tracking-tightest" style={display}>
              <span className="block animate-rise [animation-delay:80ms]">ไซซ์ผิด</span>
              <span className="block animate-rise [animation-delay:180ms]">
                <span className="text-sub/70">เปลี่ยน</span>ฟรี<span className="text-signal">.</span>
              </span>
            </h1>
          </div>
          <div className="order-3">
            <p className="mt-2 max-w-md animate-rise text-lg text-sub [animation-delay:160ms] lg:mt-6">
              รองเท้าผ้าใบนักเรียนชายที่มาพร้อมบริการหลังการขาย ถ้าสั่งไซซ์ผิด เปลี่ยนได้ฟรี 1 ครั้งต่อคำสั่งซื้อ ให้ผู้ปกครองมั่นใจในการซื้อรองเท้าออนไลน์มากขึ้น
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              <LinkButton to="/shop" size="lg">
                ซื้อคู่ใหม่ <ArrowRight size={18} />
              </LinkButton>
              <LinkButton to="/#exchange" size="lg" variant="outline">
                เปลี่ยนไซซ์ยังไง
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-md animate-rise grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
              {(
                [
                  [PRODUCT.price, baht, 'คู่ใหม่'],
                  [1, (n: number) => `${n} ครั้ง`, 'เปลี่ยนไซซ์ฟรีต่อบิล'],
                  [0, baht, 'ค่าส่งคู่ใหม่ แบรนด์ออกให้'],
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
  const words = ['คู่ใหม่', 'ไซซ์ผิด เปลี่ยนฟรี', '1 ครั้งต่อบิล', 'ป.1 – ป.6', 'EU 28 – 40', 'ดำ · ขาว · น้ำตาล', 'ส่งคู่ใหม่ฟรี']
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

const STEPS = [
  { h: 'สั่งซื้อตามไซซ์ที่เลือก', d: 'ใช้หน้าหาไซซ์ช่วยเลือกก่อนสั่ง เพื่อให้ได้ไซซ์ที่พอดีตั้งแต่ครั้งแรก' },
  { h: 'ได้รับแล้วไซซ์ไม่พอดี', d: 'เปิดหน้าคำสั่งซื้อ กด "ขอเปลี่ยนไซซ์" แล้วเลือกไซซ์ใหม่' },
  { h: 'รับคู่ใหม่ ไม่เสียค่าส่ง', d: 'แบรนด์เป็นผู้ออกค่าจัดส่งรองเท้าคู่ใหม่ให้ ใช้ได้ 1 ครั้งต่อคำสั่งซื้อ' },
]

/** The free size exchange: what it is and the three steps to use it. */
function ExchangeHow() {
  return (
    <section id="exchange" className="scroll-mt-16 bg-stone py-20 sm:py-28">
      <Container>
        <div className="reveal max-w-3xl">
          <h2 className="mt-0 font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl" style={display}>
            สั่งไซซ์ผิด เปลี่ยนฟรี 1 ครั้ง<span className="text-signal">.</span>
          </h2>
          <ExchangeRule className="mt-5 text-lg text-sub" />
        </div>
        <ol className="mt-12 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.h} className="reveal relative rounded-3xl bg-card p-6 sm:p-8" style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="font-display text-sm font-bold text-signal tabular">0{i + 1}</span>
              <p className="mt-6 text-xl font-semibold leading-tight">{s.h}</p>
              <p className="mt-2 text-sm text-sub">{s.d}</p>
              {i < STEPS.length - 1 && <ArrowRight size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-stone text-sub sm:block" />}
            </li>
          ))}
        </ol>
        <div className="reveal mt-8 flex flex-wrap gap-3">
          <LinkButton to="/size" variant="signal">
            หาไซซ์ก่อนสั่ง <ArrowRight size={16} />
          </LinkButton>
          <LinkButton to="/account" variant="outline">
            ลองขอเปลี่ยนไซซ์กับบัญชีเดโม
          </LinkButton>
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

function FinalCTA() {
  return (
    <section className="pt-20 sm:pt-28">
      <Container>
        <div className="reveal relative overflow-hidden rounded-[2rem] bg-stone px-6 py-16 text-center sm:px-16 sm:py-24">
          <RefreshCw className="mx-auto text-signal" size={28} />
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl" style={display}>
            ซื้อออนไลน์ได้ ไม่ต้องกลัวไซซ์ผิด
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sub">{EXCHANGE.rule}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <LinkButton to="/shop" size="lg">
              ซื้อคู่ใหม่
            </LinkButton>
            <LinkButton to="/size" size="lg" variant="signal">
              หาไซซ์ที่ใช่
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
      <ExchangeHow />
      <SizeTeaser />
      <FinalCTA />
    </div>
  )
}
