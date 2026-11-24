import { ChevronDown, Droplets, Hand, Wind } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShoeFlat } from '../components/Shoe'
import { DovetailSection, SoleSwapDemo } from '../components/SoleRail'
import { Button, ColorPicker, Container, Price, Qty, SizeGrid, useReveal } from '../components/ui'
import { COLORS, PRODUCT, SIZES, SOLE, colorInfo } from '../lib/catalog'
import { baht } from '../lib/pricing'
import { actions } from '../lib/store'
import type { ColorId } from '../lib/types'

const display = { fontStretch: '78%' } as const

const CARE = [
  { icon: Hand, t: 'ถอดพื้นเคาะทุกสัปดาห์', d: 'ทรายหรือเศษดินอาจเข้าไปติดในราง ถอดพื้นออกแล้วเคาะรางกับพื้นเบา ๆ' },
  { icon: Droplets, t: 'ล้างรางด้วยน้ำเปล่า', d: 'ถ้าเลอะโคลน ใช้แปรงสีฟันเก่าขัดในรางกับน้ำเปล่า ไม่ต้องใช้น้ำมันหล่อลื่น' },
  { icon: Wind, t: 'ผึ่งให้แห้งก่อนใส่', d: 'ใส่พื้นกลับตอนรางแห้ง พื้นจะสไลด์ลื่นและล็อกได้เต็มที่' },
]

const FAQ = [
  ['เมื่อไรควรเปลี่ยนพื้น', 'เมื่อดอกยางใต้ส้นหรือใต้ปลายเท้าสึกจนเรียบ หรือเริ่มลื่นบนพื้นกระเบื้อง ผ้าใบที่ยังดีอยู่ใส่ต่อได้ เปลี่ยนแค่พื้น'],
  ['ใช้กับรองเท้ายี่ห้ออื่นได้ไหม', `ไม่ได้ พื้นใช้ได้กับ ${PRODUCT.model} เท่านั้น และต้องเป็นไซซ์เดียวกับรองเท้า`],
  ['พื้นหลุดตอนวิ่งไหม', 'ลิ้นรางกว้างด้านในแคบที่ปากราง พื้นจึงหลุดลงไม่ได้ และสลักที่ส้นกันไม่ให้พื้นไหลออกทางส้น แรงเหยียบยิ่งกดพื้นแนบรางแน่นขึ้น'],
  ['เด็กเปลี่ยนเองได้ไหม', 'เด็กโตทำได้เอง เด็ก ป.1–ป.2 ควรให้ผู้ปกครองช่วยกดสลักครั้งแรก'],
] as const

