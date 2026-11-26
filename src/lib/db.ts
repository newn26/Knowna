// Mock database in localStorage. Only api.ts should import this file:
// when a real backend exists, delete db.ts and point api.ts at HTTP endpoints.
import { COLORS, PRODUCT, SIZES } from './catalog'
import type { ColorId, Order, User } from './types'

const KEY = 'kw.db.v5' // v5: sole kind removed, orders can carry one size exchange

export interface DB {
  users: User[]
  orders: Order[]
  stock: Record<string, number> // `${color}-${size}` → new pairs left
}

export const stockKey = (color: ColorId, size: number) => `${color}-${size}`

// Small deterministic PRNG so the seed looks the same on every machine.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export const DEMO_USER: User = {
  id: 'u-demo',
  name: 'คุณนภา ใจดี',
  phone: '0812345678',
  email: 'napa@example.com',
  address: '99/12 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพมหานคร 10230',
}

function seed(): DB {
  const r = rng(20260522)
  const stock: Record<string, number> = {}
  for (const c of COLORS)
    for (const s of SIZES) {
      const roll = r()
      // a few sold-out and low-stock sizes so those states can be demoed
      stock[stockKey(c.id, s)] = roll < 0.06 ? 0 : roll < 0.18 ? 1 + Math.floor(r() * 3) : 6 + Math.floor(r() * 30)
    }
  stock[stockKey('brown', 34)] = 24

  const pastOrder = (id: string, date: string, pairs: [ColorId, number][], userId: string | null): Order => {
    const lines = pairs.map(([color, size], i) => ({ key: `${id}-${i}`, kind: 'new' as const, color, size, qty: 1, unitPrice: PRODUCT.price }))
    const subtotal = lines.length * PRODUCT.price
    return {
      id,
      userId,
      createdAt: date,
      customer: userId ? { name: DEMO_USER.name, phone: DEMO_USER.phone, email: DEMO_USER.email, address: DEMO_USER.address } : { name: 'ลูกค้าหน้าร้าน', phone: '0899999999', email: '', address: '' },
      lines,
      subtotal,
      shipping: 0,
      total: subtotal,
      fulfilment: userId ? 'delivery' : 'pickup',
      payment: 'promptpay',
      timeScale: 'real',
    }
  }
  const orders = [
    pastOrder('KN-250502-0107', '2025-05-02T14:40:00+07:00', [['white', 36]], DEMO_USER.id),
    pastOrder('KN-240510-0031', '2024-05-10T10:12:00+07:00', [['brown', 33], ['brown', 35]], DEMO_USER.id),
    pastOrder('KN-240623-0412', '2024-06-23T16:20:00+07:00', [['brown', 38]], null),
  ]
  return { users: [DEMO_USER], orders, stock }
}

let cache: DB | null = null

export function load(): DB {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return (cache = JSON.parse(raw) as DB)
  } catch {
    /* storage blocked or corrupt: fall back to a fresh seed */
  }
  cache = seed()
  save()
  return cache
}

export function save() {
  try {
    if (cache) localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* private mode: data lives in memory for this tab */
  }
}

export function resetDB() {
  cache = seed()
  save()
}
