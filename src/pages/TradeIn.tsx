import { ArrowRight, Camera, Check, History, ImagePlus, Keyboard, QrCode, Recycle, ScanLine, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Shoe } from '../components/Shoe'
import { Button, ConditionBar, Container, Field, LinkButton, Num, Spinner } from '../components/ui'
import { inspect, listMyUnits, loginDemo, verifyPurchase } from '../lib/api'
import { PRODUCT, colorInfo } from '../lib/catalog'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { CHECKLIST, CONDITION_LEVELS, MIN_CONDITION, newPairsIn, scoreCondition } from '../lib/tradein'
import type { CheckAnswer, TradeIn as TradeInT, Unit } from '../lib/types'

const STEPS = ['Old Pair', 'Condition', 'Inspection', 'Discount', 'New Pair']

function Stepper({ at }: { at: number }) {
  return (
    <>
      <p className="sr-only" aria-live="polite">
        ขั้นที่ {at + 1} จาก {STEPS.length}: {STEPS[at]}
      </p>
      <ol className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {STEPS.map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-2">
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition ${
              i < at ? 'bg-ink text-paper' : i === at ? 'bg-signal text-paper ring-4 ring-signal/20' : 'bg-stone text-sub'
            }`}
          >
            {i < at ? <Check size={14} /> : i + 1}
          </span>
          <span className={`text-sm ${i === at ? 'font-semibold' : 'text-sub'}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
        </li>
      ))}
      </ol>
    </>
  )
}

type Method = 'history' | 'id' | 'qr'
const DEMO_QR = 'KNOWNA:KN-BR38-240623'