function BuySole() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const color = (COLORS.find((c) => c.id === params.get('color'))?.id ?? 'brown') as ColorId
  const sizeParam = Number(params.get('size'))
  const [size, setSize] = useState<number | null>(SIZES.includes(sizeParam) ? sizeParam : null)
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')
  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    next.set(k, v)
    setParams(next, { replace: true })
    setError('')
  }
  const add = (go: 'cart' | 'checkout') => {
    if (!size) return setError('เลือกไซซ์ให้ตรงกับรองเท้าก่อน')
    actions.addLine({ kind: 'sole', color, size, qty, unitPrice: SOLE.price })
    if (go === 'checkout') return navigate('/checkout')
    actions.toast(`เพิ่มพื้นสี${colorInfo(color).nameTh} EU ${size} ลงตะกร้าแล้ว`)
    actions.openCart()
  }
  return (
    <section id="buy" className="scroll-mt-20 py-16 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="grid aspect-[5/4] place-items-center rounded-3xl bg-stone p-6">
            <ShoeFlat key={color} color={color} side="sole" className="w-full animate-swap" label={`พื้นรองเท้าอะไหล่สี${colorInfo(color).nameTh} มุมใต้พื้น`} />
          </div>
          <p className="mt-3 text-xs text-sub">ภาพประกอบสินค้า · 1 ชุดมีพื้นซ้ายและขวา</p>
        </div>
        <div>
          <p className="text-sm text-sub">{SOLE.nameTh}</p>
          <h2 className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={display}>
            {SOLE.model}
          </h2>
          <p className="mt-4 text-2xl">
            <Price value={SOLE.price} />
            <span className="ml-3 text-sm text-sub">รองเท้าคู่ใหม่ {baht(PRODUCT.price)}</span>
          </p>
          <div className="mt-8 space-y-7">
            <div>
              <p className="mb-3 text-sm font-semibold">สีรองเท้าของคุณ</p>
              <ColorPicker value={color} onChange={(c) => update('color', c)} />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">ไซซ์รองเท้า (EU)</p>
              <SizeGrid
                sizes={SIZES}
                value={size}
                onChange={(s) => {
                  setSize(s)
                  update('size', String(s))
                }}
              />
              <p className="mt-2 text-xs text-sub">ดูเบอร์ได้ที่ป้ายใต้ลิ้นรองเท้า พื้นต้องไซซ์เดียวกับรองเท้าเท่านั้น</p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">จำนวน (ชุด)</p>
              <Qty value={qty} onChange={setQty} max={10} />
            </div>
            {error && (
              <p className="text-sm font-medium text-bad" role="alert">
                {error}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button size="lg" variant="outline" onClick={() => add('cart')}>
                ใส่ตะกร้า
              </Button>
              <Button size="lg" onClick={() => add('checkout')}>
                ซื้อเลย
              </Button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-sub">
              {SOLE.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default function Soles() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <Container className="pb-10 pt-10 sm:pt-16">
        <h1 className="font-display text-5xl font-black leading-[0.9] tracking-tightest sm:text-7xl" style={display}>
          พื้นสึก
          <br />
          <span className="text-sub/70">ไม่ต้องทิ้งทั้งคู่</span>
          <span className="text-signal">.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-sub">
          ใต้รองเท้า {PRODUCT.model} มีรางหางเหยี่ยวแบบลิ้นชัก พื้นสไลด์เข้าจากส้นไปหาปลายเท้า แล้วสลักที่ส้นล็อกไว้ ดอกยางสึกเมื่อไร เปลี่ยนแค่พื้นในราคา <b className="text-ink">{baht(SOLE.price)}</b>
        </p>
        <div className="mt-10">
          <SoleSwapDemo />
        </div>
      </Container>

      <BuySole />

      <section className="bg-stone py-16 sm:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="reveal rounded-3xl bg-card p-6 sm:p-10">
            <DovetailSection className="w-full" />
          </div>
          <div className="reveal">
            <h2 className="font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl" style={display}>
              ยิ่งเหยียบ ยิ่งแน่น
            </h2>
            <p className="mt-4 text-lg text-sub">
              รางเป็นรูปหางเหยี่ยว (dovetail) แบบเดียวกับลิ้นชักหรือรางกล้อง ลิ้นของพื้นกว้างด้านในและแคบที่ปากราง น้ำหนักตัวตอนเหยียบจะดันพื้นแนบเข้ารางมากขึ้น ส่วนทางเดียวที่พื้นออกได้คือทางส้น ซึ่งมีสลักล็อกไว้
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="reveal max-w-2xl">
            <h2 className="font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl" style={display}>
              ดูแลรางให้สะอาด
            </h2>
            <p className="mt-4 text-sub">ข้อควรรู้ตรง ๆ: ทรายหรือเศษดินอาจเข้าไปติดในราง ทำให้สไลด์ฝืดหรือล็อกไม่สุด ดูแลง่าย ๆ แบบนี้</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {CARE.map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="reveal rounded-3xl border border-line bg-card p-6" style={{ transitionDelay: `${i * 70}ms` }}>
                <Icon size={22} className="text-signal" />
                <p className="mt-5 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-sub">{d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 max-w-3xl">
            <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
              คำถามที่พบบ่อย
            </h2>
            <div className="mt-4">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">
                    {q}
                    <ChevronDown size={18} className="shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 text-sm text-sub">{a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-sm text-sub">
              ยังไม่มีรองเท้า?{' '}
              <Link to="/shop" className="font-semibold text-ink underline underline-offset-4">
                ซื้อคู่ใหม่ {baht(PRODUCT.price)} มาพร้อมพื้นหนึ่งชุด →
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </div>
  )
}
