import { Menu, Moon, ShoppingBag, Sun, User, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { colorInfo } from '../lib/catalog'
import { resetDemo } from '../lib/api'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { newPairsIn } from '../lib/tradein'
import { Shoe } from './Shoe'
import { buttonClass, Container } from './ui'

const NAV = [
  { to: '/shop', label: 'Shop New' },
  { to: '/preowned', label: 'Pre-owned' },
  { to: '/trade-in', label: 'Trade-in' },
  { to: '/size', label: 'Size Finder' },
  { to: '/track', label: 'ติดตามพัสดุ' },
]

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-black uppercase tracking-[-0.06em] ${className}`} style={{ fontStretch: '115%' }}>
      Kaowna<span className="text-signal">.</span>
    </span>
  )
}

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('kw.theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }
  return { dark, toggle }
}

function Header() {
  const count = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const user = useStore((s) => s.user)
  const { dark, toggle } = useTheme()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const icon = 'grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/5'
  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled || menu ? 'border-b border-line bg-paper/85 backdrop-blur-xl' : 'border-b border-transparent bg-paper'}`}>
      <Container className="flex h-16 items-center gap-6">
        <button className={`${icon} -ml-2 lg:hidden`} onClick={() => setMenu(!menu)} aria-label="เมนู" aria-expanded={menu}>
          {menu ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/" className="text-2xl" aria-label="KAOWNA หน้าแรก">
          <Wordmark />
        </Link>
        <nav className="ml-6 hidden gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative rounded-full px-3.5 py-2 text-sm font-medium transition hover:text-ink ${isActive ? 'text-ink' : 'text-sub'} ${n.to === '/trade-in' ? 'after:absolute after:right-1.5 after:top-1.5 after:h-1.5 after:w-1.5 after:rounded-full after:bg-signal' : ''}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button className={icon} onClick={toggle} aria-label={dark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link to="/account" className={icon} aria-label="บัญชีของฉัน">
            <span className="relative">
              <User size={19} />
              {user && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-ok" />}
            </span>
          </Link>
          <button className={`${icon} relative`} onClick={() => actions.openCart()} aria-label={`ตะกร้า ${count} ชิ้น`}>
            <ShoppingBag size={19} />
            {count > 0 && (
              <span key={count} className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] animate-rise place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-paper">
                {count}
              </span>
            )}
          </button>
        </div>
      </Container>
      {menu && (
        <nav className="h-[calc(100dvh-64px)] animate-fade border-t border-line bg-paper lg:hidden">
          <Container className="flex flex-col py-6">
            {NAV.map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                className="animate-rise border-b border-line py-4 font-display text-3xl font-black uppercase tracking-tight"
                style={{ animationDelay: `${i * 50}ms`, fontStretch: '85%' }}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/account" className="py-4 text-sub">
              บัญชี / ประวัติการสั่งซื้อ →
            </Link>
          </Container>
        </nav>
      )}
    </header>
  )
}

