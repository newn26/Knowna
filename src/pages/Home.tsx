import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, FileSignature, Lock, MessageSquare, Search, ShieldCheck } from 'lucide-react'
import { CATEGORIES, PROVINCES } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { featuredIds, useDB } from '../lib/store'
import { PUBLIC_STATUSES } from '../lib/search'
import { ListingCard } from '../components/ListingCard'
import { Icon } from '../components/ui'

export default function Home() {
  const { t, L } = usePrefs()
  const d = useDB()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [prov, setProv] = useState('')
  const pub = d.listings.filter((l) => (PUBLIC_STATUSES as readonly string[]).includes(l.status))
  const feat = featuredIds(d)
  const featured = pub.filter((l) => feat.has(l.id)).sort((a, b) => b.views - a.views).slice(0, 4)
  const latest = [...pub].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)).slice(0, 8)

  const go = () => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (cat) sp.set('category', cat)
    if (prov) sp.set('province', prov)
    nav('/search?' + sp.toString())
  }

  return (
    <>
      <section className="bg-gradient-to-br from-ink via-[#0b1a3d] to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{t('home.kicker')}</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">{t('home.title')}</h1>
          <p className="mt-4 max-w-2xl text-gray-300">{t('home.subtitle')}</p>
          <form
            onSubmit={(e) => { e.preventDefault(); go() }}
            className="mt-8 grid max-w-4xl gap-2 rounded-2xl bg-white p-2 text-gray-800 shadow-xl md:grid-cols-[1fr_200px_200px_auto]"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchName')} className="rounded-xl px-4 py-3 text-sm outline-none" />
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-xl border-l px-3 py-3 text-sm outline-none">
              <option value="">{t('search.allCategories')}</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
            <select value={prov} onChange={(e) => setProv(e.target.value)} className="rounded-xl border-l px-3 py-3 text-sm outline-none">
              <option value="">{t('search.allProvinces')}</option>
              {PROVINCES.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
            </select>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
              <Search size={18} /> {t('home.search')}
            </button>
          </form>
          <div className="mt-8 flex flex-wrap gap-8 text-sm text-gray-300">
            <span><b className="text-2xl text-white">{pub.length}</b> {t('home.statListings')}</span>
            <span><b className="text-2xl text-white">{CATEGORIES.length}</b> {t('home.statCategories')}</span>
            <span><b className="text-2xl text-white">3%</b> {t('home.statFee')}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-brand-500 bg-white p-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-500">{t('req.homeKicker')}</p>
            <h2 className="mt-1 text-xl font-bold">{t('req.homeTitle')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">{t('req.homeBody')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link to="/requests/new" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">{t('req.new')}</Link>
            <Link to="/requests" className="flex items-center gap-1 rounded-full border-2 border-brand-500 px-5 py-2 text-sm font-semibold text-brand-500 hover:bg-brand-50">{t('nav.requests')} <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">{t('home.categories')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map((c) => {
            const n = pub.filter((l) => l.category === c.id).length
            return (
              <Link key={c.id} to={`/search?category=${c.id}`} className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 text-center transition hover:border-brand-500 hover:shadow">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500"><Icon name={c.icon} size={22} /></span>
                <span className="text-sm font-semibold">{L(c.name)}</span>
                <span className="text-xs text-muted">{t('home.nListings', { n })}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">{t('home.featured')}</h2>
            <Link to="/search" className="flex items-center gap-1 text-sm font-semibold text-brand-500">{t('home.seeAll')} <ArrowRight size={16} /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((l) => <ListingCard key={l.id} l={l} featured />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">{t('home.latest')}</h2>
          <Link to="/search?sort=newest" className="flex items-center gap-1 text-sm font-semibold text-brand-500">{t('home.seeAll')} <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((l) => <ListingCard key={l.id} l={l} featured={feat.has(l.id)} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-bold">{t('home.how')}</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: <Search />, k: 'how1' },
            { icon: <Lock />, k: 'how2' },
            { icon: <MessageSquare />, k: 'how3' },
            { icon: <FileSignature />, k: 'how4' },
          ].map((s, i) => (
            <div key={s.k} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">{s.icon}</span>
                <span className="text-3xl font-bold text-gray-200">0{i + 1}</span>
              </div>
              <p className="font-semibold">{t(`home.${s.k}Title`)}</p>
              <p className="mt-1 text-sm text-gray-500">{t(`home.${s.k}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-500 p-8 text-white md:flex-row md:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-100"><ShieldCheck size={18} /> {t('home.ctaKicker')}</p>
            <h3 className="mt-2 text-2xl font-bold">{t('home.ctaTitle')}</h3>
            <p className="mt-1 text-brand-100">{t('home.ctaBody')}</p>
          </div>
          <Link to="/sell" className="rounded-full bg-white px-6 py-3 font-semibold text-brand-600 hover:bg-brand-50">{t('home.ctaButton')}</Link>
        </div>
      </section>
    </>
  )
}
