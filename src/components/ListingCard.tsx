import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, FileCheck2, Heart, MapPin, Megaphone, Star, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Listing } from '../lib/types'
import { catName, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { listings, useDB, useMe } from '../lib/store'
import { cls } from '../lib/utils'
import { Badge, Figure, Img, toast } from './ui'

/** A listing counts as "new" for this many days after it was published. */
const NEW_DAYS = 14

export function ListingCard({ l, featured }: { l: Listing; featured?: boolean }) {
  const { lang, money, t } = usePrefs()
  const d = useDB()
  const me = useMe()
  const seller = d.users.find((u) => u.id === l.sellerId)
  const fav = !!me && d.favorites.some((f) => f.userId === me.id && f.listingId === l.id)
  const isNew = Date.now() - (l.publishedAt ?? 0) < NEW_DAYS * 86400000
  const nav = useNavigate()
  const onFav = (e: React.MouseEvent) => {
    // the button sits inside the card link: never let a heart tap open the listing
    e.preventDefault()
    e.stopPropagation()
    if (!me) { toast(t('toast.loginToSave'), 'info'); nav(`/login?next=/listing/${l.id}`); return }
    listings.toggleFavorite(l.id)
    toast(t(fav ? 'toast.unsaved' : 'toast.saved'))
  }
  return (
    <Link to={`/listing/${l.id}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition duration-200 ease-out hover:-translate-y-1 hover:border-gray-300 hover:shadow-lift focus-visible:-translate-y-1 focus-visible:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Img src={l.coverImages[0]} alt={l.displayName} className="h-full w-full transition duration-500 ease-out group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {(l.sponsoredUntil ?? 0) > Date.now() && <Badge t="amber" className="shadow-sm"><Megaphone size={12} /> {t('card.sponsored')}</Badge>}
          {featured && <Badge t="dark" className="shadow-sm"><Star size={12} /> {t('card.featured')}</Badge>}
          {isNew && !featured && <Badge t="green" className="shadow-sm">{t('card.new')}</Badge>}
          {l.status === 'under_offer' && <Badge t="blue" className="shadow-sm">{t('status.under_offer')}</Badge>}
        </div>
        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          aria-label={t(fav ? 'card.unsave' : 'card.save')}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Heart size={16} className={cls('transition', fav ? 'fill-red-500 text-red-500' : 'text-gray-600')} />
          </span>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="font-medium text-brand-500">{catName(l.category, lang)}</span>
          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {provName(l.province, lang)}</span>
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-navy">{l.displayName}</h3>
        {(seller?.sellerVerified || l.docsVerified) && (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {seller?.sellerVerified && <span className="inline-flex items-center gap-1 text-brand-600"><BadgeCheck size={13} /> {t('card.verified')}</span>}
            {l.docsVerified && <span className="inline-flex items-center gap-1 text-brand-600"><FileCheck2 size={13} /> {t('card.docsVerified')}</span>}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">{t('card.asking')}</p>
            <Figure value={money(l.askingPrice, l.currency)} className="block truncate text-2xl font-extrabold tracking-tight text-navy" />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted">{t('card.revenue')}</p>
            <p className="tabular flex items-center justify-end gap-1 text-base font-bold text-gray-700"><TrendingUp size={14} className="text-brand-500" /> {money(l.annualRevenue, l.currency, { compact: true })}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const me = useMe()
  const loc = useLocation()
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (admin && !me.isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
