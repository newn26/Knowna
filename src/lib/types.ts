// Shared data shapes. These mirror what a real backend would return, so swapping
// the mock API (src/lib/api.ts) for HTTP calls should not touch the UI.

export type ColorId = 'black' | 'white' | 'brown'
export type Kind = 'new' | 'preowned'
export type Grade = 'A' | 'B' | 'C'

export interface ColorInfo {
  id: ColorId
  name: string // English label shown in the UI
  nameTh: string
  hint: string // where this colour is usually worn
  code: string // used in serial numbers
}

/** One physical pair the store has sold. The serial is printed inside the tongue and in the QR tag. */
export interface Unit {
  serial: string
  orderId: string
  ownerId: string | null // account id, null for guest orders
  color: ColorId
  size: number
  kind: Kind
  soldAt: string
  tradedIn: boolean
}

export interface PreownedItem {
  id: string
  color: ColorId
  size: number
  conditionPct: number
  grade: Exclude<Grade, 'C'>
  originalPrice: number
  price: number
  sourceSerial: string
  wearSeed: number // drives the simulated wear marks on the photo
  photos: string[] // real photo URLs once a backend exists; empty means use the illustration
  notes: string[]
  qc: { cleanedAt: string; checkedAt: string; inspector: string }
  status: 'available' | 'sold'
  listedAt: string
}

export interface CartLine {
  key: string
  kind: Kind
  color: ColorId
  size: number
  qty: number
  unitPrice: number
  preownedId?: string
}

export type CheckAnswer = 0 | 1 | 2 | 3 // index into CONDITION_LEVELS

export interface TradeIn {
  id: string
  serial: string
  color: ColorId
  size: number
  answers: Record<string, CheckAnswer>
  conditionPct: number
  grade: Grade
  rate: number // 0.15, 0.10 or 0 when rejected
  photoCount: number
  createdAt: string
}

export interface Customer {
  name: string
  phone: string
  email: string
  address: string
}

export type Fulfilment = 'delivery' | 'pickup'
export type Payment = 'promptpay' | 'card' | 'cod'

export interface Order {
  id: string
  userId: string | null
  createdAt: string
  customer: Customer
  lines: CartLine[]
  tradeIns: TradeIn[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  fulfilment: Fulfilment
  payment: Payment
  serials: string[] // serials of the new pairs in this order
  /** Seed orders are fully delivered; demo orders advance with the clock (see status.ts). */
  timeScale: 'demo' | 'real'
}

export interface User {
  id: string
  name: string
  phone: string
  email: string
  address: string
}
