import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellPlus, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES, PROVINCES } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { alerts, featuredIds, sponsoredIds, useDB, useMe } from '../lib/store'
import { matches, paramsFromQuery, queryFromParams, sortListings } from '../lib/search'
import type { SearchParams } from '../lib/types'
import { ListingCard } from '../components/ListingCard'
import { Page } from '../components/Layout'
import { Button, Empty, Field, Input, Select, useErrorText } from '../components/ui'
import { cls } from '../lib/utils'

export default function Search() {
  const { t, L, currency } = usePrefs()
  const d = useDB()
  const me = useMe()
  const [sp, setSp] = useSearchParams()
  const p = paramsFromQuery(sp)
  const [showFilters, setShowFilters] = useState(false)
  const [reset, setReset] = useState(0)
  const [msg, setMsg] = useState('')
  const err = useErrorText()

  // Filter inputs are typed in the viewer's display currency; convert to THB for matching.
  const k = currency === 'USD' ? d.fx.usdThb : 1
  const toThb = (v?: number) => (v == null ? undefined : v * k)
  const fromThb = (v?: number) => (v == null ? '' : String(Math.round(v / k)))

  const set = (patch: Partial<SearchParams>) => setSp(queryFromParams({ ...p, ...patch }))
  const setNum = (key: keyof SearchParams) => (v: string) =>
    set({ [key]: v === '' ? undefined : toThb(Number(v)) } as Partial<SearchParams>)

  const feat = featuredIds(d)
  const results = useMemo(
    () => {
      const spons = sponsoredIds(d)
      // sponsored (paid) listings that match the filters are shown first
      return sortListings(d.listings.filter((l) => matches(l, p, d.fx.usdThb)), p.sort, d.fx.usdThb, feat).sort((a, b) => Number(spons.has(b.id)) - Number(spons.has(a.id)))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, sp.toString()],
  )

  const saveSearch = () => {
    try {
      alerts.save(p)
      setMsg(t('search.saved'))
    } catch (e) {
      setMsg(err(e))
    }
  }

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('search.title')}</h1>
          <p className="text-sm text-gray-500">{t('search.count', { n: results.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={14} /> {t('search.filters')}</Button>
          {me && <Button variant="outline" size="sm" onClick={saveSearch}><BellPlus size={14} /> {t('search.saveAlert')}</Button>}
          <Select value={p.sort ?? 'newest'} onChange={(e) => set({ sort: e.target.value as SearchParams['sort'] })} className="w-auto">
            {(['newest', 'price_asc', 'price_desc', 'revenue_desc', 'profit_desc'] as const).map((s) => <option key={s} value={s}>{t('sort.' + s)}</option>)}
          </Select>
        </div>
      </div>
      {msg && <p className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">{msg}</p>}
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className={cls('h-fit space-y-4 rounded-xl border border-gray-200 bg-white p-5 md:block', !showFilters && 'hidden')}>
          <Field label={t('search.name')}>
            <Input value={p.q ?? ''} onChange={(e) => set({ q: e.target.value || undefined })} placeholder={t('search.namePh')} />
          </Field>
          <Field label={t('search.category')}>
            <Select value={p.category ?? ''} onChange={(e) => set({ category: e.target.value || undefined })}>
              <option value="">{t('search.allCategories')}</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </Select>
          </Field>
          <Field label={t('search.province')}>
            <Select value={p.province ?? ''} onChange={(e) => set({ province: e.target.value || undefined })}>
              <option value="">{t('search.allProvinces')}</option>
              {PROVINCES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </Select>
          </Field>
          <Field label={`${t('search.price')} (${currency})`}>
            <div className="flex gap-2">
              <NumFilter key={currency + 'minPrice'} clear={reset} placeholder={t('search.min')} value={fromThb(p.minPrice)} onCommit={setNum('minPrice')} />
              <NumFilter key={currency + 'maxPrice'} clear={reset} placeholder={t('search.max')} value={fromThb(p.maxPrice)} onCommit={setNum('maxPrice')} />
            </div>
          </Field>
          <Field label={`${t('search.revenue')} (${currency})`}>
            <div className="flex gap-2">
              <NumFilter key={currency + 'minRevenue'} clear={reset} placeholder={t('search.min')} value={fromThb(p.minRevenue)} onCommit={setNum('minRevenue')} />
              <NumFilter key={currency + 'maxRevenue'} clear={reset} placeholder={t('search.max')} value={fromThb(p.maxRevenue)} onCommit={setNum('maxRevenue')} />
            </div>
          </Field>
          <Field label={`${t('search.minProfit')} (${currency})`}>
            <NumFilter key={currency + 'minProfit'} clear={reset} placeholder={t('search.min')} value={fromThb(p.minProfit)} onCommit={setNum('minProfit')} />
          </Field>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSp(''); setReset((n) => n + 1) }}>{t('search.clear')}</Button>
        </aside>
        <div>
          {results.length === 0 ? (
            <Empty icon="Search" title={t('search.empty')}>{t('search.emptyHint')}</Empty>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => <ListingCard key={l.id} l={l} featured={feat.has(l.id)} />)}
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}

/**
 * Number filter that keeps what the user types locally. Driving the input straight from the URL
 * dropped digits when typing fast (the URL update lags behind keystrokes).
 * The parent remounts it (via `key`) when the currency changes, and bumps `clear` to empty it.
 */
function NumFilter({ value, onCommit, placeholder, clear }: { value: string; onCommit: (v: string) => void; placeholder: string; clear: number }) {
  const [draft, setDraft] = useState(value)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) first.current = false
    else setDraft('')
  }, [clear])
  return (
    <Input
      type="number"
      min={0}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => { setDraft(e.target.value); onCommit(e.target.value) }}
      onWheel={(e) => e.currentTarget.blur()}
    />
  )
}
