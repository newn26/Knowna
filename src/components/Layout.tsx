import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BadgeCheck, Bell, Building2, ChevronDown, Heart, Home, LogOut, Menu, MessageSquare, Search, Shield, User as UserIcon, X } from 'lucide-react'
import { alerts, auth, refreshFx, unreadCount, useDB, useMe, useSession } from '../lib/store'
import { usePrefs } from '../lib/prefs'
import { cls, fmtDate } from '../lib/utils'
import { Badge, Toaster } from './ui'

function useOutside(ref: React.RefObject<HTMLElement>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut()
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [ref, onOut])
}

function TopBar() {
  const { t, lang, setLang, currency, setCurrency } = usePrefs()
  const { fx } = useDB()
  return (
    <div className="bg-ink text-xs text-gray-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <span className="hidden truncate sm:block">{t('top.tagline')}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-gray-500 md:inline">1 USD ≈ {fx.usdThb} THB</span>
          <div className="flex overflow-hidden rounded-full border border-gray-600">
            {(['th', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={cls('px-2.5 py-0.5 font-semibold uppercase', lang === l ? 'bg-white text-ink' : 'text-gray-300')}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-full border border-gray-600">
            {(['THB', 'USD'] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={cls('px-2.5 py-0.5 font-semibold', currency === c ? 'bg-white text-ink' : 'text-gray-300')}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Notifications() {
  const me = useMe()!
  const d = useDB()
  const { L, t, lang } = usePrefs()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, () => setOpen(false))
  const items = d.notifications.filter((n) => n.userId === me.id).sort((a, b) => b.createdAt - a.createdAt)
  const unread = items.filter((n) => !n.read).length
  const nav = useNavigate()
  return (
    <div className="relative" ref={ref}>
      <button className="relative rounded-full p-2 hover:bg-gray-100" onClick={() => setOpen(!open)} aria-label="notifications">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">{t('nav.notifications')}</span>
            {unread > 0 && (
              <button className="text-xs text-brand-500" onClick={() => alerts.markAllRead()}>
                {t('nav.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">{t('nav.noNotifications')}</p>}
            {items.slice(0, 30).map((n) => (
              <button
                key={n.id}
                onClick={() => { setOpen(false); nav(n.link) }}
                className={cls('block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50', !n.read && 'bg-brand-50/60')}
              >
                <p>{L(n.text)}</p>
                <p className="mt-1 text-xs text-muted">{fmtDate(n.createdAt, lang, true)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserMenu() {
  const me = useMe()!
  const session = useSession()!
  const { t } = usePrefs()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutside(ref, () => setOpen(false))
  const nav = useNavigate()
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 hover:bg-gray-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">{me.name[0]?.toUpperCase()}</span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium lg:block">{me.name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border bg-white p-2 shadow-lg" onClick={() => setOpen(false)}>
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-muted">{me.email}</p>
          </div>
          <div className="my-1 rounded-lg bg-surface p-1">
            <p className="px-2 pt-1 text-[11px] font-semibold uppercase text-muted">{t('nav.actingAs')}</p>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {(['buyer', 'seller'] as const).map((r) => (
                <button key={r} onClick={() => { auth.setRole(r); nav('/dashboard') }} className={cls('rounded-md py-1.5 text-xs font-semibold', session.role === r ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-white')}>
                  {t('role.' + r)}
                </button>
              ))}
            </div>
          </div>
          <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"><UserIcon size={16} /> {t('nav.dashboard')}</Link>
          <Link to="/verify" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"><BadgeCheck size={16} /> {t('nav.verify')} {!me.isAdmin && <span className={'ml-auto text-[11px] font-semibold ' + (me.kyc?.status === 'verified' ? 'text-green-600' : 'text-amber-600')}>{t('kyc.status.' + (me.kyc?.status ?? 'none'))}</span>}</Link>
          <Link to="/pricing" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"><Building2 size={16} /> {t('nav.pricing')}</Link>
          {me.isAdmin && <Link to="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"><Shield size={16} /> {t('nav.admin')}</Link>}
          <button onClick={() => { auth.logout(); nav('/') }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={16} /> {t('nav.logout')}</button>
        </div>
      )}
    </div>
  )
}

function Header() {
  const me = useMe()
  const session = useSession()
  const d = useDB()
  const { t } = usePrefs()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [mobile, setMobile] = useState(false)
  const unread = me ? unreadCount(d, me.id) : 0
  const links = [
    { to: '/search', label: t('nav.browse') },
    { to: '/requests', label: t('nav.requests') },
    { to: '/valuation', label: t('nav.valuation') },
    { to: '/sell', label: t('nav.sell') },
    { to: '/pricing', label: t('nav.pricing') },
  ]
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <button className="-ml-2 flex h-11 w-11 items-center justify-center md:hidden" onClick={() => setMobile(!mobile)} aria-label="menu" aria-expanded={mobile}>{mobile ? <X /> : <Menu />}</button>
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-bold text-white">R<span className="text-brand-400">.</span></span>
          <span className="hidden text-lg font-bold tracking-tight text-navy sm:block">RUB Job</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cls('relative py-1 text-sm font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-400 after:transition-transform after:duration-200', isActive ? 'text-navy after:scale-x-100' : 'text-gray-600 after:scale-x-0 hover:text-navy hover:after:scale-x-100')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <form
          className="ml-auto hidden max-w-sm flex-1 items-center rounded-full border border-gray-200 bg-surface px-4 xl:flex"
          onSubmit={(e) => { e.preventDefault(); nav('/search?q=' + encodeURIComponent(q)) }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.searchPlaceholder')} className="w-full bg-transparent py-2 text-sm outline-none" />
          <Search size={18} className="text-gray-500" />
        </form>
        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          {me && session ? (
            <>
              {me.isAdmin && <Badge t="dark" className="mr-1 hidden sm:inline-flex">Admin</Badge>}
              <Badge t="blue" className="mr-1 hidden sm:inline-flex">{t('role.' + session.role)}</Badge>
              <Link to="/messages" className="relative rounded-full p-2 hover:bg-gray-100" aria-label="messages">
                <MessageSquare size={20} />
                {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
              </Link>
              <Notifications />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="hidden whitespace-nowrap px-3 text-sm font-semibold text-gray-700 hover:text-brand-500 sm:block">{t('nav.login')}</Link>
              <Link to="/register" className="whitespace-nowrap rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </div>
      {mobile && (
        <nav className="border-t px-4 py-2 md:hidden" onClick={() => setMobile(false)}>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="block py-2 text-sm font-semibold">{l.label}</Link>
          ))}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  const { t } = usePrefs()
  return (
    <footer className="mt-16 bg-ink text-gray-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <div className="mb-3 flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-bold">R<span className="text-brand-400">.</span></span>
            <span className="text-lg font-bold">RUB Job</span>
          </div>
          <p className="text-sm">{t('footer.about')}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t('footer.links')}</p>
          <Link to="/search" className="block py-1 hover:text-white">{t('nav.browse')}</Link>
          <Link to="/requests" className="block py-1 hover:text-white">{t('nav.requests')}</Link>
          <Link to="/valuation" className="block py-1 hover:text-white">{t('nav.valuation')}</Link>
          <Link to="/sell" className="block py-1 hover:text-white">{t('nav.sell')}</Link>
          <Link to="/pricing" className="block py-1 hover:text-white">{t('nav.pricing')}</Link>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-white">{t('footer.disclaimerTitle')}</p>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">© 2026 RUB Job — prototype</div>
    </footer>
  )
}

/** Thumb-reach navigation on phones. Every tab points at a real route. */
function BottomNav() {
  const me = useMe()
  const { t } = usePrefs()
  const { pathname, search } = useLocation()
  const items = [
    { to: '/', label: t('bnav.home'), icon: Home, on: pathname === '/' },
    { to: '/search', label: t('bnav.search'), icon: Search, on: pathname === '/search' },
    { to: me ? '/dashboard?tab=favorites' : '/login?next=/dashboard?tab=favorites', label: t('bnav.saved'), icon: Heart, on: pathname === '/dashboard' && search.includes('favorites') },
    { to: me ? '/dashboard' : '/login', label: t('bnav.profile'), icon: UserIcon, on: (pathname === '/dashboard' && !search.includes('favorites')) || pathname === '/login' },
  ]
  return (
    <nav aria-label={t('bnav.home')} className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: I, on }) => (
          <li key={label}>
            <Link to={to} aria-current={on ? 'page' : undefined} className={cls('flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors', on ? 'text-brand-500' : 'text-gray-500')}>
              <I size={21} strokeWidth={on ? 2.4 : 1.8} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    refreshFx()
  }, [])
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="print:hidden"><TopBar /><Header /></div>
      <main className="flex-1">{children}</main>
      <div className="pb-[calc(56px+env(safe-area-inset-bottom))] print:hidden md:pb-0"><Footer /></div>
      <div className="print:hidden"><BottomNav /><Toaster /></div>
    </div>
  )
}

export const Page = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cls('mx-auto max-w-7xl px-4 py-8', className)}>{children}</div>
)
