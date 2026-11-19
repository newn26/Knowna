import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator } from 'lucide-react'
import { CATEGORIES, catName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { useDB } from '../lib/store'
import { estimateValue, marketMultiple, type Estimate } from '../lib/valuation'
import { Page } from '../components/Layout'
import { Alert, Card, Field, Input, Select } from '../components/ui'

const noWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

export default function Valuation() {
  const { t, L, lang, money } = usePrefs()
  const d = useDB()
  const [f, setF] = useState({ category: 'food', profit: '', revenue: '', years: '5' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const profit = Number(f.profit)
  const revenue = Number(f.revenue)
  const est = estimateValue(f.category, profit, Number(f.years) || 0)
  const market = marketMultiple(d.listings, f.category)
  return (
    <Page className="max-w-4xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Calculator size={24} className="text-brand-500" /> {t('val.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('val.subtitle')}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1fr]">
        <Card className="space-y-4 p-6">
          <Field label={t('form.category')}>
            <Select value={f.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </Select>
          </Field>
          <Field label={t('val.profit') + ' *'} hint={t('val.profitHint')}><Input type="number" min={0} value={f.profit} onChange={set('profit')} onWheel={noWheel} /></Field>
          <Field label={t('val.revenue')}><Input type="number" min={0} value={f.revenue} onChange={set('revenue')} onWheel={noWheel} /></Field>
          <Field label={t('val.years')}><Input type="number" min={0} value={f.years} onChange={set('years')} onWheel={noWheel} /></Field>
        </Card>
        <Card className="p-6">
          {!est ? <p className="text-sm text-gray-500">{t('val.enterProfit')}</p> : (
            <>
              <ValueRange est={est} fmt={(v) => money(v, 'THB', { exact: true })} />
              <ul className="mt-5 space-y-2 text-sm text-gray-600">
                <li>{t('val.usedMultiple', { lo: est.multiple[0], hi: est.multiple[1], cat: catName(f.category, lang) })}</li>
                {revenue > 0 && <li>{t('val.margin', { m: Math.round((profit / revenue) * 100) })}</li>}
                {market && <li>{t('val.market', { m: market.median.toFixed(1), n: market.n })}</li>}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
                <Link to={`/search?category=${f.category}&minPrice=${est.low}&maxPrice=${est.high}`} className="rounded-full bg-brand-500 px-4 py-2 text-white hover:bg-brand-600">{t('val.findSimilar')}</Link>
                <Link to="/sell" className="rounded-full border-2 border-brand-500 px-4 py-1.5 text-brand-500 hover:bg-brand-50">{t('home.ctaButton')}</Link>
              </div>
            </>
          )}
        </Card>
      </div>
      <div className="mt-6"><Alert t="blue">{t('val.disclaimer')}</Alert></div>
    </Page>
  )
}

export function ValueRange({ est, fmt }: { est: Estimate; fmt: (v: number) => string }) {
  const { t } = usePrefs()
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted">{t('val.result')}</p>
      <p className="mt-1 text-3xl font-bold text-brand-600">{fmt(est.mid)}</p>
      <p className="mt-1 text-sm text-gray-600">{t('val.range')} {fmt(est.low)} – {fmt(est.high)}</p>
    </div>
  )
}
