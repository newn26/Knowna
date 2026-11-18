import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BellPlus, SlidersHorizontal } from 'lucide-react'
import { CATEGORIES, PROVINCES } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { alerts, featuredIds, useDB, useMe } from '../lib/store'
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
  const [msg, setMsg] = useState('')
  const err = useErrorText()

  // Filter inputs are typed in the viewer's display currency; convert to THB for matching.
  const k = currency === 'USD' ? d.fx.usdThb : 1
  const toThb = (v?: number) => (v == null ? undefined : v * k)
  const fromThb = (v?: number) => (v == null ? '' : String(Math.round(v / k)))

  const set = (patch: Partial<SearchParams>) => setSp(queryFromParams({ ...p, ...patch }))
  const setNum = (key: keyof SearchParams) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set({ [key]: e.target.value === '' ? undefined : toThb(Number(e.target.value)) } as Partial<SearchParams>)

  const feat = featuredIds(d)
  const results = useMemo(
    () => sortListings(d.listings.filter((l) => matches(l, p, d.fx.usdThb)), p.sort, d.fx.usdThb, feat),
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
            {(['newest', 'price_asc', 'price_desc', 'revenue_desc'] as const).map((s) => <option key={s} value={s}>{t('sort.' + s)}</option>)}
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
              <Input type="number" min={0} placeholder={t('search.min')} value={fromThb(p.minPrice)} onChange={setNum('minPrice')} />
              <Input type="number" min={0} placeholder={t('search.max')} value={fromThb(p.maxPrice)} onChange={setNum('maxPrice')} />
            </div>
          </Field>
          <Field label={`${t('search.revenue')} (${currency})`}>
            <div className="flex gap-2">
              <Input type="number" min={0} placeholder={t('search.min')} value={fromThb(p.minRevenue)} onChange={setNum('minRevenue')} />
              <Input type="number" min={0} placeholder={t('search.max')} value={fromThb(p.maxRevenue)} onChange={setNum('maxRevenue')} />
            </div>
          </Field>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setSp('')}>{t('search.clear')}</Button>
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
