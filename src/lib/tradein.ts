// Trade-in rules. Pure functions, no storage, so they are easy to test and to
// move to the server later (the server must re-run them; never trust the client).
import type { CartLine, CheckAnswer, Grade, TradeIn } from './types'

export const MIN_CONDITION = 75

/** Discount rate for a condition score. Below 75% the pair is not accepted. */
export function rateFor(conditionPct: number): number {
  if (conditionPct >= 90) return 0.15
  if (conditionPct >= MIN_CONDITION) return 0.1
  return 0
}

export function gradeFor(conditionPct: number): Grade {
  if (conditionPct >= 90) return 'A'
  if (conditionPct >= MIN_CONDITION) return 'B'
  return 'C'
}

export const CONDITION_LEVELS = [
  { label: 'เหมือนใหม่', score: 100 },
  { label: 'มีรอยเล็กน้อย', score: 88 },
  { label: 'สึกตามการใช้งาน', score: 72 },
  { label: 'ชำรุด', score: 35 },
] as const

/** What the customer rates and how much each part weighs in the final score. */
export const CHECKLIST = [
  { id: 'upper', label: 'หนังด้านบน', help: 'รอยถลอก รอยย่น สีลอก', weight: 30 },
  { id: 'sole', label: 'พื้นรองเท้า', help: 'ความสึกของดอกยาง พื้นหลุด/อ้า', weight: 30 },
  { id: 'insole', label: 'แผ่นรองด้านใน', help: 'ยุบ ขาด มีกลิ่นติดแน่น', weight: 15 },
  { id: 'stitch', label: 'ตะเข็บและทรง', help: 'ด้ายขาด ทรงเบี้ยว ส้นยุบ', weight: 15 },
  { id: 'laces', label: 'เชือกและรูร้อย', help: 'รูร้อยหลุด เชือกขาด', weight: 10 },
] as const

export type ChecklistId = (typeof CHECKLIST)[number]['id']

/** Weighted condition score, 0–100. Any part marked "ชำรุด" caps the pair at 70% (not accepted). */
export function scoreCondition(answers: Record<string, CheckAnswer>): number {
  let total = 0
  let weights = 0
  let broken = false
  for (const c of CHECKLIST) {
    const a = answers[c.id]
    if (a === undefined) continue
    total += CONDITION_LEVELS[a].score * c.weight
    weights += c.weight
    if (a === 3) broken = true
  }
  if (!weights) return 0
  const pct = Math.round(total / weights)
  return broken ? Math.min(pct, 70) : pct
}

export interface DiscountLine {
  tradeInId: string
  serial: string
  rate: number
  appliedTo: string | null // cart line key, null when there is no new pair left to apply it to
  amount: number
}

/**
 * Match trade-ins to new pairs in the cart. One trade-in discounts one new pair,
 * pre-owned pairs are not eligible, and the best rate goes on the most expensive pair.
 */
export function allocateTradeIns(lines: CartLine[], tradeIns: TradeIn[]): DiscountLine[] {
  const slots: { key: string; price: number }[] = []
  for (const l of lines) if (l.kind === 'new') for (let i = 0; i < l.qty; i++) slots.push({ key: l.key, price: l.unitPrice })
  slots.sort((a, b) => b.price - a.price)
  const accepted = tradeIns.filter((t) => t.rate > 0).sort((a, b) => b.rate - a.rate)
  return accepted.map((t, i) => {
    const slot = slots[i]
    return {
      tradeInId: t.id,
      serial: t.serial,
      rate: t.rate,
      appliedTo: slot ? slot.key : null,
      amount: slot ? Math.round(slot.price * t.rate) : 0,
    }
  })
}

export const newPairsIn = (lines: CartLine[]) => lines.filter((l) => l.kind === 'new').reduce((n, l) => n + l.qty, 0)
