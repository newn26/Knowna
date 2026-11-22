// The one place the UI gets data from. Every function is async and returns plain
// data, so moving to a real backend means replacing each body with a fetch() call
// (suggested REST route in the comment above each function) and deleting db.ts.
import { PRODUCT, colorInfo } from './catalog'
import { DEMO_USER, load, makeSerial, resetDB, save, stockKey } from './db'
import { preownedPrice, totals } from './pricing'
import { reached, tradeInSteps } from './status'
import { gradeFor, rateFor, scoreCondition } from './tradein'
import type { CartLine, CheckAnswer, ColorId, Customer, Fulfilment, Order, Payment, PreownedItem, TradeIn, Unit, User } from './types'

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))

export class ApiError extends Error {}

// GET /api/stock
export async function getStock(): Promise<Record<string, number>> {
  await wait(80)
  return { ...load().stock }
}

/** Turn traded-in pairs whose QC has finished into Pre-owned listings. Server would do this in a job. */
function syncPipeline() {
  const db = load()
  let changed = false
  for (const o of db.orders)
    for (const t of o.tradeIns) {
      const id = `PO-T${t.id.slice(-6)}`
      if (db.preowned.some((p) => p.id === id)) continue
      const steps = tradeInSteps(o, t)
      if (reached(steps) < steps.length) continue
      const grade = gradeFor(t.conditionPct) === 'A' ? 'A' : 'B'
      const listedAt = new Date(steps.at(-1)!.at).toISOString()
      db.preowned.unshift({
        id,
        color: t.color,
        size: t.size,
        conditionPct: t.conditionPct,
        grade,
        originalPrice: PRODUCT.price,
        price: preownedPrice(PRODUCT.price, grade),
        sourceSerial: t.serial,
        wearSeed: Number(t.id.slice(-3)) || 7,
        photos: [],
        notes: ['มาจากการเทิร์นล่าสุด', 'ซักใหม่ทั้งคู่'],
        qc: { cleanedAt: listedAt, checkedAt: listedAt, inspector: 'ช่างฝน' },
        status: 'available',
        listedAt,
      })
      changed = true
    }
  if (changed) save()
}

// GET /api/preowned
export async function listPreowned(): Promise<PreownedItem[]> {
  await wait()
  syncPipeline()
  return load().preowned.map((p) => ({ ...p }))
}

// GET /api/preowned/:id
export async function getPreowned(id: string): Promise<PreownedItem | null> {
  await wait(120)
  syncPipeline()
  const p = load().preowned.find((x) => x.id === id)
  return p ? { ...p } : null
}

export type VerifyResult = { ok: true; unit: Unit } | { ok: false; reason: string }

// POST /api/tradein/verify  { serial }
export async function verifyPurchase(rawSerial: string, reservedSerials: string[] = []): Promise<VerifyResult> {
  await wait(700)
  // QR tags encode "KNOWNA:<serial>"; accept either form, any case, stray spaces.
  const serial = rawSerial.trim().toUpperCase().replace(/^KNOWNA:/, '')
  if (!/^KN-(BK|WH|BR)\d{2}-\d{6}$/.test(serial))
    return { ok: false, reason: 'รูปแบบ Product ID ไม่ถูกต้อง ตัวอย่าง KN-BK38-240118 (ดูได้ที่ใต้ลิ้นรองเท้า)' }
  const unit = load().units.find((u) => u.serial === serial)
  if (!unit) return { ok: false, reason: 'ไม่พบรหัสนี้ในประวัติการขาย รับเทิร์นเฉพาะรองเท้าที่ซื้อจาก KNOWNA เท่านั้น' }
  if (unit.tradedIn) return { ok: false, reason: 'คู่นี้ถูกเทิร์นไปแล้ว ใช้สิทธิ์ซ้ำไม่ได้' }
  if (reservedSerials.includes(serial)) return { ok: false, reason: 'คู่นี้อยู่ในตะกร้าของคุณแล้ว' }
  return { ok: true, unit: { ...unit } }
}

// GET /api/me/units   pairs this account bought that can still be traded in
export async function listMyUnits(userId: string): Promise<Unit[]> {
  await wait(200)
  return load()
    .units.filter((u) => u.ownerId === userId)
    .map((u) => ({ ...u }))
}

// POST /api/tradein/inspect  { serial, answers, photos }
export async function inspect(unit: Unit, answers: Record<string, CheckAnswer>, photoCount: number): Promise<TradeIn> {
  await wait(1600)
  const conditionPct = scoreCondition(answers)
  return {
    id: 'TI-' + Date.now().toString(36).toUpperCase(),
    serial: unit.serial,
    color: unit.color,
    size: unit.size,
    answers,
    conditionPct,
    grade: gradeFor(conditionPct),
    rate: rateFor(conditionPct),
    photoCount,
    createdAt: new Date().toISOString(),
  }
}

