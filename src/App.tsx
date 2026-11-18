import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PrefsProvider } from './lib/prefs'
import { auth, useSession } from './lib/store'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/ListingCard'
import Home from './pages/Home'
import Search from './pages/Search'
import ListingDetail from './pages/ListingDetail'
import ListingForm from './pages/ListingForm'
import { Login, Register } from './pages/Auth'
import Messages from './pages/Messages'
import Contract from './pages/Contract'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Listing a business implies acting as a seller. */
function Sell() {
  const s = useSession()
  useEffect(() => {
    if (s && s.role !== 'seller') auth.setRole('seller')
  }, [s])
  return <ListingForm />
}

export default function App() {
  return (
    <PrefsProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/listing/:id/edit" element={<RequireAuth><ListingForm /></RequireAuth>} />
            <Route path="/sell" element={<RequireAuth><Sell /></RequireAuth>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="/messages/:threadId" element={<RequireAuth><Messages /></RequireAuth>} />
            <Route path="/contract/:kind/:id" element={<RequireAuth><Contract /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/checkout/:invoiceId" element={<RequireAuth><Checkout /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </PrefsProvider>
  )
}
