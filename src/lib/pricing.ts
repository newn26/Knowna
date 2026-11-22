import { FREE_SHIPPING_FROM, SHIPPING_FEE } from './catalog'
import { allocateTradeIns } from './tradein'
import type { CartLine, Fulfilment, TradeIn } from './types'

export function totals(lines: CartLine[], tradeIns: TradeIn[], fulfilment: Fulfilment = 'delivery') {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const allocation = allocateTradeIns(lines, tradeIns)
  const discount = allocation.reduce((s, a) => s + a.amount, 0)
  const afterDiscount = subtotal - discount
  const shipping = fulfilment === 'pickup' || lines.length === 0 || afterDiscount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  return { subtotal, allocation, discount, shipping, total: afterDiscount + shipping }
}

/** Pre-owned price from the original price and grade. */
export const preownedPrice = (original: number, grade: 'A' | 'B') => Math.round((original * (grade === 'A' ? 0.55 : 0.45)) / 10) * 10

export const baht = (n: number) => '฿' + n.toLocaleString('th-TH')