export interface PlaceOrderInput {
  userId: string | null
  customer: Customer
  lines: CartLine[]
  tradeIns: TradeIn[]
  fulfilment: Fulfilment
  payment: Payment
}

// POST /api/orders
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await wait(900)
  const db = load()
  // Re-check stock and pre-owned availability: another tab could have bought them.
  for (const l of input.lines) {
    if (l.kind === 'new' && (db.stock[stockKey(l.color, l.size)] ?? 0) < l.qty)
      throw new ApiError(`เบอร์ ${l.size} สี${colorInfo(l.color).nameTh} เหลือไม่พอ กรุณาแก้ตะกร้า`)
    if (l.kind === 'preowned' && db.preowned.find((p) => p.id === l.preownedId)?.status !== 'available')
      throw new ApiError(`มือสอง ${l.preownedId} ถูกขายไปแล้ว`)
  }
  for (const t of input.tradeIns) {
    const u = db.units.find((x) => x.serial === t.serial)
    if (!u || u.tradedIn) throw new ApiError(`คู่เก่า ${t.serial} ใช้เทิร์นไม่ได้แล้ว`)
  }
  // Only trade-ins matched to a new pair count; the rest are dropped (no cash, no credit).
  const t = totals(input.lines, input.tradeIns, input.fulfilment)
  const used = new Set(t.allocation.filter((a) => a.appliedTo).map((a) => a.tradeInId))
  const tradeIns = input.tradeIns.filter((x) => used.has(x.id))

  const now = new Date()
  const id = `KN-${now.toISOString().slice(2, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const serials: string[] = []
  for (const l of input.lines) {
    if (l.kind === 'new') {
      db.stock[stockKey(l.color, l.size)] -= l.qty
      for (let i = 0; i < l.qty; i++) {
        const serial = makeSerial(l.color, l.size, Math.floor(Math.random() * 900000) + 100000)
        serials.push(serial)
        db.units.push({ serial, orderId: id, ownerId: input.userId, color: l.color, size: l.size, kind: 'new', soldAt: now.toISOString(), tradedIn: false })
      }
    } else {
      const p = db.preowned.find((x) => x.id === l.preownedId)!
      p.status = 'sold'
      // The pair keeps its serial, so the new owner can trade it in again later.
      const u = db.units.find((x) => x.serial === p.sourceSerial)
      if (u) Object.assign(u, { orderId: id, ownerId: input.userId, kind: 'preowned', soldAt: now.toISOString(), tradedIn: false })
      else db.units.push({ serial: p.sourceSerial, orderId: id, ownerId: input.userId, color: p.color, size: p.size, kind: 'preowned', soldAt: now.toISOString(), tradedIn: false })
    }
  }
  for (const x of tradeIns) db.units.find((u) => u.serial === x.serial)!.tradedIn = true

  const order: Order = {
    id,
    userId: input.userId,
    createdAt: now.toISOString(),
    customer: input.customer,
    lines: input.lines,
    tradeIns,
    subtotal: t.subtotal,
    discount: t.discount,
    shipping: t.shipping,
    total: t.total,
    fulfilment: input.fulfilment,
    payment: input.payment,
    serials,
    timeScale: 'demo',
  }
  db.orders.unshift(order)
  save()
  return order
}

// GET /api/orders/:id?phone=
export async function findOrder(id: string, phone: string): Promise<Order | null> {
  await wait(400)
  const digits = (s: string) => s.replace(/\D/g, '')
  const o = load().orders.find((x) => x.id.toUpperCase() === id.trim().toUpperCase())
  if (!o || digits(o.customer.phone) !== digits(phone)) return null
  return structuredClone(o)
}

// GET /api/orders/:id   (account owner)
export async function getOrder(id: string): Promise<Order | null> {
  await wait(150)
  const o = load().orders.find((x) => x.id === id)
  return o ? structuredClone(o) : null
}

// GET /api/me/orders
export async function listOrders(userId: string): Promise<Order[]> {
  await wait(200)
  return load()
    .orders.filter((o) => o.userId === userId)
    .map((o) => structuredClone(o))
}

// POST /api/auth/demo
export async function loginDemo(): Promise<User> {
  await wait(300)
  return { ...DEMO_USER }
}

// Demo only: wipe local data back to the seed.
export const resetDemo = () => resetDB()

export const stockOf =(stock: Record<string, number>, color: ColorId, size: number) => stock[stockKey(color, size)] ?? 0
