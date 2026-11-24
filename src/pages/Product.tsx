import { ArrowRight, ChevronDown, Layers, Ruler, ShieldCheck, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Shoe, type ShoeView } from '../components/Shoe'
import { Button, ColorPicker, Container, Price, Qty, SizeGrid, useDialog } from '../components/ui'
import { getStock, stockOf } from '../lib/api'
import { COLORS, FREE_SHIPPING_FROM, PRODUCT, SIZES, SOLE, colorInfo } from '../lib/catalog'
import { actions, useStore } from '../lib/store'
import type { ColorId } from '../lib/types'
import { SizeTable } from './SizeFinder'
import { PHOTOS } from '../lib/photos'
import { baht } from '../lib/pricing'

// Photos first; the drawn toe and heel views fill the angles not photographed yet.
const viewsFor = (color: ColorId): { id: string; label: string; photo?: { src: string; alt: string }; shoe?: ShoeView }[] => [
  { id: 'pair', label: 'ทั้งคู่', photo: PHOTOS[color].pair },
  { id: 'side', label: 'ด้านข้าง', photo: PHOTOS[color].side },
  { id: 'toe', label: 'หัวรองเท้า', shoe: 'toe' },
  { id: 'heel', label: 'ส้น', shoe: 'heel' },
]

function Gallery({ color }: { color: ColorId }) {
  const [id, setId] = useState('pair')
  const VIEWS = viewsFor(color)
  const v = VIEWS.find((x) => x.id === id)!
  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative grid aspect-[5/4] place-items-center overflow-hidden rounded-3xl bg-stone">
        {v.photo ? (
          <img key={color + id} src={v.photo.src} alt={v.photo.alt} className={`animate-swap ${id === 'side' ? 'w-[92%]' : 'h-full w-full object-cover'}`} />
        ) : (
          <div key={color + id} className="w-[88%] animate-swap">
            <Shoe color={color} view={v.shoe!} className="w-full" />
          </div>
        )}
        <span className={`absolute bottom-4 left-4 rounded-full px-2.5 py-1 text-xs ${v.photo ? 'bg-card/90 text-ink' : 'text-sub'}`}>{v.photo ? 'ภาพตัวอย่างสินค้า สร้างด้วย AI' : 'ภาพประกอบสินค้า'}</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {VIEWS.map((x) => (
          <button
            key={x.id}
            onClick={() => setId(x.id)}
            aria-label={`ดูมุม${x.label}`}
            aria-pressed={id === x.id}
            className={`grid aspect-square place-items-center overflow-hidden rounded-2xl bg-stone ring-2 transition ${x.photo && x.id === 'pair' ? '' : 'p-2'} ${id === x.id ? 'ring-ink' : 'ring-transparent hover:ring-line'}`}
          >
            {x.photo ? <img src={x.photo.src} alt="" className={x.id === 'pair' ? 'h-full w-full object-cover' : 'w-full'} /> : <Shoe color={color} view={x.shoe!} className="w-full" shadow={false} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function Accordion({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group border-b border-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold">
        {title}
        <ChevronDown size={18} className="transition group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm text-sub">{children}</div>
    </details>
  )
}

function SizeGuideDialog({ size, onClose }: { size: number | null; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose)
  return (
    <div ref={ref} className="fixed inset-0 z-50 grid place-items-end sm:place-items-center" role="dialog" aria-modal aria-label="ตารางไซซ์">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} />
      <div className="relative max-h-[85dvh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-3xl bg-paper p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-xl font-black uppercase">ตารางไซซ์</p>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="ปิด">
            <X size={20} />
          </button>
        </div>
        <SizeTable highlight={size} />
        <Link to="/size" className="mt-4 block text-center text-sm font-medium underline underline-offset-4">
          ใช้ Size Finder วัดเท้า →
        </Link>
      </div>
    </div>
  )
}

export default function Product() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const color = (COLORS.find((c) => c.id === params.get('color'))?.id ?? COLORS[0].id) as ColorId
  const sizeParam = Number(params.get('size'))
  const [size, setSize] = useState<number | null>(SIZES.includes(sizeParam) ? sizeParam : null)
  const [qty, setQty] = useState(1)
  const [guide, setGuide] = useState(false)
  const [stock, setStock] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')
  const cart = useStore((s) => s.cart)

  useEffect(() => {
    getStock().then(setStock)
  }, [])

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    next.set(k, v)
    setParams(next, { replace: true })
    setError('')
  }
  const chooseSize = (s: number) => {
    setSize(s)
    setQty(1)
    update('size', String(s))
  }

  const left = stock && size ? stockOf(stock, color, size) : null

  const add = (go: 'cart' | 'checkout') => {
    if (!size) return setError('เลือกไซซ์ก่อน')
    if (!left) return setError('ไซซ์นี้หมด')
    const inCart = cart.find((l) => l.key === `new-${color}-${size}`)?.qty ?? 0
    if (inCart + qty > left) return setError(`ไซซ์นี้เหลือ ${left} คู่ (อยู่ในตะกร้าแล้ว ${inCart})`)
    actions.addLine({ kind: 'new', color, size, qty, unitPrice: PRODUCT.price })
    if (go === 'checkout') return navigate('/checkout')
    actions.toast(`เพิ่ม ${colorInfo(color).name} EU ${size} ลงตะกร้าแล้ว`)
    actions.openCart()
  }

  return (
    <Container className="pb-10 pt-6 sm:pt-10">
      <nav className="mb-6 text-sm text-sub" aria-label="breadcrumb">
        <Link to="/shop" className="hover:text-ink">
          รองเท้าใหม่
        </Link>{' '}
        / {PRODUCT.model} / สี{colorInfo(color).nameTh}
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Gallery color={color} />

        <div>
          <p className="text-sm text-sub">{PRODUCT.nameTh}</p>
          <h1 className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl" style={{ fontStretch: '80%' }}>
            {PRODUCT.model}
            <span className="block text-sub/70">{colorInfo(color).name}</span>
          </h1>
          <p className="mt-4 text-2xl">
            <Price value={PRODUCT.price} />
          </p>

          <div className="mt-8 space-y-7">
            <div>
              <p className="mb-3 text-sm font-semibold">สี</p>
              <ColorPicker value={color} onChange={(c) => update('color', c)} />
              <p className="mt-2 text-xs text-sub">{colorInfo(color).hint}</p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  ไซซ์ (EU){' '}
                  {left !== null && (
                    <span className={`ml-2 font-normal ${left <= 3 ? 'text-signal' : 'text-sub'}`}>{left === 0 ? 'หมด' : left <= 3 ? `เหลือ ${left} คู่` : `มีของ ${left} คู่`}</span>
                  )}
                </p>
                <button onClick={() => setGuide(true)} className="inline-flex items-center gap-1.5 text-sm text-sub underline-offset-4 hover:text-ink hover:underline">
                  <Ruler size={14} /> ตารางไซซ์
                </button>
              </div>
              <SizeGrid
                sizes={SIZES}
                value={size}
                onChange={chooseSize}
                stockOf={(s) => (stock ? stockOf(stock, color, s) : 99)}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">จำนวน</p>
              <Qty value={qty} onChange={setQty} max={Math.max(1, Math.min(10, left ?? 10))} />
            </div>

            <Link to={`/soles?color=${color}${size ? `&size=${size}` : ''}`} className="group flex gap-4 rounded-2xl border border-line p-4 transition hover:border-ink">
              <Layers size={20} className="mt-0.5 shrink-0 text-signal" />
              <span className="flex-1">
                <span className="block font-semibold">พื้นถอดเปลี่ยนได้</span>
                <span className="mt-1 block text-sm text-sub">รางสไลด์ + ล็อกท้าย พื้นสึกเมื่อไร ซื้อแค่พื้นใหม่ {baht(SOLE.price)} เปลี่ยนเองที่บ้านได้</span>
              </span>
              <ArrowRight size={18} className="mt-0.5 shrink-0 transition group-hover:translate-x-1" />
            </Link>

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

            <ul className="grid gap-3 text-sm text-sub sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Truck size={16} /> ส่งฟรีเมื่อครบ {baht(FREE_SHIPPING_FROM)}
              </li>
              <li className="flex items-center gap-2">
                <Ruler size={16} /> เปลี่ยนไซซ์ฟรี 14 วัน
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={16} /> รับประกันสลักล็อก 6 เดือน
              </li>
            </ul>

            <div>
              <Accordion title="รายละเอียดสินค้า" open>
                <ul className="list-disc space-y-1 pl-5">
                  {PRODUCT.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="สเปก">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                  {PRODUCT.specs.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt>{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Accordion>
              <Accordion title="เปลี่ยนพื้นยังไง">
                กดสลักที่ส้นค้างไว้ ดึงพื้นเก่าออกทางส้น แล้วสไลด์พื้นใหม่เข้าจากส้นไปหาปลายเท้าจนได้ยินเสียงคลิก พื้นอะไหล่ชุดละ {baht(SOLE.price)} ต้องไซซ์เดียวกับรองเท้า{' '}
                <Link to="/soles" className="text-ink underline">
                  ดูวิธีเปลี่ยนแบบภาพ
                </Link>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
      {guide && <SizeGuideDialog size={size} onClose={() => setGuide(false)} />}
    </Container>
  )
}
