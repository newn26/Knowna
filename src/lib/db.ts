// Mock database in localStorage. Only api.ts should import this file:
// when a real backend exists, delete db.ts and point api.ts at HTTP endpoints.
import { COLORS, PRODUCT, SIZES } from './catalog'
import { preownedPrice } from './pricing'
import { gradeFor } from './tradein'
import type { ColorId, Order, PreownedItem, Unit, User } from './types'

const KEY = 'kw.db.v3'

export interface DB {
  users: User[]
  orders: Order[]
  units: Unit[]
  preowned: PreownedItem[]
  stock: Record<string, number> // `${color}-${size}` → pairs left
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

const code = (c: ColorId) => COLORS.find((x) => x.id === c)!.code
export const makeSerial = (color: ColorId, size: number, n: number) => `KN-${code(color)}${size}-${String(n).padStart(6, '0')}`

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

  const units: Unit[] = []
  const orders: Order[] = []
  const pastOrder = (id: string, date: string, pairs: [ColorId, number, number][], userId: string | null): Order => {
    const lines = pairs.map(([color, size], i) => ({ key: `${id}-${i}`, kind: 'new' as const, color, size, qty: 1, unitPrice: PRODUCT.price }))
    const serials = pairs.map(([color, size, n]) => makeSerial(color, size, n))
    pairs.forEach(([color, size], i) =>
      units.push({ serial: serials[i], orderId: id, ownerId: userId, color, size, kind: 'new', soldAt: date, tradedIn: false }),
    )
    const subtotal = lines.length * PRODUCT.price
    return {
      id,
      userId,
      createdAt: date,
      customer: userId ? { name: DEMO_USER.name, phone: DEMO_USER.phone, email: DEMO_USER.email, address: DEMO_USER.address } : { name: 'ลูกค้าหน้าร้าน', phone: '0899999999', email: '', address: '' },
      lines,
      tradeIns: [],
      subtotal,
      discount: 0,
      shipping: 0,
      total: subtotal,
      fulfilment: userId ? 'delivery' : 'pickup',
      payment: 'promptpay',
      serials,
      timeScale: 'real',
    }
  }
  orders.push(pastOrder('KN-240510-0031', '2024-05-10T10:12:00+07:00', [['brown', 33, 240117], ['brown', 35, 240118]], DEMO_USER.id))
  orders.push(pastOrder('KN-250502-0107', '2025-05-02T14:40:00+07:00', [['white', 36, 250233]], DEMO_USER.id))
  orders.push(pastOrder('KN-230512-0009', '2023-05-12T09:05:00+07:00', [['brown', 31, 230512]], DEMO_USER.id))
  orders.push(pastOrder('KN-240623-0412', '2024-06-23T16:20:00+07:00', [['brown', 38, 240623]], null))
  // This pair was already traded in once, so it must be rejected if someone tries again.
  units.find((u) => u.serial === makeSerial('brown', 31, 230512))!.tradedIn = true

  const inspectors = ['ช่างต้น', 'ช่างแบงค์', 'ช่างฝน']
  const notesPool = ['รอยย่นหน้าเท้าเล็กน้อย', 'ดอกยางเหลือมากกว่า 80%', 'เปลี่ยนเชือกใหม่แล้ว', 'ซักและตากใหม่ทั้งคู่', 'แผ่นรองใหม่', 'รอยถลอกจุดเล็กที่ส้น']
  const preowned: PreownedItem[] = Array.from({ length: 14 }, (_, i) => {
    const color = (['brown', 'brown', 'black', 'white'] as ColorId[])[Math.floor(r() * 4)]
    const size = 28 + Math.floor(r() * 13)
    const conditionPct = 76 + Math.floor(r() * 23)
    const grade = gradeFor(conditionPct) as 'A' | 'B'
    const day = 1 + Math.floor(r() * 20)
    const listedAt = `2026-11-${String(day).padStart(2, '0')}T10:00:00+07:00`
    return {
      id: `PO-${String(1001 + i)}`,
      color,
      size,
      conditionPct,
      grade,
      originalPrice: PRODUCT.price,
      price: preownedPrice(PRODUCT.price, grade),
      sourceSerial: makeSerial(color, size, 230000 + Math.floor(r() * 9000)),
      wearSeed: Math.floor(r() * 1000),
      photos: [],
      notes: [notesPool[i % notesPool.length], notesPool[(i * 3 + 1) % notesPool.length]],
      qc: { cleanedAt: listedAt, checkedAt: listedAt, inspector: inspectors[i % 3] },
      status: 'available',
      listedAt,
    }
  })
  preowned[3].status = 'sold'

  return { users: [DEMO_USER], orders, units, preowned, stock }
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
