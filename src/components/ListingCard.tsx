import { Link, Navigate, useLocation } from 'react-router-dom'
import { BadgeCheck, FileCheck2, Heart, MapPin, Megaphone, Star, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Listing } from '../lib/types'
import { catName, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { listings, useDB, useMe } from '../lib/store'
import { cls } from '../lib/utils'
import { Badge, Img } from './ui'

export function ListingCard({ l, featured }: { l: Listing; featured?: boolean }) {
  const { lang, money, t } = usePrefs()
  const d = useDB()
  const me = useMe()
  const seller = d.users.find((u) => u.id === l.sellerId)
  const fav = !!me && d.favorites.some((f) => f.userId === me.id && f.listingId === l.id)
  return (
    <Link to={`/listing/${l.id}`} className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Img src={l.coverImages[0]} alt={l.displayName} className="h-full w-full transition group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex gap-1">
          {(l.sponsoredUntil ?? 0) > Date.now() && <Badge t="amber"><Megaphone size={12} /> {t('card.sponsored')}</Badge>}
          {featured && <Badge t="dark"><Star size={12} /> {t('card.featured')}</Badge>}
          {l.status === 'under_offer' && <Badge t="blue">{t('status.under_offer')}</Badge>}
        </div>
        {me && (
          <button
            onClick={(e) => { e.preventDefault(); listings.toggleFavorite(l.id) }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow"
            aria-label="favorite"
          >
            <Heart size={16} className={cls(fav ? 'fill-red-500 text-red-500' : 'text-gray-600')} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-brand-500">{catName(l.category, lang)}</p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{l.displayName}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} /> {provName(l.province, lang)}
          {seller?.sellerVerified && <span className="ml-2 inline-flex items-center gap-0.5 text-green-600"><BadgeCheck size={12} /> {t('card.verified')}</span>}
          {l.docsVerified && <span className="ml-2 inline-flex items-center gap-0.5 text-brand-600"><FileCheck2 size={12} /> {t('card.docsVerified')}</span>}
        </p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-[11px] text-muted">{t('card.asking')}</p>
            <p className="text-lg font-bold">{money(l.askingPrice, l.currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">{t('card.revenue')}</p>
            <p className="flex items-center gap-1 text-sm font-semibold text-green-600"><TrendingUp size={14} /> {money(l.annualRevenue, l.currency, { compact: true })}</p>
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
