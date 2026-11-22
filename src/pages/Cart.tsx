import { Recycle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { Container, LinkButton, Num, PageHead, Qty } from '../components/ui'
import { getStock, stockOf } from '../lib/api'
import { colorInfo } from '../lib/catalog'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { newPairsIn } from '../lib/tradein'
import type { CartLine, TradeIn } from '../lib/types'

/** Order summary used by the cart and checkout pages. */
export function Summary({ lines, tradeIns, shipping, children }: { lines: CartLine[]; tradeIns: TradeIn[]; shipping?: number; children?: React.ReactNode }) {
  const t = totals(lines, tradeIns)
  const ship = shipping ?? t.shipping
  const unused = t.allocation.filter((a) => !a.appliedTo)
  return (
    <div className="rounded-3xl bg-stone p-6">
      <p className="font-display text-lg font-black uppercase">สรุปคำสั่งซื้อ</p>
      <dl className="mt-4 space-y-2 text-sm tabular">
        <div className="flex justify-between">
          <dt className="text-sub">สินค้า {lines.reduce((n, l) => n + l.qty, 0)} คู่</dt>
          <dd>{baht(t.subtotal)}</dd>
        </div>
        {t.allocation
          .filter((a) => a.appliedTo)
          .map((a) => (
            <div key={a.tradeInId} className="flex justify-between text-signal">
              <dt>
                Trade-in {Math.round(a.rate * 100)}% <span className="text-xs">({a.serial})</span>
              </dt>
              <dd>−{baht(a.amount)}</dd>
            </div>
          ))}
        <div className="flex justify-between">
          <dt className="text-sub">ค่าจัดส่ง</dt>
          <dd>{ship ? baht(ship) : 'ฟรี'}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>ยอดชำระ</dt>
          <dd>
            <Num value={t.subtotal - t.discount + ship} format={baht} />
          </dd>
        </div>
      </dl>
      {unused.length > 0 && (
        <p className="mt-4 rounded-xl bg-signal/10 p-3 text-xs text-signal">
          คู่เก่า {unused.map((u) => u.serial).join(', ')} ยังไม่มีคู่ใหม่ให้หัก เพิ่มคู่ใหม่ หรือจะถูกตัดออกตอนสั่งซื้อ (ไม่แลกเงินสด)
        </p>
      )}
      {children}
    </div>
  )
}

export default function Cart() {
  const cart = useStore((s) => s.cart)
  const tradeIns = useStore((s) => s.tradeIns)
  const canTradeIn = newPairsIn(cart) > tradeIns.filter((t) => t.rate > 0).length
  const [stock, setStock] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    getStock().then(setStock)
  }, [])

  if (!cart.length)
    return (
      <>
        <PageHead title="ตะกร้าว่าง" sub="เลือกรองเท้าคู่ใหม่ หรือดูมือสองที่ผ่าน QC" />
        <Container className="flex gap-3">
          <LinkButton to="/shop">Shop New</LinkButton>
          <LinkButton to="/preowned" variant="outline">
            Pre-owned
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
                <Link to={l.kind === 'preowned' ? `/preowned/${l.preownedId}` : `/product?color=${l.color}&size=${l.size}`} aria-label={`ดู ${colorInfo(l.color).name} EU ${l.size}`} className="grid h-24 w-28 shrink-0 place-items-center rounded-2xl bg-stone sm:h-28 sm:w-36">
                  <Shoe color={l.color} className="w-[88%]" shadow={false} wear={l.kind === 'preowned' ? 12 : 0} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {colorInfo(l.color).name} · EU {l.size}
                      </p>
                      <p className="text-sm text-sub">{l.kind === 'new' ? 'New' : `Pre-owned · ${l.preownedId}`}</p>
                    </div>
                    <p className="font-semibold tabular">{baht(l.unitPrice * l.qty)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    {l.kind === 'new' ? <Qty value={l.qty} onChange={(n) => actions.setQty(l.key, n)} max={stock ? Math.min(10, stockOf(stock, l.color, l.size)) : l.qty} /> : <span className="text-sm text-sub">1 คู่ (มีชิ้นเดียว)</span>}
                    <button onClick={() => actions.removeLine(l.key)} className="grid h-10 w-10 place-items-center rounded-full text-sub hover:bg-ink/5 hover:text-ink" aria-label="ลบ">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {tradeIns.length > 0 && (
            <ul className="mt-6 space-y-2">
              {tradeIns.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-2xl border border-signal/40 bg-signal/5 p-4 text-sm">
                  <span className="flex items-center gap-3">
                    <Recycle size={18} className="text-signal" />
                    <span>
                      <b>Trade-in</b> {colorInfo(t.color).name} EU {t.size} · <span className="tabular">{t.serial}</span> · สภาพ {t.conditionPct}% → ลด {t.rate * 100}%
                    </span>
                  </span>
                  <button onClick={() => actions.removeTradeIn(t.id)} className="text-xs text-sub underline">
                    ยกเลิก
                  </button>
                </li>
              ))}
            </ul>
          )}
          {canTradeIn && (
            <Link to="/trade-in" className="mt-6 flex items-center justify-between rounded-2xl bg-ink p-5 text-paper transition hover:bg-ink/90">
              <span>
                <b>มีคู่เก่าจาก KNOWNA?</b>
                <span className="block text-sm text-paper/70">เทิร์นตอนนี้ ลดคู่ใหม่ในตะกร้าได้ 10–15%</span>
              </span>
              <span className="font-semibold">Trade-in →</span>
            </Link>
          )}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Summary lines={cart} tradeIns={tradeIns}>
            <LinkButton to="/checkout" size="lg" className="mt-6 w-full">
              ชำระเงิน
            </LinkButton>
          </Summary>
        </div>
      </Container>
    </>
  )
}
