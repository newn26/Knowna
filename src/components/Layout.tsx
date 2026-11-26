import { Menu, Moon, ShoppingBag, Sun, User, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { colorInfo } from '../lib/catalog'
import { resetDemo } from '../lib/api'
import { baht, totals } from '../lib/pricing'
import { actions, useStore } from '../lib/store'
import { PHOTOS } from '../lib/photos'
import { SizeChat } from './SizeChat'
import { buttonClass, Container, Num, useDialog } from './ui'

const NAV = [
  { to: '/shop', label: 'ซื้อคู่ใหม่' },
  { to: '/size', label: 'หาไซส์' },
  { to: '/#exchange', label: 'เปลี่ยนไซส์ฟรี' },
  { to: '/track', label: 'ติดตามพัสดุ' },
]

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-black uppercase tracking-[-0.06em] ${className}`} style={{ fontStretch: '115%' }}>
      Knowna<span className="text-signal">.</span>
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
        <Link to="/" className="text-2xl" aria-label="KNOWNA หน้าแรก">
          <Wordmark />
        </Link>
        <nav className="ml-6 hidden gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              className={({ isActive: active }) => {
                const isActive = active && !n.to.includes('#') // the exchange link points into Home, so it is never "the current page"
                return `relative rounded-full px-3.5 py-2 text-sm font-medium transition hover:text-ink before:absolute before:inset-x-3.5 before:bottom-1 before:h-px before:origin-left before:bg-current before:transition-transform before:duration-300 hover:before:scale-x-100 ${isActive ? 'text-ink before:scale-x-100' : 'text-sub before:scale-x-0'} ${n.to === '/#exchange' ? 'after:absolute after:right-1.5 after:top-1.5 after:h-1.5 after:w-1.5 after:rounded-full after:bg-signal' : ''}`
              }}
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
            <span key={`bag-${count}`} className={`block ${count ? 'animate-bump' : ''}`}>
              <ShoppingBag size={19} />
            </span>
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
  const { pathname } = useLocation()
  useEffect(() => actions.openCart(false), [pathname])
  const [shown, setShown] = useState(open)
  useEffect(() => {
    if (open) return setShown(true)
    const t = setTimeout(() => setShown(false), 300) // keep mounted while the close animation plays
    return () => clearTimeout(t)
  }, [open])
  return shown ? <CartSheet leaving={!open} /> : null
}

function CartSheet({ leaving }: { leaving: boolean }) {
  const cart = useStore((s) => s.cart)
  const navigate = useNavigate()
  const ref = useDialog<HTMLDivElement>(() => actions.openCart(false))
  const t = totals(cart)
  return (
    <div ref={ref} className="fixed inset-0 z-50" role="dialog" aria-modal aria-label="ตะกร้าสินค้า">
      <div className={`absolute inset-0 animate-fade bg-black/40 transition-opacity duration-300 ${leaving ? 'opacity-0' : ''}`} onClick={() => actions.openCart(false)} />
      <aside className={`absolute right-0 top-0 flex h-full w-full max-w-md animate-sheet flex-col bg-paper shadow-2xl transition-transform duration-300 ease-in ${leaving ? 'translate-x-full' : ''}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-display text-lg font-black uppercase">ตะกร้า ({cart.reduce((n, l) => n + l.qty, 0)})</p>
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" onClick={() => actions.openCart(false)} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <img src={PHOTOS.brown.side.src} alt="" className="mx-auto w-48 opacity-30" />
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
                    <img src={PHOTOS[l.color].side.src} alt={PHOTOS[l.color].side.alt} className="w-20" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">
                      สี{colorInfo(l.color).nameTh} · EU {l.size}
                    </p>
                    <p className="text-sub">
                      คู่ใหม่ · {l.qty} คู่
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
        </div>
        {cart.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <p className="mb-3 rounded-xl bg-stone px-4 py-3 text-sm">
              ไซส์ไม่พอดี? <b>เปลี่ยนฟรี 1 ครั้งต่อคำสั่งซื้อ</b>
            </p>
            <dl className="space-y-1 text-sm tabular">
              <div className="flex justify-between">
                <dt className="text-sub">ยอดสินค้า</dt>
                <dd>{baht(t.subtotal)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>รวม (รวมค่าส่งแล้ว)</dt>
                <dd>
                  <Num value={t.subtotal} format={baht} />
                </dd>
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
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-[60] flex justify-center" role="status">
      <p key={toast.id} className="animate-rise rounded-full bg-ink px-5 py-3 text-center text-sm font-medium text-paper shadow-xl">
        {toast.text}
      </p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="fixed-tone mt-24 bg-ink text-paper">
      <Container className="footer-reveal py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark className="text-4xl" />
            <p className="mt-4 max-w-xs text-sm text-paper/60">รองเท้านักเรียนที่มาพร้อมบริการหลังการขาย สั่งไซส์ผิด เปลี่ยนฟรี 1 ครั้งต่อคำสั่งซื้อ</p>
          </div>
          {[
            ['ช้อป', [['/shop', 'รองเท้าใหม่'], ['/size', 'หาไซส์']]],
            ['เปลี่ยนไซส์', [['/#exchange', 'เงื่อนไขเปลี่ยนไซส์ฟรี'], ['/account', 'ขอเปลี่ยนไซส์']]],
            ['ช่วยเหลือ', [['/track', 'ติดตามพัสดุ'], ['/account', 'ประวัติการสั่งซื้อ'], ['/size', 'วิธีวัดเท้า']]],
          ].map(([h, links]) => (
            <div key={h as string}>
              <p className="text-sm font-semibold text-paper/60">{h as string}</p>
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
          <p>© 2026 KNOWNA · เว็บสาธิต ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น ไม่มีการตัดเงินจริง · ภาพสินค้าสร้างด้วย AI</p>
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
      <SizeChat />
      <Toast />
    </div>
  )
}