function Verify({ onVerified, reserved, initial }: { onVerified: (u: Unit) => void; reserved: string[]; initial: string }) {
  const user = useStore((s) => s.user)
  const [method, setMethod] = useState<Method>(initial ? 'id' : user ? 'history' : 'id')
  const [serial, setSerial] = useState(initial)
  const [units, setUnits] = useState<Unit[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) listMyUnits(user.id).then(setUnits)
  }, [user])
  useEffect(() => {
    if (initial) check(initial) // came from "เทิร์นคู่นี้" in Account: skip retyping the ID
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const check = async (value: string) => {
    setBusy(true)
    setError('')
    const r = await verifyPurchase(value, reserved)
    setBusy(false)
    if (r.ok) onVerified(r.unit)
    else setError(r.reason)
  }
  const scan = () => {
    setScanning(true)
    setError('')
    setTimeout(() => {
      setScanning(false)
      setSerial(DEMO_QR)
      check(DEMO_QR)
    }, 1500)
  }

  const tabs: { id: Method; label: string; icon: typeof History }[] = [
    { id: 'history', label: 'Order History', icon: History },
    { id: 'id', label: 'Product ID', icon: Keyboard },
    { id: 'qr', label: 'สแกน QR', icon: QrCode },
  ]
  return (
    <div>
      <h2 className="font-display text-3xl font-black uppercase" style={{ fontStretch: '80%' }}>
        ยืนยันว่าซื้อจาก KNOWNA
      </h2>
      <p className="mt-1 text-sub">รับเทิร์นเฉพาะคู่ที่ซื้อจากร้านเรา เลือกวิธีที่สะดวก</p>
      <div className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-stone p-1" role="group" aria-label="วิธียืนยัน">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={method === id}
            onClick={() => (setMethod(id), setError(''))}
            className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-medium transition ${method === id ? 'bg-card shadow-sm' : 'text-sub hover:text-ink'}`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {method === 'history' &&
          (!user ? (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center">
              <p className="font-medium">เข้าสู่ระบบเพื่อดูคู่ที่เคยซื้อ</p>
              <p className="mt-1 text-sm text-sub">บัญชีเดโมมีประวัติซื้อ 4 คู่ ลองได้ทันที</p>
              <Button className="mt-4" onClick={async () => actions.login(await loginDemo())}>
                เข้าสู่ระบบบัญชีเดโม
              </Button>
            </div>
          ) : units === null ? (
            <p className="text-sub">
              <Spinner /> กำลังโหลดประวัติ…
            </p>
          ) : (
            <ul className="space-y-2">
              {units.map((u) => {
                const inCart = reserved.includes(u.serial)
                const disabled = u.tradedIn || inCart || busy
                return (
                  <li key={u.serial}>
                    <button
                      disabled={disabled}
                      onClick={() => check(u.serial)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-line p-3 text-left transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
                    >
                      <div className="grid h-14 w-16 shrink-0 place-items-center rounded-xl bg-stone">
                        <Shoe color={u.color} className="w-14" shadow={false} wear={8} />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">
                          {colorInfo(u.color).name} · EU {u.size}
                        </p>
                        <p className="text-sub tabular">
                          {u.serial} · ออเดอร์ {u.orderId} · {new Date(u.soldAt).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">{u.tradedIn ? 'เทิร์นแล้ว' : inCart ? 'อยู่ในตะกร้า' : 'เลือก →'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ))}

        {method === 'id' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              check(serial)
            }}
          >
            <Field label="Product ID (พิมพ์อยู่ใต้ลิ้นรองเท้า)" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="KN-XXXX-XXXXXX" autoComplete="off" spellCheck={false} />
            <p className="mt-2 text-xs text-sub">
              ลองรหัสตัวอย่าง:{' '}
              {['KN-BR38-240623', 'KN-BR31-230512', 'KN-BR35-999999'].map((s) => (
                <button key={s} type="button" onClick={() => setSerial(s)} className="mr-2 underline underline-offset-2 tabular hover:text-ink">
                  {s}
                </button>
              ))}
            </p>
            <Button type="submit" className="mt-5 w-full" disabled={!serial.trim() || busy}>
              {busy ? <Spinner /> : 'ตรวจสอบ'}
            </Button>
          </form>
        )}

        {method === 'qr' && (
          <div className="text-center">
            <div className="relative mx-auto grid aspect-square w-full max-w-[260px] place-items-center overflow-hidden rounded-3xl bg-ink">
              <div className="absolute inset-8 rounded-2xl border-2 border-dashed border-paper/40" />
              {scanning ? (
                <span className="absolute inset-x-8 top-1/2 h-0.5 animate-scan bg-signal shadow-[0_0_20px_rgb(var(--signal))]" />
              ) : (
                <Camera size={36} className="text-paper/50" />
              )}
            </div>
            <p className="mt-4 text-sm text-sub">เล็ง QR ที่แท็กใต้ลิ้นรองเท้าให้อยู่ในกรอบ</p>
            <Button className="mt-4" onClick={scan} disabled={scanning || busy}>
              <ScanLine size={16} /> {scanning ? 'กำลังสแกน…' : 'จำลองการสแกน'}
            </Button>
            <p className="mt-2 text-xs text-sub">เดโม: ไม่เปิดกล้องจริง ระบบจะอ่านค่า {DEMO_QR}</p>
          </div>
        )}

        {busy && method !== 'id' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-sub">
            <Spinner /> กำลังตรวจสอบกับประวัติการขาย…
          </p>
        )}
        {error && (
          <p className="mt-4 flex gap-2 rounded-2xl bg-bad/10 p-4 text-sm text-bad" role="alert">
            <X size={18} className="shrink-0" /> {error}
          </p>
        )}
      </div>
    </div>
  )
}

// Required photo angles. 'demo' marks a sample photo so the demo can be clicked through without a camera.
const SHOTS = [
  { id: 'side', label: 'ด้านข้าง', view: 'side' },
  { id: 'toe', label: 'หัวรองเท้า', view: 'toe' },
  { id: 'heel', label: 'ส้นและพื้น', view: 'heel' },
] as const
type ShotId = (typeof SHOTS)[number]['id']

function Condition({ unit, onSubmit }: { unit: Unit; onSubmit: (a: Record<string, CheckAnswer>, photos: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>({})
  const [photos, setPhotos] = useState<Partial<Record<ShotId, string>>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const target = useRef<ShotId>('side')
  const urls = useRef<string[]>([])
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []) // free blob URLs on leave only
  const done = CHECKLIST.every((c) => answers[c.id] !== undefined)
  const missing = SHOTS.filter((x) => !photos[x.id])
  const pct = scoreCondition(answers)
  const setPhoto = (id: ShotId, v?: string) => setPhotos((ph) => ({ ...ph, [id]: v }))
  return (
    <div>
      <h2 className="font-display text-3xl font-black uppercase" style={{ fontStretch: '80%' }}>
        สภาพคู่เก่า
      </h2>
      <p className="mt-1 text-sub">
        ตอบตามจริง 5 ข้อ · {colorInfo(unit.color).name} EU {unit.size} · <span className="tabular">{unit.serial}</span>
      </p>
      <div className="mt-6 space-y-5">
        {CHECKLIST.map((c) => (
          <fieldset key={c.id}>
            <legend className="text-sm font-semibold">
              {c.label} <span className="font-normal text-sub">· {c.help}</span>
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONDITION_LEVELS.map((l, i) => (
                <button
                  key={l.label}
                  type="button"
                  aria-pressed={answers[c.id] === i}
                  onClick={() => setAnswers((a) => ({ ...a, [c.id]: i as CheckAnswer }))}
                  className={`h-11 rounded-xl border px-2 text-sm transition ${
                    answers[c.id] === i ? (i === 3 ? 'border-bad bg-bad text-paper' : 'border-ink bg-ink text-paper') : 'border-line hover:border-ink'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            รูปถ่าย 3 มุม <span className="font-normal text-sub">· จำเป็น ใช้ตรวจสภาพจริง</span>
          </p>
          {missing.length > 0 && (
            <button type="button" onClick={() => missing.forEach((x) => setPhoto(x.id, 'demo'))} className="text-sm font-medium underline underline-offset-4 hover:text-signal">
              ใช้รูปตัวอย่าง (เดโม)
            </button>
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {SHOTS.map((x) => {
            const src = photos[x.id]
            return (
              <div key={x.id}>
                {src ? (
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-stone">
                    {src === 'demo' ? (
                      <div className="grid h-full place-items-center p-2">
                        <Shoe color={unit.color} view={x.view} wear={10} seed={5} className="w-full" shadow={false} label={`รูปตัวอย่าง ${x.label}`} />
                      </div>
                    ) : (
                      <img src={src} alt={`รูป${x.label}`} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setPhoto(x.id)}
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"
                      aria-label={`ลบรูป${x.label}`}
                    >
                      <X size={14} />
                    </button>
                    {src === 'demo' && <span className="absolute bottom-1 left-1 rounded-full bg-card px-1.5 text-[10px] font-semibold">ตัวอย่าง</span>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      target.current = x.id
                      fileRef.current?.click()
                    }}
                    className="grid aspect-square w-full place-items-center rounded-xl border border-dashed border-line text-sub transition hover:border-ink hover:text-ink"
                    aria-label={`ถ่ายหรือเลือกรูป${x.label}`}
                  >
                    <ImagePlus size={22} />
                  </button>
                )}
                <p className="mt-1.5 text-center text-xs text-sub">{x.label}</p>
              </div>
            )
          })}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                const u = URL.createObjectURL(f)
                urls.current.push(u)
                setPhoto(target.current, u)
              }
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-stone p-5">
        <div className="flex items-end justify-between">
          <span className="text-sm text-sub">ประเมินเบื้องต้น</span>
          <span className="font-display text-3xl font-black tabular" style={{ fontStretch: '80%' }}>
            {Object.keys(answers).length ? `${pct}%` : '—'}
          </span>
        </div>
        <div className="mt-2">
          <ConditionBar pct={pct} />
        </div>
      </div>
      <Button size="lg" className="mt-5 w-full" disabled={!done || missing.length > 0} onClick={() => onSubmit(answers, SHOTS.length)}>
        ส่งตรวจสภาพ
      </Button>
      {(!done || missing.length > 0) && (
        <p className="mt-2 text-center text-xs text-sub" aria-live="polite">
          {[!done && `ตอบสภาพให้ครบ ${CHECKLIST.length} ข้อ`, missing.length > 0 && `แนบรูปอีก ${missing.length} มุม (${missing.map((x) => x.label).join(', ')})`].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  )
}

function Inspecting({ unit }: { unit: Unit }) {
  const lines = ['เทียบกับ Product ID ในระบบ', 'ตรวจผ้าใบด้านบนและพื้น', 'ตรวจแผ่นรอง ตะเข็บ เชือก', 'คำนวณคะแนนถ่วงน้ำหนัก']
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, lines.length - 1)), 380)
    return () => clearInterval(t)
  }, [lines.length])
  return (
    <div className="py-6 text-center">
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-stone p-6">
        <Shoe color={unit.color} wear={10} seed={3} className="w-full" />
        <span className="absolute inset-x-0 top-0 h-full animate-scan bg-gradient-to-b from-transparent via-signal/25 to-transparent" />
      </div>
      <p className="mt-6 font-display text-2xl font-black uppercase" style={{ fontStretch: '80%' }}>
        Inspection
      </p>
      <p key={i} className="mt-1 animate-fade text-sub">
        {lines[i]}…
      </p>
    </div>
  )
}

/** Original price → trade-in value → discount → final price, for one new pair. */
export function Breakdown({ t, dark = false }: { t: TradeInT; dark?: boolean }) {
  const off = Math.round(PRODUCT.price * t.rate)
  const muted = dark ? 'text-paper/60' : 'text-sub'
  return (
    <dl className="space-y-2 text-sm tabular">
      <div className="flex justify-between">
        <dt className={muted}>ราคาคู่ใหม่</dt>
        <dd>{baht(PRODUCT.price)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className={muted}>มูลค่าเทิร์น</dt>
        <dd>
          {t.rate * 100}% · สภาพ {t.conditionPct}% เกรด {t.grade}
        </dd>
      </div>
      <div className="flex justify-between text-signal">
        <dt>ส่วนลด</dt>
        <dd>
          −<Num from={0} value={off} format={baht} />
        </dd>
      </div>
      <div className={`flex justify-between border-t pt-2 text-base font-semibold ${dark ? 'border-paper/15' : 'border-line'}`}>
        <dt>ราคาสุทธิ</dt>
        <dd>
          <Num from={PRODUCT.price} value={PRODUCT.price - off} format={baht} />
        </dd>
      </div>
    </dl>
  )
}

function Result({ t, hasNewPair, onApply, onRetry }: { t: TradeInT; hasNewPair: boolean; onApply: () => void; onRetry: () => void }) {
  const cart = useStore((s) => s.cart)
  const tradeIns = useStore((s) => s.tradeIns)
  const after = totals(cart, [...tradeIns, t])
  const ok = t.rate > 0
  return (
    <div>
      <p className="text-sm text-sub">ผลการประเมิน {t.serial}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="font-display text-8xl font-black tabular leading-none" style={{ fontStretch: '75%' }}>
          {t.conditionPct}%
        </p>
        <span className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${ok ? 'bg-ink text-paper' : 'bg-bad/10 text-bad'}`}>{ok ? `เกรด ${t.grade}` : 'ไม่ผ่านเกณฑ์'}</span>
      </div>
      <div className="mt-4">
        <ConditionBar pct={t.conditionPct} />
      </div>
      {ok ? (
        <>
          <div className="fixed-tone mt-8 rounded-3xl bg-ink p-6 text-paper">
            <p className="mb-4 font-display text-5xl font-black text-signal" style={{ fontStretch: '78%' }}>
              −{t.rate * 100}%
            </p>
            <Breakdown t={t} dark />
            {hasNewPair && cart.length > 1 && <p className="mt-3 text-xs text-paper/60">ยอดทั้งตะกร้าหลังหัก {baht(after.subtotal - after.discount)} (ก่อนค่าส่ง)</p>}
          </div>
          <p className="mt-4 text-xs text-sub">
            {hasNewPair ? 'หักจากคู่ใหม่ในตะกร้าทันที' : 'ส่วนลดจะรออยู่ในตะกร้า แล้วหักทันทีเมื่อคุณเลือกคู่ใหม่ ถ้าชำระเงินโดยไม่มีคู่ใหม่ ส่วนลดนี้จะหายไป'} · ตรวจซ้ำตอนรับคู่เก่า ถ้าสภาพไม่ตรง ส่วนลดจะปรับตามจริง · ไม่แลกเงินสด
          </p>
          <Button size="lg" variant="signal" className="mt-6 w-full" onClick={onApply}>
            {hasNewPair ? 'ใช้ส่วนลด แล้วไปชำระเงิน' : 'ใช้ส่วนลด แล้วเลือกคู่ใหม่'} <ArrowRight size={18} />
          </Button>
        </>
      ) : (
        <>
          <div className="mt-8 rounded-3xl border border-line p-6">
            <p className="font-semibold">สภาพต่ำกว่า {MIN_CONDITION}% จึงรับเทิร์นไม่ได้</p>
            <p className="mt-1 text-sm text-sub">คู่นี้ยังเก็บไว้ใช้ต่อได้ หรือนำไปบริจาคตามจุดรับของโรงเรียน คุณยังซื้อคู่ใหม่ในราคาปกติได้</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={onRetry}>
              ประเมินคู่อื่น
            </Button>
            <LinkButton to="/checkout">ชำระเงินราคาปกติ</LinkButton>
          </div>
        </>
      )}
    </div>
  )
}

function Rules() {
  return (
    <section id="rules" className="mt-20 scroll-mt-24">
      <h2 className="font-display text-2xl font-black uppercase">เงื่อนไข Trade-in</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ul className="space-y-3 text-sm">
          {[
            'ต้องเป็นรองเท้าที่ซื้อจาก KNOWNA เท่านั้น ตรวจจาก Order History, Product ID หรือ QR Code',
            'สภาพต้อง 75% ขึ้นไป: 90–100% ลด 15%, 75–89% ลด 10%, ต่ำกว่า 75% ไม่รับ',
            'ส่วนลดใช้กับรองเท้าคู่ใหม่ในรายการสั่งซื้อเดียวกันทันที 1 คู่เก่า ต่อ 1 คู่ใหม่ ประเมินคู่เก่าก่อนเลือกคู่ใหม่ก็ได้',
            'ไม่แลกเป็นเงินสด ไม่มีคูปอง ไม่มี Wallet ไม่มีวันหมดอายุ เพราะใช้ทันทีในบิล',
            'ใช้กับรองเท้ามือสองไม่ได้ แต่คู่มือสองที่ซื้อไปยังเทิร์นต่อได้ในอนาคต',
            'ตรวจซ้ำตอนรับคู่เก่า ถ้าสภาพไม่ตรงกับที่แจ้ง ส่วนลดจะปรับตามจริง',
          ].map((r) => (
            <li key={r} className="flex gap-3">
              <Check size={18} className="mt-0.5 shrink-0 text-signal" />
              {r}
            </li>
          ))}
        </ul>
        <div className="rounded-3xl bg-stone p-6">
          <p className="font-semibold">คู่เก่าไปไหนต่อ</p>
          <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {['Trade-in', 'Inspection', 'Cleaning & Sanitizing', 'Quality Check', 'Pre-owned Store'].map((s, i, a) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-card px-3 py-1.5 font-medium">{s}</span>
                {i < a.length - 1 && <span className="text-sub">→</span>}
              </li>
            ))}
          </ol>
          <Link to="/preowned" className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">
            ดูคู่ที่ได้ชีวิตใหม่แล้ว →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function TradeIn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const cart = useStore((s) => s.cart)
  const tradeIns = useStore((s) => s.tradeIns)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [result, setResult] = useState<TradeInT | null>(null)

  const newPairs = newPairsIn(cart)
  const accepted = tradeIns.filter((t) => t.rate > 0).length
  const free = newPairs - accepted
  const reserved = useMemo(() => tradeIns.map((t) => t.serial), [tradeIns])
  // one pending (unmatched) trade-in is allowed, so customers can assess the old pair before picking the new one
  const blocked = accepted >= Math.max(newPairs, 1) && !result
  const step = blocked ? 4 : !unit ? 0 : !inspecting && !result ? 1 : inspecting ? 2 : 3
  const panel = useRef<HTMLDivElement>(null)
  const lastStep = useRef(step)
  useEffect(() => {
    // keep the new step in view; the condition form is long on phones
    if (lastStep.current === step) return
    lastStep.current = step
    const el = panel.current
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  const submit = async (answers: Record<string, CheckAnswer>, photos: number) => {
    setInspecting(true)
    const t = await inspect(unit!, answers, photos)
    setInspecting(false)
    setResult(t)
  }
  const reset = () => {
    setUnit(null)
    setResult(null)
  }
  const newLines = cart.filter((l) => l.kind === 'new')

  return (
    <Container className="pb-10 pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl" style={{ fontStretch: '78%' }}>
            เทิร์นคู่เก่า<span className="text-signal">.</span>
          </h1>
        </div>
        <p className="max-w-sm text-sub">สภาพ 90–100% ลด 15% · 75–89% ลด 10% หักในบิลเดียวกับคู่ใหม่ทันที</p>
      </div>
      <div className="mt-8">
        <Stepper at={step} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div ref={panel} className="scroll-mt-24 rounded-3xl border border-line bg-card p-5 sm:p-8">
          {blocked && (
            <div className="text-center sm:py-6">
              <Recycle size={32} className="mx-auto text-signal" />
              <h2 className="mt-4 font-display text-3xl font-black uppercase" style={{ fontStretch: '80%' }}>
                {newPairs === 0 ? 'เลือกคู่ใหม่เพื่อใช้ส่วนลด' : 'คู่ใหม่ทุกคู่ได้ส่วนลดแล้ว'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sub">
                {newPairs === 0
                  ? 'คู่เก่าผ่านการประเมินแล้ว ส่วนลดรออยู่ในตะกร้า เลือกสีและไซซ์ของคู่ใหม่ ระบบจะหักให้ทันที'
                  : 'หนึ่งคู่เก่าลดได้หนึ่งคู่ใหม่ ถ้าจะเทิร์นเพิ่ม ให้เพิ่มคู่ใหม่ในตะกร้า'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton to="/product">{newPairs === 0 ? 'เลือกคู่ใหม่' : 'เพิ่มคู่ใหม่'}</LinkButton>
                {newPairs > 0 && (
                  <LinkButton to="/checkout" variant="outline">
                    ไปชำระเงิน
                  </LinkButton>
                )}
              </div>
            </div>
          )}
          {step === 0 && <Verify onVerified={setUnit} reserved={reserved} initial={params.get('serial') ?? ''} />}
          {step === 1 && unit && <Condition unit={unit} onSubmit={submit} />}
          {step === 2 && unit && <Inspecting unit={unit} />}
          {step === 3 && result && (
            <Result
              t={result}
              hasNewPair={free > 0}
              onRetry={reset}
              onApply={() => {
                actions.addTradeIn(result)
                actions.toast(`ส่วนลด Trade-in ${result.rate * 100}% พร้อมใช้`)
                // suggest one size up: the old pair was traded because the foot grew
                navigate(free > 0 ? '/checkout' : `/product?color=${result.color}&size=${Math.min(45, result.size + 1)}`)
              }}
            />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-stone p-5">
            <p className="text-sm font-semibold">คู่ใหม่ในตะกร้า ({newPairs})</p>
            {newLines.length === 0 ? (
              <p className="mt-2 text-sm text-sub">ยังไม่มี</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {newLines.map((l) => (
                  <li key={l.key} className="flex items-center gap-3 text-sm">
                    <div className="grid h-12 w-16 place-items-center rounded-lg bg-card">
                      <Shoe color={l.color} className="w-14" shadow={false} />
                    </div>
                    <span className="flex-1">
                      {colorInfo(l.color).name} · EU {l.size} × {l.qty}
                    </span>
                    <span className="tabular">{baht(PRODUCT.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {tradeIns.length > 0 && (
            <div className="rounded-3xl border border-signal/40 p-5">
              <p className="text-sm font-semibold text-signal">คู่เก่าในบิลนี้</p>
              <ul className="mt-2 space-y-2 text-sm">
                {tradeIns.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span className="tabular">
                      {t.serial} · {t.conditionPct}% · {t.rate * 100}%
                    </span>
                    <button onClick={() => actions.removeTradeIn(t.id)} className="text-xs text-sub underline">
                      ยกเลิก
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {unit && step > 0 && step < 4 && (
            <div className="rounded-3xl border border-line p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-ok">
                <Check size={16} /> ยืนยันการซื้อแล้ว
              </p>
              <p className="mt-1 text-sub tabular">
                {unit.serial} · {colorInfo(unit.color).name} EU {unit.size}
              </p>
              {step === 1 && (
                <button onClick={reset} className="mt-2 text-xs underline">
                  เปลี่ยนคู่
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
      <Rules />
    </Container>
  )
}