function CartDrawer() {
  const open = useStore((s) => s.cartOpen)
  const cart = useStore((s) => s.cart)
  const tradeIns = useStore((s) => s.tradeIns)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => actions.openCart(false), [pathname])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && actions.openCart(false)
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [open])
  if (!open) return null
  const t = totals(cart, tradeIns)
  const canTradeIn = newPairsIn(cart) > tradeIns.filter((x) => x.rate > 0).length
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="ตะกร้าสินค้า">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={() => actions.openCart(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-sheet flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-display text-lg font-black uppercase">ตะกร้า ({cart.reduce((n, l) => n + l.qty, 0)})</p>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" onClick={() => actions.openCart(false)} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <Shoe color="black" className="mx-auto w-48 opacity-30" shadow={false} />
              <p className="mt-4 text-sub">ยังไม่มีรองเท้าในตะกร้า</p>
              <Link to="/shop" className={`${buttonClass('solid', 'sm')} mt-5`}>
                เลือกรองเท้า
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-stone">
                    <Shoe color={l.color} className="w-20" shadow={false} wear={l.kind === 'preowned' ? 12 : 0} />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">
                      {colorInfo(l.color).name} · EU {l.size}
                    </p>
                    <p className="text-sub">
                      {l.kind === 'new' ? 'New' : `Pre-owned ${l.preownedId}`} · {l.qty} คู่
                    </p>
                    <p className="mt-1 tabular">{baht(l.unitPrice * l.qty)}</p>
                  </div>
                  <button className="self-start text-xs text-sub underline-offset-2 hover:underline" onClick={() => actions.removeLine(l.key)}>
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tradeIns.length > 0 && (
            <div className="mb-4 rounded-2xl border border-signal/40 bg-signal/5 p-4 text-sm">
              <p className="font-semibold text-signal">Trade-in ในออเดอร์นี้</p>
              {t.allocation.map((a) => (
                <p key={a.tradeInId} className="mt-1 flex justify-between tabular">
                  <span>
                    {a.serial} · {Math.round(a.rate * 100)}%
                  </span>
                  <span>{a.appliedTo ? `−${baht(a.amount)}` : 'ยังไม่มีคู่ใหม่ให้หัก'}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            {canTradeIn && tradeIns.length === 0 && (
              <Link to="/trade-in" className="mb-3 flex items-center justify-between rounded-xl bg-stone px-4 py-3 text-sm transition hover:bg-line">
                <span>
                  มีคู่เก่าจาก KAOWNA? <b>เทิร์นลดเพิ่ม 10–15%</b>
                </span>
                <span>→</span>
              </Link>
            )}
            <dl className="space-y-1 text-sm tabular">
              <div className="flex justify-between">
                <dt className="text-sub">ยอดสินค้า</dt>
                <dd>{baht(t.subtotal)}</dd>
              </div>
              {t.discount > 0 && (
                <div className="flex justify-between text-signal">
                  <dt>ส่วนลด Trade-in</dt>
                  <dd>−{baht(t.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>รวม (ก่อนค่าส่ง)</dt>
                <dd>{baht(t.subtotal - t.discount)}</dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link to="/cart" className={buttonClass('outline')}>
                ดูตะกร้า
              </Link>
              <button className={buttonClass('solid')} onClick={() => navigate('/checkout')}>
                ชำระเงิน
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function Toast() {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div key={toast.id} className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-rise rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-xl" role="status">
      {toast.text}
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark className="text-4xl" />
            <p className="mt-4 max-w-xs text-sm text-paper/60">รองเท้านักเรียนชายคู่เดียวที่ตั้งใจทำให้ดีที่สุด ใส่จนโต แล้วเทิร์นต่อให้รุ่นน้อง</p>
          </div>
          {[
            ['ช้อป', [['/shop', 'รองเท้าใหม่'], ['/preowned', 'Pre-owned'], ['/size', 'หาไซซ์']]],
            ['Trade-in', [['/trade-in', 'เทิร์นคู่เก่า'], ['/trade-in#rules', 'เงื่อนไข'], ['/#second-life', 'Second Life']]],
            ['ช่วยเหลือ', [['/track', 'ติดตามพัสดุ'], ['/account', 'ประวัติการสั่งซื้อ'], ['/size', 'วิธีวัดเท้า']]],
          ].map(([h, links]) => (
            <div key={h as string}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/50">{h as string}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {(links as string[][]).map(([to, l]) => (
                  <li key={to}>
                    <Link to={to} className="text-paper/80 transition hover:text-paper">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 KAOWNA · เว็บสาธิต ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น ไม่มีการตัดเงินจริง</p>
          <button
            className="self-start underline-offset-2 hover:text-paper hover:underline"
            onClick={() => {
              resetDemo()
              actions.clearCart()
              actions.logout()
              actions.toast('รีเซ็ตข้อมูลเดโมแล้ว')
            }}
          >
            รีเซ็ตข้อมูลเดโม
          </button>
        </div>
      </Container>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        ข้ามไปเนื้อหา
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <Toast />
    </div>
  )
}
