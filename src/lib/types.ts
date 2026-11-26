// Shared data shapes. These mirror what a real backend would return, so swapping
// the mock API (src/lib/api.ts) for HTTP calls should not touch the UI.

export type ColorId = 'black' | 'white' | 'brown'
/** Only new pairs are sold. Kept as a field so old cart/order shapes still read the same. */
export type Kind = 'new'

export interface ColorInfo {
  id: ColorId
  name: string // English label shown in the UI
  nameTh: string
  hint: string // where this colour is usually worn
  code: string
}

export interface CartLine {
  key: string
  kind: Kind
  color: ColorId
  size: number
  qty: number
  unitPrice: number
}

export interface Customer {
  name: string
  phone: string
  email: string
  address: string
}

/** Website only, no stores; PromptPay through a payment gateway is the only payment (report 3.1.3, 4.1.3). */
export type Payment = 'promptpay'

export interface Order {
  id: string
  userId: string | null
  createdAt: string
  customer: Customer
  lines: CartLine[]
  subtotal: number
  shipping: number
  total: number
  payment: Payment
  /** Seed orders are fully delivered; demo orders advance with the clock (see status.ts). */
  timeScale: 'demo' | 'real'
  /** The one free size exchange this order may use (one per order, not per pair). */
  exchange?: Exchange
}

export interface Exchange {
  lineKey: string
  color: ColorId
  fromSize: number
  toSize: number
  requestedAt: string
  timeScale: 'demo' | 'real'
}

export interface AddressParts {
  line: string // house no., moo, soi, road
  subdistrict: string // ตำบล / แขวง
  district: string // อำเภอ / เขต
  province: string
  zip: string
}

export interface User {
  id: string
  name: string
  phone: string
  email: string
  address: string
}
