import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PHOTOS } from '../lib/photos'
import { Container, PageHead, SWATCH, useReveal } from '../components/ui'
import { getStock, stockOf } from '../lib/api'
import { COLORS, EXCHANGE, PRODUCT, SIZES } from '../lib/catalog'
import { baht } from '../lib/pricing'
import type { ColorId } from '../lib/types'

export default function Shop() {
  const [stock, setStock] = useState<Record<string, number> | null>(null)
  const [color, setColor] = useState<ColorId | 'all'>('all')
  const [size, setSize] = useState<number | null>(null)
  const ref = useReveal<HTMLDivElement>()
  useEffect(() => {
    getStock().then(setStock)
  }, [])

  const colors = COLORS.filter((c) => color === 'all' || c.id === color)

  return (
    <div ref={ref}>
      <PageHead title="รองเท้าใหม่" sub="ผ้าใบนักเรียนชาย ป.1–ป.6 สั่งไซซ์ผิด เปลี่ยนฟรี 1 ครั้งต่อคำสั่งซื้อ" />
      <Container>
        <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-2 border-y border-line bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-3">
          {COLORS.length > 1 && (['all', ...COLORS.map((c) => c.id)] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${color === c ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`}
            >
              {c !== 'all' && <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20" style={{ background: SWATCH[c] }} />}
              {c === 'all' ? 'ทุกสี' : COLORS.find((x) => x.id === c)!.nameTh}
            </button>
          ))}
          {COLORS.length > 1 && <span className="mx-1 hidden h-5 w-px bg-line sm:block" />}
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

        <div className={`mt-8 grid gap-6 ${colors.length === 1 ? 'max-w-3xl' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {colors.map((c, i) => {
            const left = stock ? SIZES.filter((s) => stockOf(stock, c.id, s) > 0) : SIZES
            const sizeLeft = size && stock ? stockOf(stock, c.id, size) : null
            return (
              <article key={c.id} className="reveal group" style={{ transitionDelay: `${i * 70}ms` }}>
                <Link to={`/product?color=${c.id}${size ? `&size=${size}` : ''}`} className="block">
                  <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-stone">
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-paper">คู่ใหม่</span>
                    {sizeLeft !== null && (
                      <span className={`absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-semibold ${sizeLeft === 0 ? 'bg-bad/10 text-bad' : sizeLeft <= 3 ? 'bg-signal text-paper' : 'bg-card'}`}>
                        {sizeLeft === 0 ? `EU ${size} หมด` : sizeLeft <= 3 ? `EU ${size} เหลือ ${sizeLeft}` : `EU ${size} มีของ`}
                      </span>
                    )}
                    <img src={PHOTOS[c.id].pair.src} alt={PHOTOS[c.id].pair.alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">
                        {PRODUCT.model} สี{c.nameTh}
                      </h2>
                      <p className="text-sm text-sub">
                        {PRODUCT.nameTh} · {c.hint}
                      </p>
                    </div>
                    <p className="font-semibold tabular">{baht(PRODUCT.price)}</p>
                  </div>
                  <p className="mt-2 text-xs text-sub">
                    มีของ {left.length}/{SIZES.length} ไซซ์ · {EXCHANGE.short}
                  </p>
                </Link>
              </article>
            )
          })}
        </div>

        <Link to="/#exchange" className="reveal group mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink p-8 text-paper sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-sm text-paper/60">บริการหลังการขาย</p>
            <p className="mt-1 font-display text-3xl font-black uppercase sm:text-4xl" style={{ fontStretch: '80%' }}>
              สั่งไซซ์ผิด เปลี่ยนฟรี 1 ครั้ง
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition group-hover:gap-3">
            ดูเงื่อนไข <ArrowRight size={16} />
          </span>
        </Link>
      </Container>
    </div>
  )
}
