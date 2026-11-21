import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, FileText, Flag, Lock, MapPin, MessagesSquare, Search, ShieldCheck } from 'lucide-react'
import { CATEGORIES, catName, PROVINCES, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { featuredIds, sponsoredIds, useDB } from '../lib/store'
import { PUBLIC_STATUSES } from '../lib/search'
import { ListingCard } from '../components/ListingCard'
import { Icon, Img } from '../components/ui'
import { cls } from '../lib/utils'

// categories whose stock photos read clearly as "a business" at hero size
const HERO_CATS = ['service', 'food', 'tech', 'manufacturing', 'education']

export default function Home() {
  const { t, L, lang, money } = usePrefs()
  const d = useDB()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [prov, setProv] = useState('')
  const [side, setSide] = useState<'buyer' | 'seller'>('buyer')
  const pub = d.listings.filter((l) => (PUBLIC_STATUSES as readonly string[]).includes(l.status))
  const feat = featuredIds(d)
  const spons = sponsoredIds(d)
  // paid promotions (advertising) first, then plan-featured listings
  const promoted = pub.filter((l) => spons.has(l.id) || feat.has(l.id)).sort((a, b) => Number(spons.has(b.id)) - Number(spons.has(a.id)) || b.views - a.views)
  // top up with the most-viewed listings so the row is always full
  const ranked = [...promoted, ...pub.filter((l) => !promoted.includes(l)).sort((a, b) => b.views - a.views)]
  const featured = ranked.slice(0, 3)
  const latest = [...pub].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)).slice(0, 6)
  // hero rotation pool: top 5 real listings, hero-friendly categories first
  const pool = [...ranked.slice(0, 5)].sort((a, b) => Number(HERO_CATS.includes(b.category)) - Number(HERO_CATS.includes(a.category)))
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const [paused, setPaused] = useState(false)
  const showcase = pool[idx % Math.max(pool.length, 1)]
  const showcaseSeller = showcase && d.users.find((u) => u.id === showcase.sellerId)

  useEffect(() => {
    if (paused || pool.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let swap: number
    const tick = window.setInterval(() => {
      setFading(true) // fade out 200ms, then swap content and slide it in
      swap = window.setTimeout(() => { setIdx((i) => i + 1); setFading(false) }, 200)
    }, 5000)
    return () => { clearInterval(tick); clearTimeout(swap); setFading(false) }
  }, [paused, pool.length])

  const go = () => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (cat) sp.set('category', cat)
    if (prov) sp.set('province', prov)
    nav('/search?' + sp.toString())
  }

  const steps = side === 'buyer'
    ? [{ icon: Search, k: 'b1' }, { icon: Lock, k: 'b2' }, { icon: MessagesSquare, k: 'b3' }]
    : [{ icon: FileText, k: 's1' }, { icon: ShieldCheck, k: 's2' }, { icon: BadgeCheck, k: 's3' }]

  return (
    <>
      {/* 1. Hero + search: the search box is the focal point */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-50 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div className="animate-rise">
            <h1 className="whitespace-pre-line text-[2.4rem] font-bold leading-[1.15] tracking-tight text-navy [text-wrap:balance] md:text-6xl">
              {t('hero.title')}<span className="text-brand-400">.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">{t('home.subtitle')}</p>
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); go() }}
              className="mt-8 rounded-3xl border border-gray-200 bg-white p-2.5 shadow-lift transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-400/15"
            >
              <label className="flex items-center gap-3 rounded-2xl px-4">
                <Search size={22} className="shrink-0 text-brand-500" />
                <span className="sr-only">{t('home.searchName')}</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchName')} className="min-h-[56px] w-full bg-transparent text-base outline-none placeholder:text-gray-500" />
              </label>
              <div className="grid gap-2 border-t border-gray-100 pt-2.5 sm:grid-cols-[1fr_1fr_auto]">
                <label>
                  <span className="sr-only">{t('search.category')}</span>
                  <select value={cat} onChange={(e) => setCat(e.target.value)} className="min-h-[48px] w-full rounded-xl bg-surface px-3 text-sm text-gray-700 outline-none hover:bg-gray-100">
                    <option value="">{t('search.allCategories')}</option>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
                  </select>
                </label>
                <label>
                  <span className="sr-only">{t('search.province')}</span>
                  <select value={prov} onChange={(e) => setProv(e.target.value)} className="min-h-[48px] w-full rounded-xl bg-surface px-3 text-sm text-gray-700 outline-none hover:bg-gray-100">
                    <option value="">{t('search.allProvinces')}</option>
                    {PROVINCES.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
                  </select>
                </label>
                <button className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98]">
                  <Search size={18} /> {t('home.search')}
                </button>
              </div>
            </form>
            <p className="mt-4 text-sm text-gray-600">{t('hero.facts', { n: pub.length, c: CATEGORIES.length })}</p>
          </div>

          <div
              className="relative mx-auto hidden w-full max-w-md md:block lg:max-w-none"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              <div className="overflow-hidden rounded-[2rem] rounded-tl-[6rem] bg-surface shadow-lift" aria-hidden="true">
                {showcase && (
                  <div key={showcase.id} className={cls('transition-opacity duration-200', fading ? 'opacity-0' : 'animate-swap')}>
                    <Img src={showcase.coverImages[0]} alt="" className="aspect-[10/11] w-full" />
                  </div>
                )}
                {!showcase &&<div className="aspect-[10/11] w-full" />}
              </div>
              <div className="absolute -left-6 bottom-8 w-64 animate-float lg:-left-12 lg:w-72">
                {showcase ? (
                  <Link
                    key={showcase.id}
                    to={`/listing/${showcase.id}`}
                    aria-label={showcase.displayName}
                    className={cls('block rounded-2xl border border-gray-200 bg-white p-4 shadow-lift transition-opacity duration-200', fading ? 'opacity-0' : 'animate-swap')}
                  >
                    <p className="text-xs font-medium text-brand-500">{catName(showcase.category, lang)}</p>
                    <p className="mt-1 line-clamp-1 font-semibold text-navy">{showcase.displayName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-600"><MapPin size={12} /> {provName(showcase.province, lang)}
                      {showcaseSeller?.sellerVerified && <span className="ml-2 inline-flex items-center gap-1 text-brand-600"><BadgeCheck size={12} /> {t('card.verified')}</span>}
                    </p>
                    <p className="tabular mt-3 text-xl font-bold text-navy">{money(showcase.askingPrice, showcase.currency)}</p>
                  </Link>
                ) : (
                  <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-lift">{t('hero.empty')}</p>
                )}
              </div>
          </div>
        </div>
      </section>

      {/* 2. How it works + safety: the trust story comes before any listing */}
      <section className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
        <div className="grid gap-8 rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-card md:p-10 lg:grid-cols-[1fr_340px] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">{t('trust.title')}</h2>
              <div role="tablist" aria-label={t('trust.title')} className="flex rounded-full bg-surface p-1">
                {(['buyer', 'seller'] as const).map((s) => (
                  <button key={s} role="tab" aria-selected={side === s} onClick={() => setSide(s)} className={cls('min-h-[44px] rounded-full px-5 text-sm font-semibold transition', side === s ? 'bg-navy text-white shadow-card' : 'text-gray-600 hover:text-navy')}>
                    {t('trust.' + s)}
                  </button>
                ))}
              </div>
            </div>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {steps.map((s, i) => (
                <li key={side + s.k} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500"><s.icon size={24} /></span>
                    {i < steps.length - 1 && <span className="hidden h-0.5 flex-1 rounded-full bg-gray-200 sm:block" aria-hidden="true" />}
                  </div>
                  <p className="mt-5 text-lg font-semibold text-navy"><span className="tabular text-brand-500">{i + 1}.</span> {t(`trust.${s.k}t`)}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{t(`trust.${s.k}b`)}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-2xl bg-surface p-6 md:p-7">
            <p className="flex items-center gap-2.5 text-lg font-semibold text-navy"><ShieldCheck size={22} className="text-brand-500" /> {t('safety.title')}</p>
            <ul className="mt-5 space-y-4 text-[15px] leading-relaxed text-gray-600">
              {[MessagesSquare, Lock, Flag].map((I, i) => (
                <li key={i} className="flex gap-3"><I size={19} className="mt-0.5 shrink-0 text-gray-400" /> {t(`safety.${i + 1}`)}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* 3. Sell banner, with the buyer-request pitch beside it */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pt-12 md:pt-16 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-navy text-white">
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-6 p-8 md:grid-cols-[1fr_auto] md:p-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t('home.ctaTitle')}</h2>
              <p className="mt-2 max-w-lg text-gray-300">{t('home.ctaBody')}</p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-200">
                {['sellCta.p1', 'sellCta.p2', 'sellCta.p3'].map((k) => (
                  <li key={k} className="flex items-center gap-2"><BadgeCheck size={16} className="text-brand-400" /> {t(k)}</li>
                ))}
              </ul>
            </div>
            <Link to="/sell" className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-400 px-8 font-semibold text-navy shadow-lift transition hover:bg-[#34d399] active:scale-[0.98]">{t('home.ctaButton')} <ArrowRight size={18} /></Link>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-5 rounded-3xl border border-gray-200 bg-white p-8">
          <div>
            <h2 className="text-lg font-bold text-navy">{t('req.homeTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('req.homeBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/requests/new" className="flex min-h-[44px] items-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600">{t('req.new')}</Link>
            <Link to="/requests" className="flex min-h-[44px] items-center gap-1 rounded-full border border-gray-300 px-5 text-sm font-semibold text-navy transition hover:border-navy">{t('nav.requests')} <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* 4. Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-navy">{t('home.categories')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const n = pub.filter((l) => l.category === c.id).length
            return (
              <Link key={c.id} to={`/search?category=${c.id}`} className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white"><Icon name={c.icon} size={19} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{L(c.name)}</span>
                  <span className="block text-xs text-gray-600">{t('home.nListings', { n })}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 5–6. Listings */}
      <ListingRow title={t('home.featured')} to="/search" items={featured.map((l) => <ListingCard key={l.id} l={l} featured={promoted.includes(l)} />)} seeAll={t('home.seeAll')} />
      <ListingRow title={t('home.latest')} to="/search?sort=newest" items={latest.map((l) => <ListingCard key={l.id} l={l} featured={feat.has(l.id)} />)} seeAll={t('home.seeAll')} />
    </>
  )
}

function ListingRow({ title, to, items, seeAll }: { title: string; to: string; items: JSX.Element[]; seeAll: string }) {
  if (!items.length) return null
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 md:pt-16">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-navy">{title}</h2>
        <Link to={to} className="group flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand-500">{seeAll} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items}</div>
    </section>
  )
}
