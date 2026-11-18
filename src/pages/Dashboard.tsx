import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Archive, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { alerts, auth, deals, listings, ndaUsedThisMonth, planOf, useDB, useMe, useSession } from '../lib/store'
import type { Deal, Role } from '../lib/types'
import { catName, provName } from '../lib/constants'
import { cls, fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { ListingCard } from '../components/ListingCard'
import { Alert, Badge, Button, Card, Empty, Img, Input, StatusBadge, Tabs, useErrorText, Field } from '../components/ui'

type Tab = 'listings' | 'ndas' | 'offers' | 'deals' | 'favorites' | 'alerts' | 'billing' | 'profile'

export default function Dashboard() {
  const me = useMe()!
  const session = useSession()!
  const d = useDB()
  const { t, L } = usePrefs()
  const [sp, setSp] = useSearchParams()
  const role = session.role
  const sellerTabs: Tab[] = ['listings', 'ndas', 'offers', 'deals', 'billing', 'profile']
  const buyerTabs: Tab[] = ['ndas', 'offers', 'deals', 'favorites', 'alerts', 'billing', 'profile']
  const tabs = role === 'seller' ? sellerTabs : buyerTabs
  const tab = (tabs.includes(sp.get('tab') as Tab) ? sp.get('tab') : tabs[0]) as Tab
  const setTab = (x: Tab) => setSp({ tab: x })
  const plan = planOf(d, me, role)

  const pendingNdas = d.ndas.filter((n) => n.sellerId === me.id && n.status === 'pending').length
  const myTurnLois = d.lois.filter((o) => o.status === 'open' && (role === 'seller' ? o.sellerId === me.id : o.buyerId === me.id) && o.rounds[o.rounds.length - 1].by !== role).length
  const openDeals = d.deals.filter((x) => x.status === 'in_progress' && (role === 'seller' ? x.sellerId : x.buyerId) === me.id).length
  const unpaid = d.invoices.filter((i) => i.userId === me.id && i.status === 'unpaid').length

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('dash.hello', { name: me.name })}</h1>
          <p className="text-sm text-gray-500">{t('dash.acting', { role: t('role.' + role) })} · {t('dash.plan')}: <b>{L(plan.name)}</b></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border bg-white p-1">
            {(['buyer', 'seller'] as Role[]).map((r) => (
              <button key={r} onClick={() => { auth.setRole(r); setSp({}) }} className={cls('rounded-full px-4 py-1.5 text-sm font-semibold', role === r ? 'bg-brand-500 text-white' : 'text-gray-600')}>{t('role.' + r)}</button>
            ))}
          </div>
          {role === 'seller' && <Link to="/sell"><Button><Plus size={16} /> {t('dash.newListing')}</Button></Link>}
        </div>
      </div>
      {sp.get('submitted') && <div className="mb-4"><Alert t="green">{t('dash.submitted')}</Alert></div>}
      <Card className="overflow-hidden">
        <Tabs
          value={tab}
          onChange={setTab}
          items={tabs.map((x) => ({
            id: x,
            label: t(`dash.tab.${x}${x === 'ndas' || x === 'offers' ? '.' + role : ''}`),
            count: x === 'ndas' && role === 'seller' ? pendingNdas : x === 'offers' ? myTurnLois : x === 'deals' ? openDeals : x === 'billing' ? unpaid : 0,
          }))}
        />
        <div className="p-5">
          {tab === 'listings' && <MyListings />}
          {tab === 'ndas' && <NdaList role={role} />}
          {tab === 'offers' && <OfferList role={role} />}
          {tab === 'deals' && <DealList role={role} />}
          {tab === 'favorites' && <Favorites />}
          {tab === 'alerts' && <SavedSearches />}
          {tab === 'billing' && <Billing role={role} />}
          {tab === 'profile' && <Profile />}
        </div>
      </Card>
    </Page>
  )
}

