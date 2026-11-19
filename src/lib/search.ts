import type { Listing, SearchParams } from './types'

export const PUBLIC_STATUSES = ['published', 'under_offer'] as const

/** Price/revenue filters are given in THB; listings in USD are converted with the current rate. */
export function matches(l: Listing, p: SearchParams, usdThb: number): boolean {
  if (!PUBLIC_STATUSES.includes(l.status as (typeof PUBLIC_STATUSES)[number])) return false
  const k = l.currency === 'USD' ? usdThb : 1
  if (p.q) {
    const q = p.q.toLowerCase()
    if (!l.displayName.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q)) return false
  }
  if (p.category && l.category !== p.category) return false
  if (p.province && l.province !== p.province) return false
  if (p.minPrice != null && l.askingPrice * k < p.minPrice) return false
  if (p.maxPrice != null && l.askingPrice * k > p.maxPrice) return false
  if (p.minRevenue != null && l.annualRevenue * k < p.minRevenue) return false
  if (p.maxRevenue != null && l.annualRevenue * k > p.maxRevenue) return false
  if (p.minProfit != null && l.netProfit * k < p.minProfit) return false
  return true
}

export function sortListings(ls: Listing[], sort: SearchParams['sort'], usdThb: number, featuredIds: Set<string>) {
  const k = (l: Listing) => (l.currency === 'USD' ? usdThb : 1)
  const by: Record<string, (a: Listing, b: Listing) => number> = {
    newest: (a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0),
    price_asc: (a, b) => a.askingPrice * k(a) - b.askingPrice * k(b),
    price_desc: (a, b) => b.askingPrice * k(b) - a.askingPrice * k(a),
    revenue_desc: (a, b) => b.annualRevenue * k(b) - a.annualRevenue * k(a),
    profit_desc: (a, b) => b.netProfit * k(b) - a.netProfit * k(a),
  }
  const cmp = by[sort ?? 'newest']
  // featured listings float to the top within the chosen order
  return [...ls].sort((a, b) => Number(featuredIds.has(b.id)) - Number(featuredIds.has(a.id)) || cmp(a, b))
}

export function paramsFromQuery(sp: URLSearchParams): SearchParams {
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined)
  return {
    q: sp.get('q') || undefined,
    category: sp.get('category') || undefined,
    province: sp.get('province') || undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    minRevenue: num('minRevenue'),
    maxRevenue: num('maxRevenue'),
    minProfit: num('minProfit'),
    sort: (sp.get('sort') as SearchParams['sort']) || undefined,
  }
}

export function queryFromParams(p: SearchParams): string {
  const sp = new URLSearchParams()
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) sp.set(k, String(v))
  })
  return sp.toString()
}
