import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { Container, LinkButton, Num, PageHead, Qty } from '../components/ui'
import { getStock, stockOf } from '../lib/api'
import { colorInfo } from '../lib/catalog'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import type { CartLine } from '../lib/types'

/** Order summary used by the cart and checkout pages. */
export function Summary({ lines, shipping, children }: { lines: CartLine[]; shipping?: number; children?: React.ReactNode }) {
  const t = totals(lines)
  const ship = shipping ?? t.shipping
  return (
    <div className="rounded-3xl bg-stone p-6">
      <p className="font-display text-lg font-black uppercase">สรุปคำสั่งซื้อ</p>
      <dl className="mt-4 space-y-2 text-sm tabular">
        <div className="flex justify-between">
          <dt className="text-sub">สินค้า {lines.reduce((n, l) => n + l.qty, 0)} ชิ้น</dt>
          <dd>{baht(t.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sub">ค่าจัดส่ง</dt>
          <dd>{ship ? baht(ship) : 'ฟรี'}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>ยอดชำระ</dt>
          <dd>
            <Num value={t.subtotal + ship} format={baht} />
          </dd>
        </div>
      </dl>
      {children}
    </div>
  )
}

export default function Cart() {
  const cart = useStore((s) => s.cart)
  const [stock, setStock] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    getStock().then(setStock)
  }, [])

  if (!cart.length)
    return (
      <>
        <PageHead title="ตะกร้าว่าง" sub="เลือกรองเท้าคู่ใหม่ ไม่แน่ใจไซซ์ ใช้หน้าหาไซซ์ช่วยเลือกก่อนได้" />
        <Container className="flex gap-3">
          <LinkButton to="/shop">ซื้อคู่ใหม่</LinkButton>
          <LinkButton to="/size" variant="outline">
            หาไซซ์
          </LinkButton>
        </Container>
      </>
    )

  return (
    <>
      <PageHead title="ตะกร้า" />
      <Container className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {cart.map((l) => (
              <li key={l.key} className="flex gap-4 py-5">
                <Link to={`/product?color=${l.color}&size=${l.size}`} aria-label={`ดูสี${colorInfo(l.color).nameTh} EU ${l.size}`} className="grid h-24 w-28 shrink-0 place-items-center rounded-2xl bg-stone sm:h-28 sm:w-36">
                  <Shoe color={l.color} className="w-[88%]" shadow={false} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        สี{colorInfo(l.color).nameTh} · EU {l.size}
                      </p>
                      <p className="text-sm text-sub">รองเท้าคู่ใหม่</p>
                    </div>
                    <p className="font-semibold tabular">{baht(l.unitPrice * l.qty)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <Qty value={l.qty} onChange={(n) => actions.setQty(l.key, n)} max={stock ? Math.min(10, stockOf(stock, l.color, l.size)) : l.qty} />
                    <button onClick={() => actions.removeLine(l.key)} className="grid h-10 w-10 place-items-center rounded-full text-sub hover:bg-ink/5 hover:text-ink" aria-label="ลบ">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/size" className="mt-6 flex items-center justify-between rounded-2xl bg-ink p-5 text-paper transition hover:bg-ink/90">
            <span>
              <b>ไม่แน่ใจไซซ์?</b>
              <span className="block text-sm text-paper/70">ถ้าได้รับแล้วไม่พอดี เปลี่ยนไซซ์ฟรี 1 ครั้งต่อคำสั่งซื้อ แบรนด์ออกค่าส่งคู่ใหม่</span>
            </span>
            <span className="font-semibold">หาไซซ์ →</span>
          </Link>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Summary lines={cart}>
            <LinkButton to="/checkout" size="lg" className="mt-6 w-full">
              ชำระเงิน
            </LinkButton>
          </Summary>
        </div>
      </Container>
    </>
  )
}
