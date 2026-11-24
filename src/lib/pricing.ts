import { FREE_SHIPPING_FROM, SHIPPING_FEE } from './catalog'
import type { CartLine, Fulfilment } from './types'

export function totals(lines: CartLine[], fulfilment: Fulfilment = 'delivery') {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const shipping = fulfilment === 'pickup' || lines.length === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  return { subtotal, shipping, total: subtotal + shipping }
}

export const baht = (n: number) => '฿' + n.toLocaleString('th-TH')
