import { CheckCircle2, LogOut, Package, Recycle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { Button, Container, FakeQR, Field, LinkButton, PageHead, Spinner, Timeline } from '../components/ui'
import { findOrder, getOrder, listMyUnits, listOrders, loginDemo } from '../lib/api'
import { colorInfo } from '../lib/catalog'
import { baht } from '../lib/pricing'
import { orderSteps, reached, tradeInSteps } from '../lib/status'
import { actions, useStore } from '../lib/store'
import type { Order, Unit } from '../lib/types'

const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

const PAY = { promptpay: 'PromptPay', card: 'บัตรเครดิต', cod: 'เก็บเงินปลายทาง' }

export function Track() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [id, setId] = useState(params.get('id') ?? '')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const o = await findOrder(id, phone)
    setBusy(false)
    if (o) navigate(`/order/${o.id}`)
    else setError('ไม่พบคำสั่งซื้อ ตรวจเลขคำสั่งซื้อและเบอร์โทรอีกครั้ง')
  }
  return (
    <>
      <PageHead title="ติดตามพัสดุ" sub="ใช้เลขคำสั่งซื้อ (อยู่ในหน้ายืนยัน/อีเมล) กับเบอร์โทรที่ใช้สั่ง" />
      <Container className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
          <Field label="เลขคำสั่งซื้อ" value={id} onChange={(e) => setId(e.target.value)} placeholder="เช่น KW-250502-0107" spellCheck={false} />
          <Field label="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์ที่ใช้ตอนสั่งซื้อ เช่น 081-234-5678" inputMode="tel" />
          {error && (
            <p className="text-sm text-bad" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={!id || !phone || busy}>
            {busy ? <Spinner /> : 'ค้นหา'}
          </Button>
          <button
            type="button"
            className="text-xs text-sub underline underline-offset-2"
            onClick={() => {
              setId('KW-250502-0107')
              setPhone('0812345678')
            }}
          >
            ใช้ข้อมูลตัวอย่าง
          </button>
        </form>
        <div className="rounded-3xl bg-stone p-6 text-sm text-sub sm:p-8">
          <Package className="text-ink" />
          <p className="mt-4 font-semibold text-ink">มีบัญชีอยู่แล้ว?</p>
          <p className="mt-1">ดูทุกคำสั่งซื้อ Product ID และสถานะคู่ที่เทิร์นได้ในหน้าบัญชี</p>
          <Link to="/account" className="mt-4 inline-block font-semibold text-ink underline underline-offset-4">
            ไปหน้าบัญชี →
          </Link>
        </div>
      </Container>
    </>
  )
}

export function OrderDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const [o, setO] = useState<Order | null | undefined>(undefined)
  const now = useNow()
  useEffect(() => {
    getOrder(id).then(setO)
  }, [id])
  if (o === undefined) return <Container className="py-24 text-center text-sub">กำลังโหลด…</Container>
  if (o === null)
    return (
      <Container className="py-24 text-center">
        <p className="font-semibold">ไม่พบคำสั่งซื้อ {id}</p>
        <Link to="/track" className="mt-3 inline-block underline">
          ค้นหาใหม่
        </Link>
      </Container>
    )
  const steps = orderSteps(o)
  const isNew = params.get('new') === '1'
  const newSerials = [...o.serials]
  return (
    <Container className="pb-10 pt-8 sm:pt-12">
      {isNew && (
        <div className="mb-8 flex animate-rise items-start gap-4 rounded-3xl bg-ink p-6 text-paper">
          <CheckCircle2 className="shrink-0 text-signal" size={28} />
          <div>
            <p className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
              สั่งซื้อสำเร็จ
            </p>
            <p className="text-sm text-paper/70">
              เก็บเลข <b className="text-paper tabular">{o.id}</b> ไว้ติดตามพัสดุ (เดโม: สถานะจะขยับเองทุกครึ่งนาที)
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-sub">คำสั่งซื้อ</p>
          <h1 className="font-display text-4xl font-black tabular sm:text-5xl" style={{ fontStretch: '80%' }}>
            {o.id}
          </h1>
        </div>
        <p className="text-sm text-sub">{new Date(o.createdAt).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-card p-6">
            <h2 className="mb-5 font-semibold">{o.fulfilment === 'pickup' ? 'สถานะการรับที่สาขา' : 'สถานะการจัดส่ง'}</h2>
            <Timeline steps={steps} now={now} />
          </section>
          {o.tradeIns.map((t) => {
            const ts = tradeInSteps(o, t)
            const r = reached(ts, now)
            return (
              <section key={t.id} className="rounded-3xl border border-signal/40 bg-card p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Recycle size={18} className="text-signal" /> คู่เก่า {t.serial}
                  </h2>
                  <span className="text-sm text-sub">
                    สภาพ {t.conditionPct}% · ลด {t.rate * 100}%
                  </span>
                </div>
                {r === 0 ? <p className="text-sm text-sub">รอรับคู่เก่าตอน{o.fulfilment === 'pickup' ? 'มารับที่สาขา' : 'ส่งคู่ใหม่'}</p> : <Timeline steps={ts} now={now} />}
                {r === ts.length && (
                  <Link to="/preowned" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                    คู่นี้ขึ้นร้าน Pre-owned แล้ว →
                  </Link>
                )}
              </section>
            )
          })}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-stone p-6">
            <p className="font-semibold">สินค้า</p>
            <ul className="mt-4 space-y-4">
              {o.lines.map((l) =>
                Array.from({ length: l.qty }, (_, i) => {
                  const serial = l.kind === 'new' ? newSerials.shift() : undefined
                  return (
                    <li key={l.key + i} className="flex items-center gap-3 text-sm">
                      <div className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-card">
                        <Shoe color={l.color} className="w-14" shadow={false} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {colorInfo(l.color).name} · EU {l.size} · {l.kind === 'new' ? 'New' : 'Pre-owned'}
                        </p>
                        {serial && <p className="text-xs text-sub tabular">Product ID {serial}</p>}
                      </div>
                      {serial && <FakeQR value={serial} size={44} />}
                    </li>
                  )
                }),
              )}
            </ul>
            <dl className="mt-5 space-y-1 border-t border-line pt-4 text-sm tabular">
              <div className="flex justify-between">
                <dt className="text-sub">ยอดสินค้า</dt>
                <dd>{baht(o.subtotal)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-signal">
                  <dt>ส่วนลด Trade-in</dt>
                  <dd>−{baht(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sub">ค่าจัดส่ง</dt>
                <dd>{o.shipping ? baht(o.shipping) : 'ฟรี'}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>ชำระแล้ว ({PAY[o.payment]})</dt>
                <dd>{baht(o.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-line p-6 text-sm">
            <p className="font-semibold">{o.fulfilment === 'pickup' ? 'รับที่สาขา' : 'ส่งถึง'}</p>
            <p className="mt-1 text-sub">
              {o.customer.name} · {o.customer.phone}
              <br />
              {o.customer.address}
            </p>
          </div>
          <p className="px-1 text-xs text-sub">เก็บ Product ID ไว้ ใช้เทิร์นคู่นี้ได้ในอนาคต (พิมพ์อยู่ใต้ลิ้นรองเท้าด้วย)</p>
        </aside>
      </div>
    </Container>
  )
}

export function Account() {
  const user = useStore((s) => s.user)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!user) return
    listOrders(user.id).then(setOrders)
    listMyUnits(user.id).then(setUnits)
  }, [user])

  if (!user)
    return (
      <>
        <PageHead title="บัญชีของฉัน" sub="ดูประวัติการสั่งซื้อ Product ID ของทุกคู่ และเทิร์นได้ในคลิกเดียว" />
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
            <p className="font-semibold">เข้าสู่ระบบ (เดโม)</p>
            <p className="mt-1 text-sm text-sub">บัญชี “คุณนภา” ผู้ปกครองที่ซื้อให้ลูก 2 คน มีประวัติ 3 คำสั่งซื้อ</p>
            <Button
              className="mt-6 w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                actions.login(await loginDemo())
                setBusy(false)
              }}
            >
              {busy ? <Spinner /> : 'เข้าสู่ระบบบัญชีเดโม'}
            </Button>
          </div>
          <div className="rounded-3xl bg-stone p-6 text-sm sm:p-8">
            <p className="font-semibold">สั่งแบบไม่มีบัญชี?</p>
            <p className="mt-1 text-sub">ติดตามด้วยเลขคำสั่งซื้อกับเบอร์โทร</p>
            <LinkButton to="/track" variant="outline" className="mt-6">
              ติดตามพัสดุ
            </LinkButton>
          </div>
        </Container>
      </>
    )

  return (
    <>
      <PageHead title={`สวัสดี ${user.name}`} sub={`${user.phone} · ${user.email}`} />
      <Container>
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
              รองเท้าของฉัน
            </h2>
            <span className="text-sm text-sub">{units.filter((u) => !u.tradedIn).length} คู่เทิร์นได้</span>
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
            {units.map((u) => (
              <div key={u.serial} className="w-64 shrink-0 snap-start rounded-3xl border border-line bg-card p-4 sm:w-auto">
                <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-stone">
                  <Shoe color={u.color} wear={8} className="w-[85%]" shadow={false} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="text-sm">
                    <p className="font-semibold">
                      {colorInfo(u.color).name} · EU {u.size}
                    </p>
                    <p className="text-xs text-sub tabular">{u.serial}</p>
                  </div>
                  <FakeQR value={u.serial} size={40} />
                </div>
                {u.tradedIn ? (
                  <p className="mt-3 rounded-full bg-stone py-2 text-center text-xs text-sub">เทิร์นแล้ว · ได้ชีวิตใหม่</p>
                ) : (
                  <Link to={`/trade-in?serial=${u.serial}`} className="mt-3 block rounded-full border border-ink py-2 text-center text-xs font-semibold transition hover:bg-ink hover:text-paper">
                    เท้าโตแล้ว? เทิร์นคู่นี้
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
            ประวัติการสั่งซื้อ
          </h2>
          {orders === null ? (
            <p className="mt-4 text-sub">กำลังโหลด…</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {orders.map((o) => {
                const s = orderSteps(o)
                const done = reached(s) === s.length
                return (
                  <li key={o.id}>
                    <Link to={`/order/${o.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 transition hover:bg-stone/60 sm:px-3">
                      <span className="font-semibold tabular">{o.id}</span>
                      <span className="text-sm text-sub">{new Date(o.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
                      <span className="text-sm text-sub">{o.lines.reduce((n, l) => n + l.qty, 0)} คู่</span>
                      {o.tradeIns.length > 0 && <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-semibold text-signal">Trade-in</span>}
                      <span className={`ml-auto text-sm ${done ? 'text-ok' : 'font-semibold'}`}>{done ? 'สำเร็จ' : s[reached(s) - 1]?.label}</span>
                      <span className="w-20 text-right font-semibold tabular">{baht(o.total)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <Button variant="ghost" className="mt-8" onClick={() => actions.logout()}>
          <LogOut size={16} /> ออกจากระบบ
        </Button>
      </Container>
    </>
  )
}
