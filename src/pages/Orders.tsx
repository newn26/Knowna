import { Bell, CheckCircle2, LogOut, Package, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PHOTOS } from '../lib/photos'
import { Button, Container, ExchangeRule, Field, LinkButton, PageHead, Spinner, Timeline } from '../components/ui'
import { ApiError, findOrder, getOrder, listOrders, loginDemo, requestExchange } from '../lib/api'
import { EXCHANGE, GRADES, SIZES, colorInfo, exchangeDeadline, needsRemeasure, nextReminder, sizeForFoot } from '../lib/catalog'
import { baht } from '../lib/pricing'
import { exchangeSteps, orderSteps, reached } from '../lib/status'
import { actions, useStore } from '../lib/store'
import type { ColorId, Order } from '../lib/types'

const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

const PAY = { promptpay: 'พร้อมเพย์' }

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
          <Field label="เลขคำสั่งซื้อ" value={id} onChange={(e) => setId(e.target.value)} placeholder="KN-XXXXXX-XXXX" spellCheck={false} />
          <Field label="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" inputMode="tel" />
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
              setId('KN-250502-0107')
              setPhone('0812345678')
            }}
          >
            ใช้ข้อมูลตัวอย่าง
          </button>
        </form>
        <div className="rounded-3xl bg-stone p-6 text-sm text-sub sm:p-8">
          <Package className="text-ink" />
          <p className="mt-4 font-semibold text-ink">มีบัญชีอยู่แล้ว?</p>
          <p className="mt-1">ดูทุกคำสั่งซื้อ และขอเปลี่ยนไซส์ฟรีได้ในหน้าบัญชี</p>
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
  return (
    <Container className="pb-10 pt-8 sm:pt-12">
      {isNew && (
        <div className="fixed-tone mb-8 flex animate-rise items-start gap-4 rounded-3xl bg-ink p-6 text-paper">
          <CheckCircle2 className="shrink-0 text-signal" size={28} />
          <div>
            <p className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
              สั่งซื้อสำเร็จ
            </p>
            <p className="text-sm text-paper/70">
              เก็บเลข <b className="text-paper tabular">{o.id}</b> ไว้ติดตามพัสดุ (เดโม: สถานะจะขยับเองทุกครึ่งนาที)
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton to="/account" size="sm" className="!bg-paper !text-ink">
                ดูประวัติการสั่งซื้อ
              </LinkButton>
              <LinkButton to="/shop" size="sm" variant="ghost" className="!text-paper hover:!bg-paper/10">
                ช้อปต่อ
              </LinkButton>
            </div>
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
            <h2 className="mb-5 font-semibold">สถานะการจัดส่ง</h2>
            <Timeline steps={steps} now={now} />
          </section>
          <ExchangePanel order={o} delivered={reached(steps, now) === steps.length} now={now} onChange={setO} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-stone p-6">
            <p className="font-semibold">สินค้า</p>
            <ul className="mt-4 space-y-4">
              {o.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 text-sm">
                  <div className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-card">
                    <img src={PHOTOS[l.color].side.src} alt={PHOTOS[l.color].side.alt} className="w-14" />
                  </div>
                  <p className="min-w-0 flex-1 font-medium">
                    สี{colorInfo(l.color).nameTh} · EU {l.size} · คู่ใหม่ × {l.qty}
                    {o.exchange?.lineKey === l.key && <span className="block text-xs font-normal text-sub">เปลี่ยนเป็น EU {o.exchange.toSize} แล้ว</span>}
                  </p>
                  <span className="tabular">{baht(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-1 border-t border-line pt-4 text-sm tabular">
              <div className="flex justify-between">
                <dt className="text-sub">ยอดสินค้า</dt>
                <dd>{baht(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sub">ค่าจัดส่ง</dt>
                <dd>{o.shipping ? baht(o.shipping) : 'รวมในราคาแล้ว'}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>ชำระแล้ว ({PAY[o.payment]})</dt>
                <dd>{baht(o.total)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-line p-6 text-sm">
            <p className="font-semibold">ส่งถึง</p>
            <p className="mt-1 text-sub">
              {o.customer.name} · {o.customer.phone}
              <br />
              {o.customer.address}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  )
}

/** The one free size exchange of an order: ask for it once the order has arrived, then follow it like a delivery. */
function ExchangePanel({ order: o, delivered, now, onChange }: { order: Order; delivered: boolean; now: number; onChange: (o: Order) => void }) {
  const [open, setOpen] = useState(false)
  const [lineKey, setLineKey] = useState(o.lines[0]?.key ?? '')
  const line = o.lines.find((l) => l.key === lineKey)
  const [toSize, setToSize] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const steps = orderSteps(o)
  const deadline = exchangeDeadline(steps[steps.length - 1].at)
  const expired = delivered && now > deadline
  const until = new Date(deadline).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

  const head = (
    <div className="flex items-start gap-3">
      <RefreshCw size={20} className="mt-0.5 shrink-0 text-signal" />
      <div>
        <h2 className="font-semibold">เปลี่ยนไซส์ฟรี 1 ครั้ง</h2>
        <ExchangeRule className="mt-1 text-sub" />
      </div>
    </div>
  )

  if (o.exchange)
    return (
      <section className="rounded-3xl border border-line bg-card p-6">
        {head}
        <p className="mt-5 inline-block rounded-full bg-stone px-3 py-1 text-xs font-semibold">ใช้สิทธิ์เปลี่ยนไซส์ของคำสั่งซื้อนี้แล้ว</p>
        <div className="mt-5">
          <Timeline steps={exchangeSteps(o)} now={now} />
        </div>
      </section>
    )

  const submit = async () => {
    if (!line || toSize === null) return
    setBusy(true)
    setError('')
    try {
      onChange(await requestExchange(o.id, line.key, toSize))
      actions.toast('ส่งคำขอแล้ว ส่งคู่เดิมกลับมาที่แบรนด์ได้เลย')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'ส่งคำขอไม่สำเร็จ ลองอีกครั้ง')
    }
    setBusy(false)
  }

  return (
    <section className="rounded-3xl border border-line bg-card p-6">
      {head}
      {!delivered ? (
        <p className="mt-5 text-sm text-sub">ขอเปลี่ยนไซส์ได้หลังได้รับสินค้าแล้ว ภายใน {EXCHANGE.days} วัน</p>
      ) : expired ? (
        <p className="mt-5 inline-block rounded-full bg-stone px-3 py-1 text-xs font-semibold">หมดเวลาขอเปลี่ยนไซส์แล้ว (ขอได้ถึง {until})</p>
      ) : !open ? (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button onClick={() => setOpen(true)}>ขอเปลี่ยนไซส์ (ฟรี 1 ครั้ง)</Button>
          <p className="text-sm text-sub">ขอได้ถึง {until}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {o.lines.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold">คู่ไหนไซส์ไม่พอดี</p>
              <div className="flex flex-wrap gap-2">
                {o.lines.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => {
                      setLineKey(l.key)
                      setToSize(null)
                    }}
                    aria-pressed={l.key === lineKey}
                    className={`h-10 rounded-full border px-4 text-sm font-medium transition ${l.key === lineKey ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
                  >
                    สี{colorInfo(l.color).nameTh} · EU {l.size}
                  </button>
                ))}
              </div>
            </div>
          )}
          {line && (
            <div>
              <p className="mb-2 text-sm font-semibold">ไซส์ใหม่ (เดิม EU {line.size})</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.filter((s) => s !== line.size).map((s) => (
                  <button
                    key={s}
                    onClick={() => setToSize(s)}
                    aria-pressed={s === toSize}
                    className={`h-10 w-12 rounded-xl border text-sm font-semibold tabular transition ${s === toSize ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-sub">ใช้สิทธิ์ได้ 1 ครั้งต่อคำสั่งซื้อ ยืนยันแล้วเปลี่ยนไซส์อีกไม่ได้ หลังยืนยัน ส่งคู่เดิมพร้อมกล่องกลับมาที่แบรนด์ (ลูกค้าออกค่าส่งคู่เดิม)</p>
          {error && (
            <p className="text-sm text-bad" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={submit} disabled={toSize === null || busy}>
              {busy ? <Spinner /> : toSize === null ? 'เลือกไซส์ใหม่ก่อน' : `ยืนยันเปลี่ยนเป็น EU ${toSize}`}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              ยกเลิก
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

export function Account() {
  const user = useStore((s) => s.user)
  const localIds = useStore((s) => s.orders)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [local, setLocal] = useState<Order[] | null>(null)
  useEffect(() => {
    if (user) return
    Promise.all(localIds.map(getOrder)).then((list) => setLocal(list.filter((o): o is Order => !!o)))
  }, [user, localIds])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!user) return
    listOrders(user.id).then(setOrders)
  }, [user])
  // every pair this account bought, newest first; an exchanged pair shows its new size
  const pairs: { key: string; orderId: string; color: ColorId; size: number; at: string; exchanged: boolean }[] = (orders ?? []).flatMap((o) =>
    o.lines.flatMap((l) =>
      Array.from({ length: l.qty }, (_, i) => {
        const exchanged = o.exchange?.lineKey === l.key && i === 0
        return { key: `${o.id}-${l.key}-${i}`, orderId: o.id, color: l.color, size: exchanged ? o.exchange!.toSize : l.size, at: o.createdAt, exchanged }
      }),
    ),
  )

  if (!user)
    return (
      <>
        <PageHead title="บัญชีของฉัน" sub="ดูประวัติการสั่งซื้อ และขอเปลี่ยนไซส์ฟรี 1 ครั้งต่อคำสั่งซื้อ" />
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
        <Container className="mt-14">
          <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
            คำสั่งซื้อจากเครื่องนี้
          </h2>
          <OrderList orders={local} />
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
            <span className="text-sm text-sub">{pairs.length} คู่</span>
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
            {pairs.map((u) => (
              <div key={u.key} className="w-64 shrink-0 snap-start rounded-3xl border border-line bg-card p-4 sm:w-auto">
                <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-stone">
                  <img src={PHOTOS[u.color].side.src} alt={PHOTOS[u.color].side.alt} className="w-[85%]" />
                </div>
                <div className="mt-3 text-sm">
                  <p className="font-semibold">
                    สี{colorInfo(u.color).nameTh} · EU {u.size}
                  </p>
                  <p className="text-xs text-sub">
                    ซื้อเมื่อ {new Date(u.at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                    {u.exchanged && ' · เปลี่ยนไซส์แล้ว'}
                  </p>
                </div>
                <Link to={`/order/${u.orderId}`} className="mt-3 block rounded-full border border-ink py-2 text-center text-xs font-semibold transition hover:bg-ink hover:text-paper">
                  ดูคำสั่งซื้อ / เปลี่ยนไซส์
                </Link>
              </div>
            ))}
          </div>
        </section>

        <KidsPanel phone={user.phone} />

        <section className="mt-14">
          <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
            ประวัติการสั่งซื้อ
          </h2>
          <OrderList orders={orders} />
        </section>
        <Button variant="ghost" className="mt-8" onClick={() => actions.logout()}>
          <LogOut size={16} /> ออกจากระบบ
        </Button>
      </Container>
    </>
  )
}

/** Saved foot lengths per child and the pre-term reminder from the report (simulated, nothing is sent). */
function KidsPanel({ phone }: { phone: string }) {
  const kids = useStore((s) => s.kids)
  const remind = useStore((s) => s.remind)
  const [form, setForm] = useState({ name: '', grade: GRADES[0].id, cm: '' })
  const [error, setError] = useState('')
  const date = (d: Date | string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'long' })

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const cm = Number(form.cm)
    if (!form.name.trim()) return setError('กรอกชื่อเล่นของลูก')
    if (!(cm >= 15 && cm <= 32)) return setError('ความยาวเท้า 15–32 ซม.')
    actions.saveKid({ id: `k${Date.now()}`, name: form.name.trim(), grade: form.grade, cm, measuredAt: new Date().toISOString() })
    setForm({ name: '', grade: form.grade, cm: '' })
    setError('')
  }

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
        ไซส์เท้าลูก
      </h2>
      <p className="mt-1 text-sm text-sub">บันทึกไว้ ครั้งหน้าไม่ต้องวัดใหม่ และเราจะเตือนก่อนเปิดเทอม</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {kids.map((k) => {
            const eu = sizeForFoot(k.cm + 0.5)
            const old = needsRemeasure(k.measuredAt)
            return (
              <div key={k.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-card p-4">
                <div className="min-w-[8rem]">
                  <p className="font-semibold">{k.name}</p>
                  <p className="text-xs text-sub">
                    {GRADES.find((g) => g.id === k.grade)?.label} · เท้ายาว {k.cm} ซม.
                  </p>
                </div>
                <p className="font-display text-3xl font-black tabular" style={{ fontStretch: '78%' }}>
                  EU {eu}
                </p>
                <p className={`text-xs ${old ? 'font-semibold text-signal' : 'text-sub'}`}>{old ? `วัดล่าสุด ${date(k.measuredAt)} เกิน 6 เดือนแล้ว ควรวัดใหม่` : `วัดเมื่อ ${date(k.measuredAt)}`}</p>
                <div className="ml-auto flex gap-2">
                  <LinkButton to={`/product?size=${eu}`} size="sm">
                    ซื้อเบอร์ {eu}
                  </LinkButton>
                  <Button size="sm" variant="ghost" onClick={() => actions.removeKid(k.id)}>
                    ลบ
                  </Button>
                </div>
              </div>
            )
          })}
          <form onSubmit={add} noValidate className="grid gap-3 rounded-2xl border border-dashed border-line p-4 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end">
            <Field label="ชื่อเล่นลูก" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อเล่น" />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">ชั้น</span>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="h-12 w-full rounded-xl border border-line bg-card px-3">
                {GRADES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="เท้ายาว (ซม.)" value={form.cm} onChange={(e) => setForm({ ...form, cm: e.target.value.replace(/[^\d.]/g, '') })} inputMode="decimal" placeholder="ซม." />
            <Button type="submit">เพิ่ม</Button>
            {error && (
              <p className="text-sm text-bad sm:col-span-4" role="alert">
                {error}
              </p>
            )}
          </form>
        </div>
        <div className="rounded-3xl bg-ink p-6 text-paper">
          <div className="flex items-center gap-3">
            <Bell size={20} />
            <p className="font-semibold">แจ้งเตือนก่อนเปิดเทอม</p>
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 text-sm">
            ส่ง SMS ไปที่ {phone}
            <input type="checkbox" checked={remind} onChange={(e) => actions.setRemind(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--signal))]" />
          </label>
          {remind ? (
            <p className="mt-5 text-sm text-paper/70">
              ครั้งถัดไป <b className="text-paper">{date(nextReminder())}</b> ก่อนช่วงซื้อรองเท้าเปิดเทอม เมษายน–พฤษภาคม พร้อมไซส์ที่บันทึกไว้ของลูกทุกคน
            </p>
          ) : (
            <p className="mt-5 text-sm text-paper/70">ปิดการแจ้งเตือนอยู่</p>
          )}
          <p className="mt-4 text-xs text-paper/50">เว็บสาธิต: ไม่มีการส่ง SMS จริง</p>
        </div>
      </div>
    </section>
  )
}

function OrderList({ orders }: { orders: Order[] | null }) {
  if (orders === null)
    return (
      <div className="mt-4 space-y-2" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    )
  if (!orders.length)
    return (
      <div className="mt-4 rounded-3xl border border-dashed border-line p-8 text-center">
        <p className="font-semibold">ยังไม่มีคำสั่งซื้อ</p>
        <Link to="/shop" className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
          เลือกรองเท้าคู่แรก
        </Link>
      </div>
    )
  return (
    <ul className="mt-4 divide-y divide-line border-y border-line">
      {orders.map((o) => {
        const s = orderSteps(o)
        const done = reached(s) === s.length
        return (
          <li key={o.id}>
            <Link to={`/order/${o.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 transition hover:bg-stone/60 sm:px-3">
              <span className="font-semibold tabular">{o.id}</span>
              <span className="text-sm text-sub">{new Date(o.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</span>
              <span className="text-sm text-sub">{o.lines.reduce((n, l) => n + l.qty, 0)} ชิ้น</span>
              {o.exchange && <span className="rounded-full bg-signal/10 px-2 py-0.5 text-xs font-semibold text-signal">เปลี่ยนไซส์แล้ว</span>}
              <span className={`ml-auto text-sm ${done ? 'text-ok' : 'font-semibold'}`}>{done ? 'สำเร็จ' : s[reached(s) - 1]?.label}</span>
              <span className="w-20 text-right font-semibold tabular">{baht(o.total)}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
