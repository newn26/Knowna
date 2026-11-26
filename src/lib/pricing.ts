import type { CartLine } from './types'

/** The price already includes shipping (report 4.1.2), so there is no shipping line to add. */
export function totals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  return { subtotal, shipping: 0, total: subtotal }
}

export const baht = (n: number) => '฿' + n.toLocaleString('th-TH')
