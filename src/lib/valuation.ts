import type { Listing } from './types'
import { PUBLIC_STATUSES } from './search'

/**
 * Rough profit multiples (price ÷ annual net profit) for Thai SMEs, by category.
 * shortcut: fixed demo assumptions, not market data — replace with real deal comps if this goes live.
 */
const MULTIPLES: Record<string, [low: number, high: number]> = {
  food: [2, 3],
  retail: [2, 3.5],
  ecommerce: [2.5, 4],
  service: [2.5, 4],
  manufacturing: [3, 5],
  franchise: [2, 3],
  beauty: [2, 3],
  education: [2.5, 3.5],
  tech: [3, 6],
  other: [2, 3],
}

export interface Estimate {
  low: number
  mid: number
  high: number
  multiple: [number, number]
}

/** Value range (same currency as profit) from annual net profit; young businesses get a lower multiple, long-running ones a higher one. */
export function estimateValue(category: string, profit: number, years: number): Estimate | null {
  if (!(profit > 0)) return null
  const [lo, hi] = MULTIPLES[category] ?? MULTIPLES.other
  const adj = years < 3 ? -0.5 : years >= 10 ? 0.5 : 0
  const m: [number, number] = [Math.max(1, lo + adj), Math.max(1.5, hi + adj)]
  const low = Math.round(profit * m[0])
  const high = Math.round(profit * m[1])
  return { low, high, mid: Math.round((low + high) / 2), multiple: m }
}

/** Median asking-price ÷ profit of live listings in a category, as a market benchmark. */
export function marketMultiple(listings: Listing[], category: string): { median: number; n: number } | null {
  const xs = listings
    .filter((l) => (PUBLIC_STATUSES as readonly string[]).includes(l.status) && l.category === category && l.netProfit > 0)
    .map((l) => l.askingPrice / l.netProfit) // same currency on both sides, so no FX needed
    .sort((a, b) => a - b)
  if (!xs.length) return null
  const mid = Math.floor(xs.length / 2)
  return { median: xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2, n: xs.length }
}
