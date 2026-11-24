import { ArrowRight, Check, Layers } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoeFlat } from '../components/Shoe'
import { DovetailSection, SoleSwapDemo } from '../components/SoleRail'
import { Container, LinkButton, Num, SWATCH, useReveal } from '../components/ui'
import { COLORS, GRADES, PRODUCT, SIZES, SOLE } from '../lib/catalog'
import { PHOTOS, USED } from '../lib/photos'
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
              พื้นถอดเปลี่ยนได้ · รางสไลด์ + ล็อกท้าย
            </p>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-black uppercase leading-[0.84] tracking-tightest [word-spacing:0.14em]" style={display}>
              <span className="block animate-rise [animation-delay:80ms]">Step up.</span>
              <span className="block animate-rise [animation-delay:180ms]">
                <span className="text-sub/70">Swap</span> it<span className="text-signal">.</span>
              </span>
            </h1>
          </div>
          <div className="order-3">
            <p className="mt-2 max-w-md animate-rise text-lg text-sub [animation-delay:160ms] lg:mt-6">
              รองเท้าผ้าใบนักเรียนชาย ป.1–ป.6 ที่พื้นถอดเปลี่ยนได้ ดอกยางสึกเมื่อไร ซื้อแค่พื้นใหม่ <b className="text-ink">{baht(SOLE.price)}</b> สไลด์เข้าเองที่บ้าน ไม่ต้องทิ้งทั้งคู่
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
              <LinkButton to="/shop" size="lg">
                ซื้อคู่ใหม่ <ArrowRight size={18} />
              </LinkButton>
              <LinkButton to="/soles" size="lg" variant="outline">
                พื้นรองเท้า
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-md animate-rise grid-cols-3 gap-4 border-t border-line pt-6 [animation-delay:320ms]">
              {(
                [
                  [PRODUCT.price, baht, 'คู่ใหม่'],
                  [SOLE.price, baht, 'พื้นใหม่ทั้งชุด'],
                  [3, (n: number) => `${n} ขั้น`, 'เปลี่ยนพื้นเองที่บ้าน'],
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
  const words = ['คู่ใหม่', 'พื้นถอดเปลี่ยนได้', 'รางสไลด์ + ล็อกท้าย', 'ป.1 – ป.6', 'EU 28 – 40', 'ดำ · ขาว · น้ำตาล', `พื้นใหม่ ${baht(SOLE.price)}`]
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
            <p className="mt-3 max-w-xs text-paper/70">ผ้าใบ หัวยางหุ้มปลายเท้า มาพร้อมพื้นหนึ่งชุดในราง</p>
          </div>
          <img src={PHOTOS.black.side.src} alt="" className="absolute -bottom-4 -right-12 w-[82%] transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-2" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink">
            {baht(PRODUCT.price)} · ช้อปเลย <ArrowRight size={16} />
          </span>
        </Link>
        <Link to="/soles" className="reveal group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-3xl border border-line bg-card p-8 sm:p-10">
          <div>
            <h3 className="mt-0 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl" style={display}>
              พื้นใหม่
              <br />
              คู่เดิม
            </h3>
            <p className="mt-3 max-w-xs text-sub">ดอกยางสึกแต่ผ้าใบยังดี? ซื้อแค่พื้นอะไหล่ กดสลัก ดึงออก สไลด์พื้นใหม่เข้า จบ</p>
          </div>
          <ShoeFlat color="brown" side="sole" className="absolute -bottom-6 -right-16 w-[88%] -rotate-6 transition duration-700 group-hover:-translate-x-3 group-hover:-rotate-3" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
            {baht(SOLE.price)} · ดูวิธีเปลี่ยน <ArrowRight size={16} />
          </span>
        </Link>
      </Container>
    </section>
  )
}

const CHAPTERS = [
  { id: 'worn', label: 'พื้นสึก', h: 'ผ้ายังดี แต่พื้นเรียบแล้ว', d: 'ใส่วิ่งเล่นมาทั้งเทอม ดอกยางใต้ส้นกับปลายเท้าหายก่อนผ้าใบจะขาด อย่าเพิ่งทิ้ง' },
  { id: 'unlock', label: 'ปลดล็อก', h: 'กดสลักที่ส้น', d: 'กดปุ่มสลักด้านหลังส้นค้างไว้ พื้นจะหลุดจากตัวล็อก' },
  { id: 'swap', label: 'สไลด์', h: 'ดึงออก สไลด์เข้า', d: 'ดึงพื้นเก่าออกทางส้น แล้วสไลด์พื้นใหม่เข้าจากส้นไปหาปลายเท้า' },
  { id: 'done', label: 'คลิก', h: 'คลิก แล้วใส่ต่อ', d: 'ได้ยินเสียงคลิกแปลว่าล็อกแล้ว รองเท้าคู่เดิม พื้นใหม่ พร้อมไปโรงเรียน' },
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
function SoleStory() {
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
    <section ref={ref} aria-label="เปลี่ยนพื้นยังไง" className="relative bg-stone" style={{ height: `${CHAPTERS.length * 90}vh` }}>
      <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden [perspective:1600px]">
        <div className="absolute inset-0 grid place-items-center" aria-hidden>
          <div ref={shoe} className="relative w-[120vw] max-w-[1400px] will-change-transform sm:w-[84vw]">
            <img src={USED.src} alt="" className="w-full drop-shadow-[0_30px_30px_rgba(0,0,0,.2)]" />
            <img src={PHOTOS.brown.side.src} alt="" className={`absolute inset-0 w-full transition-opacity duration-1000 ${at === 'done' ? 'opacity-100' : 'opacity-0'}`} />
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
              {at === 'unlock' && (
                <span className="flex animate-rise items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                  <Check size={14} className="text-ok" /> ไม่ต้องใช้เครื่องมือ
                </span>
              )}
              {at === 'swap' && (
                <p className="animate-rise font-display text-3xl font-black tabular sm:text-4xl" style={display}>
                  <span className="text-sub line-through decoration-2">{baht(PRODUCT.price)}</span> <span className="text-signal">{baht(SOLE.price)}</span>
                </p>
              )}
              {at === 'done' && (
                <Link to="/soles#buy" className="inline-flex animate-rise items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
                  สั่งพื้นใหม่ {baht(SOLE.price)} <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

function HowItLocks() {
  return (
    <section id="how-it-locks" className="scroll-mt-16 bg-stone py-20 sm:py-28">
      <Container>
        <div className="reveal max-w-3xl">
          <h2 className="mt-0 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl" style={display}>
            รางสไลด์ + ล็อกท้าย<span className="text-signal">.</span>
          </h2>
          <p className="mt-4 text-lg text-sub">ใต้รองเท้ามีรางรูปหางเหยี่ยว (dovetail) แบบลิ้นชักหรือรางกล้อง พื้นสไลด์เข้าจากส้นไปหาปลายเท้า แล้วมีสลักกดล็อกที่ส้น</p>
        </div>
        <div className="reveal mt-12">
          <SoleSwapDemo />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="reveal rounded-3xl bg-card p-6 sm:p-8">
            <DovetailSection className="w-full" />
          </div>
          <div className="reveal grid gap-3 text-sm">
            {[
              ['ยิ่งเหยียบ ยิ่งแน่น', 'ลิ้นของพื้นกว้างด้านในแคบที่ปากราง แรงเหยียบดันพื้นเข้ารางให้แนบขึ้น พื้นจึงหลุดลงไม่ได้'],
              ['ออกได้ทางเดียว', 'พื้นไหลออกได้ทางส้นเท่านั้น และมีสลักล็อกกั้นไว้ วิ่งเล่นแล้วพื้นไม่เลื่อน'],
              ['ต้องดูแลราง', 'ทรายหรือเศษดินอาจเข้าไปติดในราง ถอดพื้นเคาะทุกสัปดาห์ หรือล้างด้วยน้ำเปล่า'],
            ].map(([h, d], i) => (
              <div key={h} className={`rounded-2xl p-5 ${i === 2 ? 'border border-dashed border-line' : 'bg-card'}`}>
                <p className="font-semibold">{h}</p>
                <p className="mt-1 text-sub">{d}</p>
              </div>
            ))}
            <LinkButton to="/soles" variant="signal" className="mt-1">
              ดูวิธีเปลี่ยนพื้นและสั่งพื้นใหม่ <ArrowRight size={16} />
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

const LOOP = ['ซื้อคู่ใหม่', 'ใส่จนพื้นสึก', 'กดสลัก ดึงพื้นออก', 'สไลด์พื้นใหม่เข้า', 'ใส่ต่อจนเท้าโต']

function OnePair() {
  return (
    <section id="one-pair" className="fixed-tone overflow-hidden bg-ink py-20 text-paper sm:py-28">
      <Container>
        <div className="reveal grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="mt-0 font-display text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-7xl" style={display}>
              ผ้าคู่เดิม
              <br />
              <span className="text-paper/40">พื้นใหม่ได้</span>
            </h2>
          </div>
          <p className="self-end text-lg text-paper/70">
            เด็กวิ่งเล่นทั้งวัน พื้นรองเท้ามักสึกก่อนผ้าใบจะเสีย แต่รองเท้าทั่วไปเปลี่ยนพื้นไม่ได้ เลยต้องซื้อใหม่ทั้งคู่ KNOWNA แยกพื้นออกมา จ่ายแค่ส่วนที่หมดจริง
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
          <Layers className="mx-auto text-signal" size={28} />
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl" style={display}>
            เปิดเทอมนี้ คู่ใหม่ หรือแค่พื้นใหม่
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <LinkButton to="/shop" size="lg">
              ซื้อคู่ใหม่
            </LinkButton>
            <LinkButton to="/soles" size="lg" variant="signal">
              ซื้อพื้นใหม่ {baht(SOLE.price)}
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
      <SoleStory />
      <HowItLocks />
      <SizeTeaser />
      <OnePair />
      <FinalCTA />
    </div>
  )
}