function MyListings() {
  const d = useDB()
  const me = useMe()!
  const { t, lang, money } = usePrefs()
  const mine = d.listings.filter((l) => l.sellerId === me.id && l.status !== 'archived').sort((a, b) => b.updatedAt - a.updatedAt)
  if (!mine.length) return <Empty icon="Store" title={t('dash.noListings')}><Link to="/sell" className="font-semibold text-brand-500">{t('dash.newListing')}</Link></Empty>
  return (
    <div className="divide-y">
      {mine.map((l) => (
        <div key={l.id} className="flex flex-wrap items-center gap-4 py-4">
          <Img src={l.coverImages[0]} alt="" className="h-16 w-24 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Link to={`/listing/${l.id}`} className="font-semibold hover:text-brand-500">{l.displayName}</Link>
            <p className="text-xs text-muted">{catName(l.category, lang)} · {provName(l.province, lang)} · {money(l.askingPrice, l.currency)} · {l.views} {t('dash.views')}</p>
            {l.rejectReason && <p className="text-xs text-red-600">{t('detail.rejectReason')}: {l.rejectReason}</p>}
          </div>
          <StatusBadge status={l.status} />
          <div className="flex gap-1">
            {!['sold', 'under_offer'].includes(l.status) && <Link to={`/listing/${l.id}/edit`} title={t('common.edit')} className="rounded p-2 hover:bg-gray-100"><Pencil size={16} /></Link>}
            {l.status === 'published' && <button title={t('dash.hide')} onClick={() => listings.setStatus(l.id, 'hidden')} className="rounded p-2 hover:bg-gray-100"><EyeOff size={16} /></button>}
            {l.status === 'hidden' && <button title={t('dash.unhide')} onClick={() => listings.setStatus(l.id, 'published')} className="rounded p-2 hover:bg-gray-100"><Eye size={16} /></button>}
            {['published', 'hidden', 'rejected', 'sold'].includes(l.status) && <button title={t('dash.archive')} onClick={() => listings.setStatus(l.id, 'archived')} className="rounded p-2 hover:bg-gray-100"><Archive size={16} /></button>}
            {l.status === 'draft' && <button title={t('common.delete')} onClick={() => listings.remove(l.id)} className="rounded p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>}
          </div>
        </div>
      ))}
    </div>
  )
}

function NdaList({ role }: { role: Role }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang, L } = usePrefs()
  const items = d.ndas.filter((n) => (role === 'seller' ? n.sellerId : n.buyerId) === me.id).sort((a, b) => b.createdAt - a.createdAt)
  const plan = planOf(d, me, 'buyer')
  return (
    <>
      {role === 'buyer' && (
        <div className="mb-4"><Alert t="blue">{t('dash.ndaQuota', { used: ndaUsedThisMonth(d, me.id), limit: plan.ndaLimitPerMonth ?? '∞', plan: L(plan.name) })} {plan.ndaLimitPerMonth != null && <Link to="/pricing" className="font-semibold underline">{t('form.upgrade')}</Link>}</Alert></div>
      )}
      {!items.length ? <Empty icon="FileText" title={t('dash.noNdas')} /> : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('dash.col.listing')}</th><th>{role === 'seller' ? t('contract.buyer') : t('dash.col.signed')}</th><th>{t('dash.col.status')}</th><th /></tr></thead>
          <tbody className="divide-y">
            {items.map((n) => {
              const l = d.listings.find((x) => x.id === n.listingId)
              const buyer = d.users.find((u) => u.id === n.buyerId)
              return (
                <tr key={n.id}>
                  <td className="py-3"><Link to={`/listing/${n.listingId}`} className="font-semibold hover:text-brand-500">{l?.displayName}</Link></td>
                  <td>{role === 'seller' ? buyer?.name : fmtDate(n.createdAt, lang)}</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td className="text-right"><Link to={`/contract/nda/${n.id}`}><Button size="sm" variant={n.status === 'pending' && role === 'seller' ? 'primary' : 'outline'}>{n.status === 'pending' && role === 'seller' ? t('chat.reviewNda') : t('chat.view')}</Button></Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}

function OfferList({ role }: { role: Role }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang, money } = usePrefs()
  const items = d.lois.filter((o) => (role === 'seller' ? o.sellerId : o.buyerId) === me.id).sort((a, b) => b.updatedAt - a.updatedAt)
  if (!items.length) return <Empty icon="FileText" title={t('dash.noOffers')} />
  return (
    <div className="divide-y">
      {items.map((o) => {
        const l = d.listings.find((x) => x.id === o.listingId)
        const last = o.rounds[o.rounds.length - 1]
        const myTurn = o.status === 'open' && last.by !== role
        return (
          <div key={o.id} className="flex flex-wrap items-center gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l?.displayName}</p>
              <p className="text-xs text-muted">{t('loi.round', { n: o.rounds.length })} · {money(last.price, last.currency, { exact: true })} · {fmtDate(o.updatedAt, lang)}</p>
            </div>
            {myTurn && <Badge t="amber">{t('dash.yourTurn')}</Badge>}
            <StatusBadge status={o.status} />
            <Link to={`/contract/loi/${o.id}`}><Button size="sm" variant={myTurn ? 'primary' : 'outline'}>{t('chat.view')}</Button></Link>
          </div>
        )
      })}
    </div>
  )
}

function DealList({ role }: { role: Role }) {
  const d = useDB()
  const me = useMe()!
  const { t } = usePrefs()
  const items = d.deals.filter((x) => (role === 'seller' ? x.sellerId : x.buyerId) === me.id).sort((a, b) => b.createdAt - a.createdAt)
  if (!items.length) return <Empty icon="Briefcase" title={t('dash.noDeals')}>{t('dash.noDealsHint')}</Empty>
  return <div className="space-y-4">{items.map((x) => <DealCard key={x.id} deal={x} role={role} />)}</div>
}

function DealCard({ deal, role }: { deal: Deal; role: Role }) {
  const d = useDB()
  const { t, lang, money } = usePrefs()
  const err = useErrorText()
  const l = d.listings.find((x) => x.id === deal.listingId)!
  const mine = role === 'buyer' ? deal.buyerConfirm : deal.sellerConfirm
  const theirs = role === 'buyer' ? deal.sellerConfirm : deal.buyerConfirm
  const [price, setPrice] = useState(String(mine?.price ?? deal.agreedPrice))
  const [msg, setMsg] = useState('')
  const inv = deal.invoiceId ? d.invoices.find((i) => i.id === deal.invoiceId) : undefined
  const confirm = () => {
    try {
      const r = deals.confirm(deal.id, Number(price))
      setMsg(t('deal.result.' + r))
    } catch (e) {
      setMsg(err(e))
    }
  }
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to={`/listing/${l.id}`} className="font-semibold hover:text-brand-500">{l.displayName}</Link>
          <p className="text-xs text-muted">{t('deal.agreed')}: {money(deal.agreedPrice, deal.currency, { exact: true })} · <Link to={`/contract/loi/${deal.loiId}`} className="text-brand-500">LOI</Link></p>
        </div>
        <StatusBadge status={deal.status} />
      </div>
      {deal.status === 'in_progress' && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">{t('deal.explain')}</p>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <span className={cls('rounded bg-surface px-3 py-2', mine && 'text-green-700')}>{t('deal.you')}: {mine ? `✓ ${money(mine.price, deal.currency, { exact: true })}` : t('deal.notYet')}</span>
            <span className={cls('rounded bg-surface px-3 py-2', theirs && 'text-green-700')}>{t('deal.them')}: {theirs ? `✓ ${money(theirs.price, deal.currency, { exact: true })}` : t('deal.notYet')}</span>
          </div>
          {mine && theirs && mine.price !== theirs.price && <Alert t="red">{t('deal.result.mismatch')}</Alert>}
          <div className="flex flex-wrap items-end gap-2">
            <Field label={`${t('deal.finalPrice')} (${deal.currency})`} className="w-48"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
            <Button onClick={confirm} disabled={!(Number(price) > 0)}>{t('deal.confirm')}</Button>
            <Button variant="ghost" onClick={() => { if (confirm_(t('deal.cancelConfirm'))) deals.cancel(deal.id) }}>{t('deal.cancel')}</Button>
          </div>
          {msg && <p className="text-sm text-brand-600">{msg}</p>}
        </div>
      )}
      {deal.status === 'closed' && (
        <p className="mt-3 text-sm text-gray-600">
          {t('deal.closedOn', { d: fmtDate(deal.closedAt!, lang) })}
          {role === 'seller' && inv && (inv.status === 'unpaid'
            ? <> · <Link to={`/checkout/${inv.id}`} className="font-semibold text-red-600 underline">{t('deal.payFee', { amount: money(inv.amount, inv.currency, { exact: true }) })}</Link></>
            : <> · <span className="text-green-700">{t('deal.feePaid')}</span></>)}
        </p>
      )}
    </div>
  )
}
const confirm_ = (s: string) => window.confirm(s)

function Favorites() {
  const d = useDB()
  const me = useMe()!
  const { t } = usePrefs()
  const favs = d.favorites.filter((f) => f.userId === me.id).map((f) => d.listings.find((l) => l.id === f.listingId)).filter((l) => l && ['published', 'under_offer', 'sold'].includes(l.status))
  if (!favs.length) return <Empty icon="Inbox" title={t('dash.noFavorites')} />
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{favs.map((l) => <ListingCard key={l!.id} l={l!} />)}</div>
}

function SavedSearches() {
  const d = useDB()
  const me = useMe()!
  const { t, L, lang } = usePrefs()
  const plan = planOf(d, me, 'buyer')
  const items = d.savedSearches.filter((s) => s.userId === me.id)
  return (
    <>
      {!plan.alerts && <div className="mb-4"><Alert t="blue">{t('dash.alertsPro')} <Link to="/pricing" className="font-semibold underline">{t('form.upgrade')}</Link></Alert></div>}
      {!items.length ? <Empty icon="Bell" title={t('dash.noAlerts')}>{t('dash.noAlertsHint')}</Empty> : (
        <div className="divide-y">
          {items.map((s) => {
            const p = s.params
            const parts = [p.q && `"${p.q}"`, p.category && catName(p.category, lang), p.province && provName(p.province, lang)].filter(Boolean)
            const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
            return (
              <div key={s.id} className="flex items-center gap-3 py-3 text-sm">
                <Link to={`/search?${qs}`} className="flex-1 font-semibold hover:text-brand-500">{parts.join(' · ') || t('dash.allListings')}</Link>
                <span className="text-xs text-muted">{fmtDate(s.createdAt, lang)}</span>
                <button onClick={() => alerts.remove(s.id)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-muted">{L({ th: 'บันทึกการค้นหาได้จากปุ่ม "แจ้งเตือนเมื่อมีประกาศใหม่" ในหน้าค้นหา', en: 'Save a search from the "Alert me" button on the search page.' })}</p>
    </>
  )
}

function Billing({ role }: { role: Role }) {
  const d = useDB()
  const me = useMe()!
  const { t, L, lang, money } = usePrefs()
  const nav = useNavigate()
  const plan = planOf(d, me, role)
  const until = role === 'seller' ? me.sellerPlanUntil : me.buyerPlanUntil
  const invoices = d.invoices.filter((i) => i.userId === me.id).sort((a, b) => b.createdAt - a.createdAt)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface p-4">
        <div>
          <p className="text-xs text-muted">{t('billing.current', { role: t('role.' + role) })}</p>
          <p className="text-lg font-bold">{L(plan.name)} {plan.priceTHB > 0 && until && <span className="text-xs font-normal text-muted">· {t('billing.until', { d: fmtDate(until, lang) })}</span>}</p>
          <p className="text-xs text-gray-500">{role === 'seller' ? t('billing.sellerSummary', { limit: plan.listingLimit ?? '∞', fee: plan.feePercent }) : t('billing.buyerSummary', { limit: plan.ndaLimitPerMonth ?? '∞' })}</p>
        </div>
        <Button variant="outline" onClick={() => nav('/pricing')}>{t('billing.change')}</Button>
      </div>
      <div>
        <h3 className="mb-3 font-semibold">{t('billing.invoices')}</h3>
        {!invoices.length ? <p className="text-sm text-muted">{t('billing.noInvoices')}</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('billing.date')}</th><th>{t('billing.item')}</th><th>{t('billing.amount')}</th><th>{t('dash.col.status')}</th><th /></tr></thead>
            <tbody className="divide-y">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td className="py-3">{fmtDate(i.createdAt, lang)}</td>
                  <td>{L(i.description)}</td>
                  <td>{money(i.amount, i.currency, { exact: true })}</td>
                  <td><StatusBadge status={i.status} /></td>
                  <td className="text-right">{i.status === 'unpaid' && <Link to={`/checkout/${i.id}`}><Button size="sm">{t('billing.pay')}</Button></Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Profile() {
  const me = useMe()!
  const { t } = usePrefs()
  const [name, setName] = useState(me.name)
  const [phone, setPhone] = useState(me.phone ?? '')
  const [saved, setSaved] = useState(false)
  return (
    <div className="max-w-md space-y-4">
      <Field label={t('auth.email')}><Input value={me.email} disabled /></Field>
      <Field label={t('auth.name')}><Input value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} /></Field>
      <Field label={t('profile.phone')}><Input value={phone} onChange={(e) => { setPhone(e.target.value); setSaved(false) }} /></Field>
      <div className="flex items-center gap-3">
        <Button onClick={() => { auth.updateProfile({ name: name.trim() || me.name, phone }); setSaved(true) }}>{t('common.save')}</Button>
        {saved && <span className="text-sm text-green-600">✓ {t('common.saved')}</span>}
      </div>
      <p className="text-xs text-muted">{me.sellerVerified ? '✓ ' + t('detail.verifiedSeller') : t('profile.verifyHint')}</p>
    </div>
  )
}
