import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellPlus, SlidersHorizontal, X } from 'lucide-react'
import { CATEGORIES, catName, PROVINCES, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { alerts, featuredIds, sponsoredIds, useDB, useMe } from '../lib/store'
import { matches, paramsFromQuery, queryFromParams, sortListings } from '../lib/search'
import type { SearchParams } from '../lib/types'
import { ListingCard } from '../components/ListingCard'
import { Page } from '../components/Layout'
import { Button, Empty, Field, Input, Select, toast, useErrorText } from '../components/ui'
import { cls } from '../lib/utils'

export default function Search() {
  const { t, L, currency, lang, money } = usePrefs()
  const d = useDB()
  const me = useMe()
  const [sp, setSp] = useSearchParams()
  const p = paramsFromQuery(sp)
  const [showFilters, setShowFilters] = useState(false)
  const [reset, setReset] = useState(0)
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
      toast(t('search.saved'))
    } catch (e) {
      toast(err(e), 'error')
    }
  }
  const clearAll = () => { setSp(''); setReset((n) => n + 1) }
  const badRange = p.minPrice != null && p.maxPrice != null && p.minPrice > p.maxPrice

  // one removable chip per active filter (sort is an ordering, not a filter)
  const fmt = (v: number) => money(v, 'THB', { compact: true })
  const chips: { label: string; clear: Partial<SearchParams> }[] = []
  if (p.q) chips.push({ label: `“${p.q}”`, clear: { q: undefined } })
  if (p.category) chips.push({ label: catName(p.category, lang), clear: { category: undefined } })
  if (p.province) chips.push({ label: provName(p.province, lang), clear: { province: undefined } })
  if (p.minPrice != null || p.maxPrice != null) chips.push({ label: `${t('search.price')}: ${p.minPrice != null ? fmt(p.minPrice) : '0'} – ${p.maxPrice != null ? fmt(p.maxPrice) : '∞'}`, clear: { minPrice: undefined, maxPrice: undefined } })
  if (p.minRevenue != null || p.maxRevenue != null) chips.push({ label: `${t('search.revenue')}: ${p.minRevenue != null ? fmt(p.minRevenue) : '0'} – ${p.maxRevenue != null ? fmt(p.maxRevenue) : '∞'}`, clear: { minRevenue: undefined, maxRevenue: undefined } })
  if (p.minProfit != null) chips.push({ label: t('search.profitChip', { v: fmt(p.minProfit) }), clear: { minProfit: undefined } })
  const removeChip = (clear: Partial<SearchParams>) => { set(clear); setReset((n) => n + 1) }

  // mobile sheet: lock page scroll, close on Escape, focus the sheet when it opens
  const sheet = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!showFilters) return
    const mobile = window.matchMedia('(max-width: 767px)').matches
    if (!mobile) return
    document.body.style.overflow = 'hidden'
    sheet.current?.focus()
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setShowFilters(false)
    window.addEventListener('keydown', h)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h) }
  }, [showFilters])

  return (
    <Page>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">{t('search.title')}</h1>
          <p className="mt-1 text-sm text-gray-500" aria-live="polite">{t('search.count', { n: results.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="min-h-[40px] md:hidden" onClick={() => setShowFilters(true)} aria-expanded={showFilters}>
            <SlidersHorizontal size={14} /> {t('search.filters')}{chips.length > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] text-white">{chips.length}</span>}
          </Button>
          {me && <Button variant="outline" size="sm" className="min-h-[40px]" onClick={saveSearch}><BellPlus size={14} /> {t('search.saveAlert')}</Button>}
          <label className="flex items-center">
            <span className="sr-only">Sort</span>
            <Select value={p.sort ?? 'newest'} onChange={(e) => set({ sort: e.target.value as SearchParams['sort'] })} className="w-auto">
              {(['newest', 'price_asc', 'price_desc', 'revenue_desc', 'profit_desc'] as const).map((s) => <option key={s} value={s}>{t('sort.' + s)}</option>)}
            </Select>
          </label>
        </div>
      </div>
      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label={t('search.activeFilters')}>
          {chips.map((c) => (
            <button key={c.label} onClick={() => removeChip(c.clear)} aria-label={t('search.removeFilter', { f: c.label })} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 pl-3 pr-2 text-xs font-semibold text-brand-700 transition hover:border-brand-500">
              {c.label} <X size={14} />
            </button>
          ))}
          <button onClick={clearAll} className="min-h-[36px] px-2 text-xs font-semibold text-gray-500 underline-offset-4 hover:text-navy hover:underline">{t('search.clearAll')}</button>
        </div>
      )}
      {showFilters && <div className="fixed inset-0 z-50 bg-navy/50 md:hidden" onClick={() => setShowFilters(false)} aria-hidden="true" />}
      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          ref={sheet}
          tabIndex={-1}
          aria-label={t('search.filters')}
          className={cls(
            'space-y-4 bg-white outline-none md:sticky md:top-24 md:block md:h-fit md:rounded-2xl md:border md:border-gray-200 md:p-5',
            showFilters ? 'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] animate-sheet overflow-y-auto rounded-t-3xl px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-lift md:static md:z-auto md:max-h-none md:animate-none md:overflow-visible md:shadow-none' : 'hidden',
          )}
        >
          <div className="flex items-center justify-between md:hidden">
            <span className="mx-auto mb-1 h-1 w-10 rounded-full bg-gray-300" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between md:hidden">
            <p className="text-lg font-bold text-navy">{t('search.filters')}</p>
            <button onClick={() => setShowFilters(false)} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100" aria-label="close"><X size={20} /></button>
          </div>
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
            {badRange && <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">{t('search.badRange')}</span>}
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
          <Button variant="ghost" size="sm" className="hidden w-full md:flex" onClick={clearAll}>{t('search.clear')}</Button>
          <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-gray-200 bg-white px-5 pt-3 md:hidden">
            <Button variant="outline" className="min-h-[48px] flex-1" onClick={clearAll}>{t('search.reset')}</Button>
            <Button className="min-h-[48px] flex-[2]" onClick={() => setShowFilters(false)}>{t('search.showN', { n: results.length })}</Button>
          </div>
        </aside>
        <div>
          {results.length === 0 ? (
            <Empty icon="Search" title={t('search.empty')}>
              {t('search.emptyHint')}
              {chips.length > 0 && <div className="mt-4"><Button variant="outline" size="sm" onClick={clearAll}>{t('search.clearAll')}</Button></div>}
            </Empty>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
