// The one place the UI gets data from. Every function is async and returns plain
// data, so moving to a real backend means replacing each body with a fetch() call
// (suggested REST route in the comment above each function) and deleting db.ts.
import { colorInfo } from './catalog'
import { DEMO_USER, load, resetDB, save, stockKey } from './db'
import { totals } from './pricing'
import type { CartLine, ColorId, Customer, Fulfilment, Order, Payment, User } from './types'

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))

export class ApiError extends Error {}

// GET /api/stock
export async function getStock(): Promise<Record<string, number>> {
  await wait(80)
  return { ...load().stock }
}

export interface PlaceOrderInput {
  userId: string | null
  customer: Customer
  lines: CartLine[]
  fulfilment: Fulfilment
  payment: Payment
}

// POST /api/orders
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await wait(900)
  const db = load()
  // Re-check stock: another tab could have bought the last pairs.
  for (const l of input.lines)
    if (l.kind === 'new' && (db.stock[stockKey(l.color, l.size)] ?? 0) < l.qty)
      throw new ApiError(`เบอร์ ${l.size} สี${colorInfo(l.color).nameTh} เหลือไม่พอ กรุณาแก้ตะกร้า`)

  const t = totals(input.lines, input.fulfilment)
  const now = new Date()
  const id = `KN-${now.toISOString().slice(2, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  for (const l of input.lines) if (l.kind === 'new') db.stock[stockKey(l.color, l.size)] -= l.qty

  const order: Order = {
    id,
    userId: input.userId,
    createdAt: now.toISOString(),
    customer: input.customer,
    lines: input.lines,
    subtotal: t.subtotal,
    shipping: t.shipping,
    total: t.total,
    fulfilment: input.fulfilment,
    payment: input.payment,
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

export const stockOf = (stock: Record<string, number>, color: ColorId, size: number) => stock[stockKey(color, size)] ?? 0
