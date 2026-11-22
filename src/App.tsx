import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import { Account, OrderDetail, Track } from './pages/Orders'
import Preowned, { PreownedDetail } from './pages/Preowned'
import Product from './pages/Product'
import Shop from './pages/Shop'
import SizeFinder from './pages/SizeFinder'
import TradeIn from './pages/TradeIn'
import NotFound from './pages/NotFound'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) return el.scrollIntoView({ behavior: 'smooth' })
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// Re-keying on the path replays a short fade-up for every page change (query-only changes keep the page).
function PageFade({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="animate-page">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ScrollManager />
      <Layout>
        <PageFade>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product" element={<Product />} />
          <Route path="/size" element={<SizeFinder />} />
          <Route path="/preowned" element={<Preowned />} />
          <Route path="/preowned/:id" element={<PreownedDetail />} />
          <Route path="/trade-in" element={<TradeIn />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track" element={<Track />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PageFade>
      </Layout>
    </HashRouter>
  )
}
