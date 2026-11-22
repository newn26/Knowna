import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { Container, PageHead, SWATCH, useReveal } from '../components/ui'
import { getStock, listPreowned, stockOf } from '../lib/api'
import { COLORS, PRODUCT, SIZES } from '../lib/catalog'
import { baht } from '../lib/pricing'
import type { ColorId, PreownedItem } from '../lib/types'

export default function Shop() {
  const [stock, setStock] = useState<Record<string, number> | null>(null)
  const [preowned, setPreowned] = useState<PreownedItem[]>([])
  const [color, setColor] = useState<ColorId | 'all'>('all')
  const [size, setSize] = useState<number | null>(null)
  const ref = useReveal<HTMLDivElement>()
  useEffect(() => {
    getStock().then(setStock)
    listPreowned().then(setPreowned)
  }, [])

  const colors = COLORS.filter((c) => color === 'all' || c.id === color)
  const poCount = (c: ColorId) => preowned.filter((p) => p.status === 'available' && p.color === c && (!size || p.size === size)).length

  return (
    <div ref={ref}>
      <PageHead title="รองเท้าใหม่" sub="รุ่นเดียว 3 สี ทุกคู่มี Product ID และ QR ใต้ลิ้น เก็บไว้ใช้เทิร์นในอนาคต" />
      <Container>
        <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-2 border-y border-line bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-3">
          {(['all', ...COLORS.map((c) => c.id)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${color === c ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`}
            >
              {c !== 'all' && <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20" style={{ background: SWATCH[c] }} />}
              {c === 'all' ? 'ทุกสี' : COLORS.find((x) => x.id === c)!.name}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
          <label className="flex items-center gap-2 text-sm">
            <span className="text-sub">ไซซ์</span>
            <select
              value={size ?? ''}
              onChange={(e) => setSize(e.target.value ? +e.target.value : null)}
              className="h-9 rounded-full border border-line bg-card px-3 text-sm"
              aria-label="กรองตามไซซ์"
            >
              <option value="">ทั้งหมด</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  EU {s}
                </option>
              ))}
            </select>
          </label>
          <Link to="/size" className="ml-auto text-sm text-sub underline-offset-4 hover:text-ink hover:underline">
            ไม่รู้ไซซ์?
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {colors.map((c, i) => {
            const left = stock ? SIZES.filter((s) => stockOf(stock, c.id, s) > 0) : SIZES
            const sizeLeft = size && stock ? stockOf(stock, c.id, size) : null
            return (
              <article key={c.id} className="reveal group" style={{ transitionDelay: `${i * 70}ms` }}>
                <Link to={`/product?color=${c.id}${size ? `&size=${size}` : ''}`} className="block">
                  <div className="relative grid aspect-[4/3.4] place-items-center overflow-hidden rounded-3xl bg-stone">
                    <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-semibold">New</span>
                    {sizeLeft !== null && (
                      <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${sizeLeft === 0 ? 'bg-bad/10 text-bad' : sizeLeft <= 3 ? 'bg-signal text-paper' : 'bg-card'}`}>
                        {sizeLeft === 0 ? `EU ${size} หมด` : sizeLeft <= 3 ? `EU ${size} เหลือ ${sizeLeft}` : `EU ${size} มีของ`}
                      </span>
                    )}
                    <Shoe color={c.id} className="w-[88%] transition duration-700 group-hover:-translate-y-2 group-hover:-rotate-3" />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">
                        {PRODUCT.model} — {c.name}
                      </h2>
                      <p className="text-sm text-sub">
                        {c.nameTh} · {c.hint}
                      </p>
                    </div>
                    <p className="font-semibold tabular">{baht(PRODUCT.price)}</p>
                  </div>
                  <p className="mt-2 text-xs text-sub">
                    มีของ {left.length}/{SIZES.length} ไซซ์ · เทิร์นคู่เก่าลดได้สูงสุด 15%
                  </p>
                </Link>
                {poCount(c.id) > 0 && (
                  <Link to={`/preowned?color=${c.id}${size ? `&size=${size}` : ''}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
                    หรือดู Pre-owned สี{c.nameTh} {poCount(c.id)} คู่ <ArrowRight size={14} />
                  </Link>
                )}
              </article>
            )
          })}
        </div>

        <Link to="/preowned" className="reveal group mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-paper sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-sm text-paper/60">Pre-owned Store</p>
            <p className="mt-1 font-display text-3xl font-black uppercase sm:text-4xl" style={{ fontStretch: '80%' }}>
              ประหยัดขึ้น 45–55% กับคู่ที่ผ่าน QC
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition group-hover:gap-3">
            ดู {preowned.filter((p) => p.status === 'available').length} คู่ที่พร้อมขาย <ArrowRight size={16} />
          </span>
        </Link>
      </Container>
    </div>
  )
}
