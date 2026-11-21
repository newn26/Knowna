import { useState } from 'react'
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
  const featured = [...promoted, ...pub.filter((l) => !promoted.includes(l)).sort((a, b) => b.views - a.views)].slice(0, 3)
  const latest = [...pub].sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)).slice(0, 6)
  const showcase = featured.find((l) => HERO_CATS.includes(l.category)) ?? featured[0]
  const showcaseSeller = showcase && d.users.find((u) => u.id === showcase.sellerId)

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
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise">
            <h1 className="whitespace-pre-line text-4xl font-bold leading-[1.2] tracking-tight text-navy [text-wrap:balance] md:text-[3.4rem]">{t('hero.title')}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">{t('home.subtitle')}</p>
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); go() }}
              className="mt-8 grid gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-lift sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto]"
            >
              <label className="sm:col-span-2 xl:col-span-1">
                <span className="sr-only">{t('home.searchName')}</span>
                <span className="flex items-center gap-2 rounded-xl px-3 focus-within:bg-surface">
                  <Search size={18} className="shrink-0 text-gray-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchName')} className="min-h-[48px] w-full bg-transparent text-sm outline-none placeholder:text-gray-500" />
                </span>
              </label>
              <label>
                <span className="sr-only">{t('search.category')}</span>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className="min-h-[48px] w-full rounded-xl border-gray-200 bg-transparent px-3 text-sm outline-none hover:bg-surface xl:border-l">
                  <option value="">{t('search.allCategories')}</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">{t('search.province')}</span>
                <select value={prov} onChange={(e) => setProv(e.target.value)} className="min-h-[48px] w-full rounded-xl border-gray-200 bg-transparent px-3 text-sm outline-none hover:bg-surface xl:border-l">
                  <option value="">{t('search.allProvinces')}</option>
                  {PROVINCES.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
                </select>
              </label>
              <button className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98] sm:col-span-2 xl:col-span-1">
                <Search size={18} /> {t('home.search')}
              </button>
            </form>
            <p className="mt-5 text-sm text-gray-500">{t('hero.facts', { n: pub.length, c: CATEGORIES.length })}</p>
          </div>

          {showcase && (
            <div className="relative hidden lg:block" aria-hidden="true">
              <div className="overflow-hidden rounded-[2rem] rounded-tl-[6rem] shadow-lift">
                <Img src={showcase.coverImages[0]} alt="" className="aspect-[4/5] w-full" />
              </div>
              <Link
                to={`/listing/${showcase.id}`}
                tabIndex={-1}
                className="absolute -left-10 bottom-10 w-72 animate-rise rounded-2xl border border-gray-200 bg-white p-4 shadow-lift [animation-delay:150ms]"
              >
                <p className="text-xs font-medium text-brand-500">{catName(showcase.category, lang)}</p>
                <p className="mt-1 line-clamp-1 font-semibold text-navy">{showcase.displayName}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {provName(showcase.province, lang)}
                  {showcaseSeller?.sellerVerified && <span className="ml-2 inline-flex items-center gap-1 text-brand-600"><BadgeCheck size={12} /> {t('card.verified')}</span>}
                </p>
                <p className="tabular mt-3 text-xl font-bold text-navy">{money(showcase.askingPrice, showcase.currency)}</p>
              </Link>
              <div className="absolute -right-4 top-10 w-60 animate-rise rounded-2xl bg-navy p-4 text-white shadow-lift [animation-delay:300ms]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400/20 text-brand-400"><Lock size={18} /></span>
                <p className="mt-3 text-sm font-semibold">{t('hero.ndaTitle')}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-300">{t('hero.ndaBody')}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy p-7 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold">{t('req.homeTitle')}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-gray-300">{t('req.homeBody')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/requests/new" className="flex min-h-[44px] items-center rounded-full bg-brand-400 px-5 text-sm font-semibold text-navy transition hover:bg-[#34d399]">{t('req.new')}</Link>
            <Link to="/requests" className="flex min-h-[44px] items-center gap-1 rounded-full border border-white/25 px-5 text-sm font-semibold transition hover:bg-white/10">{t('nav.requests')} <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 pt-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-navy">{t('home.categories')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => {
            const n = pub.filter((l) => l.category === c.id).length
            return (
              <Link key={c.id} to={`/search?category=${c.id}`} className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-brand-400 hover:shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white"><Icon name={c.icon} size={19} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{L(c.name)}</span>
                  <span className="block text-xs text-muted">{t('home.nListings', { n })}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <ListingRow title={t('home.featured')} to="/search" items={featured.map((l) => <ListingCard key={l.id} l={l} featured={promoted.includes(l)} />)} seeAll={t('home.seeAll')} />
      <ListingRow title={t('home.latest')} to="/search?sort=newest" items={latest.map((l) => <ListingCard key={l.id} l={l} featured={feat.has(l.id)} />)} seeAll={t('home.seeAll')} />

      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 rounded-3xl border border-gray-200 bg-white p-6 md:p-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-navy">{t('trust.title')}</h2>
              <div role="tablist" className="flex rounded-full bg-surface p-1">
                {(['buyer', 'seller'] as const).map((s) => (
                  <button key={s} role="tab" aria-selected={side === s} onClick={() => setSide(s)} className={cls('min-h-[40px] rounded-full px-4 text-sm font-semibold transition', side === s ? 'bg-navy text-white shadow-card' : 'text-gray-600 hover:text-navy')}>
                    {t('trust.' + s)}
                  </button>
                ))}
              </div>
            </div>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.k} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                      <s.icon size={18} />
                    </span>
                    {i < steps.length - 1 && <span className="hidden h-px flex-1 bg-gray-200 md:block" />}
                  </div>
                  <p className="mt-4 font-semibold text-navy"><span className="tabular text-brand-500">{i + 1}.</span> {t(`trust.${s.k}t`)}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{t(`trust.${s.k}b`)}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-2xl bg-surface p-6">
            <p className="flex items-center gap-2 font-semibold text-navy"><ShieldCheck size={18} className="text-brand-500" /> {t('safety.title')}</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-gray-600">
              {[MessagesSquare, Lock, Flag].map((I, i) => (
                <li key={i} className="flex gap-2.5"><I size={16} className="mt-0.5 shrink-0 text-gray-400" /> {t(`safety.${i + 1}`)}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy p-8 text-white md:flex-row md:items-center md:p-10">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">{t('home.ctaTitle')}</h3>
            <p className="mt-2 text-gray-300">{t('home.ctaBody')}</p>
          </div>
          <Link to="/sell" className="flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-brand-400 px-7 font-semibold text-navy transition hover:bg-[#34d399]">{t('home.ctaButton')} <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  )
}

function ListingRow({ title, to, items, seeAll }: { title: string; to: string; items: JSX.Element[]; seeAll: string }) {
  if (!items.length) return null
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-navy">{title}</h2>
        <Link to={to} className="group flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand-500">{seeAll} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /></Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items}</div>
    </section>
  )
}
