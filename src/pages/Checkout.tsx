import { QrCode, Truck } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Field, LinkButton, PageHead, Spinner, useDialog } from '../components/ui'
import { ApiError, placeOrder } from '../lib/api'
import { PROVINCES, colorInfo, formatAddress } from '../lib/catalog'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { Summary } from './Cart'

/** The only delivery and payment method (report: website only, PromptPay only), shown as a fact, not a choice. */
function Choice({ icon: Icon, title, sub }: { icon: typeof Truck; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ink bg-stone p-4">
      <Icon size={20} className="mt-0.5 shrink-0" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-sub">{sub}</span>
      </span>
    </div>
  )
}

export default function Checkout() {
  const cart = useStore((s) => s.cart)
  const user = useStore((s) => s.user)
  const navigate = useNavigate()
  // every field starts empty; placeholders are only faint hints
  const [form, setForm] = useState({ name: '', phone: '', email: '', line: '', subdistrict: '', district: '', province: '', zip: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [apiError, setApiError] = useState('')
  const [qr, setQr] = useState(false)

  if (!cart.length)
    return (
      <>
        <PageHead title="ยังไม่มีสินค้า" />
        <Container>
          <LinkButton to="/shop">เลือกรองเท้า</LinkButton>
        </Container>
      </>
    )

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    if (!form.name.trim()) err.name = 'กรอกชื่อผู้รับ'
    if (!/^0\d{8,9}$/.test(form.phone.replace(/\D/g, ''))) err.phone = 'เบอร์โทร 9–10 หลัก ขึ้นต้นด้วย 0'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'อีเมลไม่ถูกต้อง'
    if (!form.line.trim()) err.line = 'กรอกที่อยู่'
    if (!form.subdistrict.trim()) err.subdistrict = 'กรอกตำบล / แขวง'
    if (!form.district.trim()) err.district = 'กรอกอำเภอ / เขต'
    if (!form.province) err.province = 'เลือกจังหวัด'
    if (!/^\d{5}$/.test(form.zip)) err.zip = 'รหัสไปรษณีย์ 5 หลัก'
    setErrors(err)
    if (Object.keys(err).length) return
    setApiError('')
    setQr(true)
  }

  // the parent confirms the PromptPay transfer; only then is the order created
  const pay = async () => {
    setBusy(true)
    try {
      const order = await placeOrder({
        userId: user?.id ?? null,
        customer: { name: form.name, phone: form.phone, email: form.email, address: formatAddress(form) },
        lines: cart,
        payment: 'promptpay',
      })
      actions.clearCart()
      actions.rememberOrder(order.id)
      navigate(`/order/${order.id}?new=1`)
    } catch (x) {
      setApiError(x instanceof ApiError ? x.message : 'สั่งซื้อไม่สำเร็จ ลองใหม่อีกครั้ง')
      setBusy(false)
      setQr(false)
    }
  }
  const total = totals(cart).total

  return (
    <>
      <PageHead title="ชำระเงิน" />
      <Container>
        <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <section>
              <h2 className="font-semibold">1 · ข้อมูลผู้สั่งซื้อ</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="ชื่อ-นามสกุล" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="ชื่อ นามสกุล" />
                <Field label="เบอร์โทร (ใช้ติดตามพัสดุ)" value={form.phone} onChange={set('phone')} error={errors.phone} inputMode="tel" autoComplete="tel" placeholder="08X-XXX-XXXX" />
                <div className="sm:col-span-2">
                  <Field label="อีเมล (ไม่บังคับ)" value={form.email} onChange={set('email')} error={errors.email} type="email" autoComplete="email" placeholder="name@email.com" />
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-semibold">2 · ที่อยู่จัดส่ง</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Choice icon={Truck} title="จัดส่งถึงบ้าน" sub="รวมในราคาแล้ว ไม่มีค่าส่งเพิ่ม" />
              </div>
              <div className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="ที่อยู่" value={form.line} onChange={set('line')} error={errors.line} autoComplete="address-line1" placeholder="บ้านเลขที่ หมู่ ซอย ถนน" />
                    </div>
                    <Field label="ตำบล / แขวง" value={form.subdistrict} onChange={set('subdistrict')} error={errors.subdistrict} autoComplete="address-level3" placeholder="ตำบล / แขวง" />
                    <Field label="อำเภอ / เขต" value={form.district} onChange={set('district')} error={errors.district} autoComplete="address-level2" placeholder="อำเภอ / เขต" />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium">จังหวัด</span>
                      <select
                        value={form.province}
                        onChange={set('province')}
                        autoComplete="address-level1"
                        aria-invalid={errors.province ? true : undefined}
                        className={`h-12 w-full rounded-xl border bg-card px-4 text-[15px] ${form.province ? '' : 'text-sub/45'} ${errors.province ? 'border-bad' : 'border-line'}`}
                      >
                        <option value="">เลือกจังหวัด</option>
                        {PROVINCES.map((p) => (
                          <option key={p} className="text-ink">
                            {p}
                          </option>
                        ))}
                      </select>
                      {errors.province && <span className="mt-1 block text-xs text-bad">{errors.province}</span>}
                    </label>
                    <Field label="รหัสไปรษณีย์" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} error={errors.zip} inputMode="numeric" autoComplete="postal-code" placeholder="XXXXX" />
                  </div>
              </div>
            </section>

            <section>
              <h2 className="font-semibold">3 · ชำระเงิน</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Choice icon={QrCode} title="พร้อมเพย์ (PromptPay)" sub="สแกน QR จ่ายผ่านระบบรับชำระเงิน Omise" />
              </div>
              <p className="mt-3 text-xs text-sub">เว็บสาธิต: ไม่มีการตัดเงินจริง</p>
            </section>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <ul className="mb-3 divide-y divide-line rounded-3xl border border-line px-5 text-sm">
              {cart.map((l) => (
                <li key={l.key} className="flex justify-between gap-3 py-3">
                  <span>
                    สี{colorInfo(l.color).nameTh} · EU {l.size} · คู่ใหม่ × {l.qty}
                  </span>
                  <span className="tabular">{baht(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <Summary lines={cart}>
              {apiError && (
                <p className="mt-4 rounded-xl bg-bad/10 p-3 text-sm text-bad" role="alert">
                  {apiError}
                </p>
              )}
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
                ยืนยันคำสั่งซื้อ และชำระเงิน
              </Button>
            </Summary>
          </div>
        </form>
      </Container>
      {qr && <PromptPayDialog amount={total} busy={busy} onPaid={pay} onClose={() => !busy && setQr(false)} />}
    </>
  )
}

/** A PromptPay QR for the exact amount. The pattern is a stand-in: a real build gets the QR from Omise. */
function PromptPayDialog({ amount, busy, onPaid, onClose }: { amount: number; busy: boolean; onPaid: () => void; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(onClose)
  return createPortal(
    <div ref={ref} className="fixed inset-0 z-50 grid place-items-center" role="dialog" aria-modal aria-label="สแกนจ่ายด้วยพร้อมเพย์">
      <div className="absolute inset-0 animate-fade bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-rise rounded-3xl bg-paper p-7 text-center">
        <p className="font-semibold">สแกนจ่ายด้วยพร้อมเพย์</p>
        <p className="mt-1 text-sm text-sub">เปิดแอปธนาคาร สแกน QR แล้วยืนยันยอด</p>
        <div className="mx-auto mt-5 w-56 rounded-2xl bg-white p-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,.35)]">
          <FakeQr seed={amount} />
        </div>
        <p className="mt-5 text-sm text-sub">ยอดชำระ</p>
        <p className="font-display text-4xl font-black tabular" style={{ fontStretch: '80%' }}>
          {baht(amount)}
        </p>
        <p className="mt-1 text-xs text-sub">รวมค่าจัดส่งแล้ว · รับชำระผ่าน Omise</p>
        <Button size="lg" className="mt-6 w-full" onClick={onPaid} disabled={busy}>
          {busy ? <Spinner /> : 'ชำระเงินแล้ว'}
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={onClose} disabled={busy}>
          ยกเลิก กลับไปแก้ข้อมูล
        </Button>
        <p className="mt-3 text-xs text-sub">เว็บสาธิต: QR นี้สแกนจ่ายไม่ได้จริง กด "ชำระเงินแล้ว" เพื่อจำลองการจ่าย</p>
      </div>
    </div>,
    document.body,
  )
}

/** Deterministic QR-looking grid with the three corner finder squares. Not a decodable code. */
function FakeQr({ seed }: { seed: number }) {
  const N = 25
  let s = seed * 9301 + 49297
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const finder = (x: number, y: number) => {
    for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
      const dx = x - fx, dy = y - fy
      if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0
    }
    return -1
  }
  const cells: [number, number][] = []
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const f = finder(x, y)
      if (f === 1 || (f === -1 && rnd() < 0.48)) cells.push([x, y])
    }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="block w-full" shapeRendering="crispEdges" aria-hidden>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#111" />
      ))}
    </svg>
  )
}
