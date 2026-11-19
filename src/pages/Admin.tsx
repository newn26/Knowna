import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BadgeCheck, Ban, Check, Eye, FileCheck2, RotateCcw, X } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { admin, useDB, useMe } from '../lib/store'
import type { Plan } from '../lib/types'
import { catName } from '../lib/constants'
import { fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Badge, Button, Card, Empty, Field, Img, Input, Modal, StatusBadge, Tabs, Textarea, useErrorText } from '../components/ui'

type Tab = 'review' | 'kyc' | 'listings' | 'users' | 'contracts' | 'deals' | 'disputes' | 'reports' | 'invoices' | 'plans'

export default function Admin() {
  const d = useDB()
  const { t, money } = usePrefs()
  const [sp, setSp] = useSearchParams()
  const tab = (sp.get('tab') as Tab) || 'review'
  const pending = d.listings.filter((l) => l.status === 'pending').length
  const openReports = d.reports.filter((r) => r.status === 'open').length
  const unpaid = d.invoices.filter((i) => i.status === 'unpaid' && i.kind === 'fee')
  const paidTotal = d.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.currency === 'USD' ? i.amount * d.fx.usdThb : i.amount), 0)

  const pendingKyc = d.users.filter((u) => u.kyc?.status === 'pending').length
  const openDisputes = d.disputes.filter((x) => x.status === 'open').length
  // Key Metrics from the Lean Canvas: users, buyer requests, pitches, closed deals, revenue
  const stats = [
    { k: t('admin.stat.users'), v: d.users.length },
    { k: t('admin.stat.requests'), v: d.buyerRequests.length },
    { k: t('admin.stat.pitches'), v: d.pitches.length },
    { k: t('admin.stat.live'), v: d.listings.filter((l) => l.status === 'published').length },
    { k: t('admin.stat.deals'), v: d.deals.filter((x) => x.status === 'closed').length },
    { k: t('admin.stat.revenue'), v: money(paidTotal, 'THB') },
  ]
  return (
    <Page>
      <h1 className="mb-6 text-2xl font-bold">{t('admin.title')}</h1>
      <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('admin.keyMetrics')}</p>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => <Card key={s.k} className="p-5"><p className="text-xs text-muted">{s.k}</p><p className="mt-1 text-2xl font-bold">{s.v}</p></Card>)}
      </div>
      <Card className="overflow-hidden">
        <Tabs
          value={tab}
          onChange={(x) => setSp({ tab: x })}
          items={(['review', 'kyc', 'listings', 'users', 'contracts', 'deals', 'disputes', 'reports', 'invoices', 'plans'] as Tab[]).map((x) => ({
            id: x, label: t('admin.tab.' + x), count: x === 'review' ? pending : x === 'kyc' ? pendingKyc : x === 'disputes' ? openDisputes : x === 'reports' ? openReports : x === 'invoices' ? unpaid.length : 0,
          }))}
        />
        <div className="p-5">
          {tab === 'review' && <Review />}
          {tab === 'kyc' && <KycQueue />}
          {tab === 'disputes' && <Disputes />}
          {tab === 'listings' && <AllListings />}
          {tab === 'users' && <Users />}
          {tab === 'contracts' && <Contracts />}
          {tab === 'deals' && <Deals />}
          {tab === 'reports' && <Reports />}
          {tab === 'invoices' && <Invoices />}
          {tab === 'plans' && <Plans />}
        </div>
      </Card>
    </Page>
  )
}

function Review() {
  const d = useDB()
  const { t, lang, money } = usePrefs()
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const items = d.listings.filter((l) => l.status === 'pending')
  if (!items.length) return <Empty icon="Inbox" title={t('admin.noPending')} />
  return (
    <div className="divide-y">
      {items.map((l) => {
        const seller = d.users.find((u) => u.id === l.sellerId)
        return (
          <div key={l.id} className="flex flex-wrap items-center gap-4 py-4">
            <Img src={l.coverImages[0]} alt="" className="h-16 w-24 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l.displayName}</p>
              <p className="text-xs text-muted">{catName(l.category, lang)} · {money(l.askingPrice, l.currency, { exact: true })} · {seller?.name} {seller?.sellerVerified && <BadgeCheck size={12} className="inline text-green-600" />} · {fmtDate(l.updatedAt, lang)}</p>
            </div>
            <Link to={`/listing/${l.id}`}><Button size="sm" variant="ghost"><Eye size={14} /> {t('chat.view')}</Button></Link>
            <Button size="sm" variant="danger" onClick={() => setRejecting(l.id)}><X size={14} /> {t('common.reject')}</Button>
            <Button size="sm" onClick={() => admin.review(l.id, true)}><Check size={14} /> {t('admin.approve')}</Button>
          </div>
        )
      })}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={t('admin.rejectTitle')}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('admin.rejectPh')} />
        <div className="mt-4 flex justify-end">
          <Button variant="danger" disabled={!reason.trim()} onClick={() => { admin.review(rejecting!, false, reason.trim()); setRejecting(null); setReason('') }}>{t('common.reject')}</Button>
        </div>
      </Modal>
    </div>
  )
}

function AllListings() {
  const d = useDB()
  const { t, lang } = usePrefs()
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('dash.col.listing')}</th><th>{t('contract.seller')}</th><th>{t('dash.col.status')}</th><th /></tr></thead>
      <tbody className="divide-y">
        {[...d.listings].sort((a, b) => b.updatedAt - a.updatedAt).map((l) => (
          <tr key={l.id}>
            <td className="py-2"><Link to={`/listing/${l.id}`} className="font-semibold hover:text-brand-500">{l.displayName}</Link><p className="text-xs text-muted">{catName(l.category, lang)}</p></td>
            <td>{d.users.find((u) => u.id === l.sellerId)?.name}</td>
            <td><StatusBadge status={l.status} /></td>
            <td className="space-x-1 whitespace-nowrap text-right">
              <Button size="sm" variant={l.docsVerified ? 'ghost' : 'outline'} onClick={() => admin.setDocsVerified(l.id, !l.docsVerified)}><FileCheck2 size={14} /> {l.docsVerified ? t('admin.unverifyDocs') : t('admin.verifyDocs')}</Button>
              {['published', 'under_offer', 'hidden'].includes(l.status) && <Button size="sm" variant="danger" onClick={() => admin.takeDown(l.id)}>{t('admin.takeDown')}</Button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Users() {
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const err = useErrorText()
  const [e, setE] = useState('')
  return (
    <>
      {e && <Alert t="red">{e}</Alert>}
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('auth.name')}</th><th>{t('admin.plans')}</th><th>{t('admin.joined')}</th><th /></tr></thead>
        <tbody className="divide-y">
          {d.users.map((u) => (
            <tr key={u.id} className={u.suspended ? 'opacity-50' : ''}>
              <td className="py-3">
                <p className="font-semibold">{u.name} {u.isAdmin && <Badge t="dark">Admin</Badge>} {u.sellerVerified && <BadgeCheck size={14} className="inline text-green-600" />} {u.suspended && <Badge t="red">{t('admin.suspended')}</Badge>}</p>
                <p className="text-xs text-muted">{u.email}{!u.emailVerified && ` · ${t('admin.unverifiedEmail')}`}</p>
              </td>
              <td className="text-xs">S: {u.sellerPlanId.replace('seller-', '')} · B: {u.buyerPlanId.replace('buyer-', '')}</td>
              <td className="text-xs">{fmtDate(u.createdAt, lang)}</td>
              <td className="space-x-1 text-right">
                {!u.isAdmin && (
                  <>
                    <Button size="sm" variant={u.sellerVerified ? 'ghost' : 'outline'} onClick={() => admin.setVerified(u.id, !u.sellerVerified)}><BadgeCheck size={14} /> {u.sellerVerified ? t('admin.unverify') : t('admin.verify')}</Button>
                    <Button size="sm" variant="danger" disabled={u.id === me.id} onClick={() => { try { admin.setSuspended(u.id, !u.suspended) } catch (x) { setE(err(x)) } }}>{u.suspended ? <><RotateCcw size={14} /> {t('admin.unsuspend')}</> : <><Ban size={14} /> {t('admin.suspend')}</>}</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Contracts() {
  const d = useDB()
  const { t, lang } = usePrefs()
  const rows = [
    ...d.ndas.map((n) => ({ id: n.id, kind: 'nda', listingId: n.listingId, buyerId: n.buyerId, status: n.status, at: n.createdAt })),
    ...d.lois.map((o) => ({ id: o.id, kind: 'loi', listingId: o.listingId, buyerId: o.buyerId, status: o.status, at: o.updatedAt })),
  ].sort((a, b) => b.at - a.at)
  if (!rows.length) return <Empty icon="FileText" title={t('admin.noContracts')} />
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('admin.type')}</th><th>{t('dash.col.listing')}</th><th>{t('contract.buyer')}</th><th>{t('billing.date')}</th><th>{t('dash.col.status')}</th><th /></tr></thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="py-3 font-semibold uppercase">{r.kind}</td>
            <td>{d.listings.find((l) => l.id === r.listingId)?.displayName}</td>
            <td>{d.users.find((u) => u.id === r.buyerId)?.name}</td>
            <td>{fmtDate(r.at, lang)}</td>
            <td><StatusBadge status={r.status} /></td>
            <td className="text-right"><Link to={`/contract/${r.kind}/${r.id}`} className="text-brand-500">{t('chat.view')}</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Deals() {
  const d = useDB()
  const { t, money } = usePrefs()
  const [closing, setClosing] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  if (!d.deals.length) return <Empty icon="Briefcase" title={t('dash.noDeals')} />
  return (
    <div className="divide-y">
      {d.deals.map((x) => (
        <div key={x.id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
          <div className="flex-1">
            <p className="font-semibold">{d.listings.find((l) => l.id === x.listingId)?.displayName}</p>
            <p className="text-xs text-muted">{money(x.agreedPrice, x.currency, { exact: true })} · {d.users.find((u) => u.id === x.buyerId)?.name} → {d.users.find((u) => u.id === x.sellerId)?.name}{x.closedBy === 'admin' && ` · ${t('admin.closedByAdmin')}`}</p>
          </div>
          <StatusBadge status={x.status} />
          {x.status === 'in_progress' && <Button size="sm" onClick={() => { setClosing(x.id); setPrice(String(x.agreedPrice)) }}>{t('admin.markClosed')}</Button>}
        </div>
      ))}
      <Modal open={!!closing} onClose={() => setClosing(null)} title={t('admin.markClosed')}>
        <p className="mb-3 text-sm text-gray-500">{t('admin.markClosedHint')}</p>
        <Field label={t('deal.finalPrice')}><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <div className="mt-4 flex justify-end"><Button disabled={!(Number(price) > 0)} onClick={() => { admin.closeDeal(closing!, Number(price)); setClosing(null) }}>{t('common.confirm')}</Button></div>
      </Modal>
    </div>
  )
}

function Reports() {
  const d = useDB()
  const { t, lang } = usePrefs()
  const [viewing, setViewing] = useState<string | null>(null)
  if (!d.reports.length) return <Empty icon="Inbox" title={t('admin.noReports')} />
  const msgs = viewing ? d.messages.filter((m) => m.threadId === viewing) : []
  return (
    <div className="divide-y">
      <p className="pb-3 text-xs text-muted">{t('admin.privacyNote')}</p>
      {[...d.reports].sort((a, b) => b.createdAt - a.createdAt).map((r) => {
        const target = r.kind === 'listing' ? d.listings.find((l) => l.id === r.targetId)?.displayName : d.listings.find((l) => l.id === d.threads.find((x) => x.id === r.targetId)?.listingId)?.displayName
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
            <div className="flex-1">
              <p><Badge>{t('admin.reportKind.' + r.kind)}</Badge> <b>{target}</b></p>
              <p className="mt-1 text-gray-600">"{r.reason}"</p>
              <p className="text-xs text-muted">{d.users.find((u) => u.id === r.reporterId)?.name} · {fmtDate(r.createdAt, lang, true)}</p>
            </div>
            <StatusBadge status={r.status} />
            {r.kind === 'thread' && <Button size="sm" variant="outline" onClick={() => setViewing(r.targetId)}>{t('admin.readChat')}</Button>}
            {r.kind === 'listing' && <Link to={`/listing/${r.targetId}`}><Button size="sm" variant="outline">{t('chat.view')}</Button></Link>}
            {r.status === 'open' && <Button size="sm" onClick={() => admin.resolveReport(r.id)}>{t('admin.resolve')}</Button>}
          </div>
        )
      })}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={t('admin.readChat')} wide>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto text-sm">
          {msgs.map((m) => (
            <div key={m.id} className="rounded bg-surface px-3 py-2">
              <span className="font-semibold">{m.senderId ? d.users.find((u) => u.id === m.senderId)?.name : 'System'}:</span> {m.senderId ? m.text : t('sys.' + m.text)} {m.file && <i>[{m.file.name}]</i>}
              <span className="ml-2 text-xs text-muted">{fmtDate(m.createdAt, lang, true)}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function Invoices() {
  const d = useDB()
  const { t, L, lang, money } = usePrefs()
  const items = [...d.invoices].sort((a, b) => Number(a.status === 'paid') - Number(b.status === 'paid') || b.createdAt - a.createdAt)
  if (!items.length) return <Empty icon="FileText" title={t('billing.noInvoices')} />
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted"><tr><th className="py-2">{t('billing.date')}</th><th>{t('admin.customer')}</th><th>{t('billing.item')}</th><th>{t('billing.amount')}</th><th>{t('dash.col.status')}</th></tr></thead>
      <tbody className="divide-y">
        {items.map((i) => (
          <tr key={i.id}>
            <td className="py-3">{fmtDate(i.createdAt, lang)}</td>
            <td>{d.users.find((u) => u.id === i.userId)?.name}</td>
            <td>{L(i.description)}</td>
            <td>{money(i.amount, i.currency, { exact: true })}</td>
            <td><StatusBadge status={i.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Plans() {
  const d = useDB()
  const { t } = usePrefs()
  return (
    <div className="space-y-4">
      <Alert t="blue">{t('admin.plansNote')}</Alert>
      <AdSettings />
      <div className="grid gap-4 lg:grid-cols-2">
        {d.plans.map((p) => <PlanEditor key={p.id} plan={p} />)}
      </div>
      <div className="border-t pt-4">
        <Button variant="danger" size="sm" onClick={() => { if (window.confirm(t('admin.resetConfirm'))) admin.resetDemo() }}>{t('admin.reset')}</Button>
      </div>
    </div>
  )
}

function PlanEditor({ plan }: { plan: Plan }) {
  const { t } = usePrefs()
  const [p, setP] = useState(plan)
  const [saved, setSaved] = useState(false)
  const num = (k: keyof Plan, nullable = false) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false)
    setP({ ...p, [k]: e.target.value === '' && nullable ? null : Number(e.target.value) })
  }
  const seller = p.audience === 'seller'
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">{t('role.' + p.audience)} · {p.id}</p>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={p.active} onChange={(e) => { setP({ ...p, active: e.target.checked }); setSaved(false) }} /> {t('admin.active')}</label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('admin.nameTh')}><Input value={p.name.th} onChange={(e) => { setP({ ...p, name: { ...p.name, th: e.target.value } }); setSaved(false) }} /></Field>
        <Field label={t('admin.nameEn')}><Input value={p.name.en} onChange={(e) => { setP({ ...p, name: { ...p.name, en: e.target.value } }); setSaved(false) }} /></Field>
        <Field label={t('admin.priceTHB')}><Input type="number" min={0} value={p.priceTHB} onChange={num('priceTHB')} /></Field>
        <Field label={t('admin.priceUSD')}><Input type="number" min={0} value={p.priceUSD} onChange={num('priceUSD')} /></Field>
        {seller ? (
          <>
            <Field label={t('admin.listingLimit')} hint={t('admin.blankUnlimited')}><Input type="number" min={0} value={p.listingLimit ?? ''} onChange={num('listingLimit', true)} /></Field>
            <Field label={t('admin.feePercent')}><Input type="number" min={0} max={100} step={0.1} value={p.feePercent} onChange={num('feePercent')} /></Field>
            <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={p.featured} onChange={(e) => { setP({ ...p, featured: e.target.checked }); setSaved(false) }} /> {t('plan.featured')}</label>
          </>
        ) : (
          <>
            <Field label={t('admin.ndaLimit')} hint={t('admin.blankUnlimited')}><Input type="number" min={0} value={p.ndaLimitPerMonth ?? ''} onChange={num('ndaLimitPerMonth', true)} /></Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={p.alerts} onChange={(e) => { setP({ ...p, alerts: e.target.checked }); setSaved(false) }} /> {t('plan.alerts')}</label>
          </>
        )}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-600">✓ {t('common.saved')}</span>}
        <Button size="sm" onClick={() => { admin.updatePlan(p); setSaved(true) }}>{t('common.save')}</Button>
      </div>
    </div>
  )
}

function KycQueue() {
  const d = useDB()
  const { t, lang } = usePrefs()
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const items = d.users.filter((u) => u.kyc && !u.isAdmin).sort((a, b) => Number(b.kyc!.status === 'pending') - Number(a.kyc!.status === 'pending') || b.kyc!.submittedAt - a.kyc!.submittedAt)
  if (!items.length) return <Empty icon="Inbox" title={t('admin.noKyc')} />
  return (
    <div className="divide-y">
      {items.map((u) => (
        <div key={u.id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
          {u.kyc!.idImage ? <a href={u.kyc!.idImage} target="_blank" rel="noreferrer"><img src={u.kyc!.idImage} alt="ID" className="h-14 w-20 rounded border object-cover" /></a> : <div className="flex h-14 w-20 items-center justify-center rounded border bg-surface text-[10px] text-muted">seed</div>}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{u.kyc!.fullName} <span className="font-normal text-muted">({u.email})</span></p>
            <p className="text-xs text-muted">ID: {u.kyc!.idNumber} · {fmtDate(u.kyc!.submittedAt, lang, true)}{u.kyc!.note && ` · ${u.kyc!.note}`}</p>
          </div>
          <Badge t={u.kyc!.status === 'verified' ? 'green' : u.kyc!.status === 'pending' ? 'amber' : 'red'}>{t('kyc.status.' + u.kyc!.status)}</Badge>
          {u.kyc!.status === 'pending' && <>
            <Button size="sm" variant="danger" onClick={() => setRejecting(u.id)}><X size={14} /> {t('common.reject')}</Button>
            <Button size="sm" onClick={() => admin.reviewKyc(u.id, true)}><Check size={14} /> {t('admin.approve')}</Button>
          </>}
        </div>
      ))}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title={t('admin.kycReject')}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('admin.kycRejectPh')} />
        <div className="mt-4 flex justify-end">
          <Button variant="danger" disabled={!note.trim()} onClick={() => { admin.reviewKyc(rejecting!, false, note.trim()); setRejecting(null); setNote('') }}>{t('common.reject')}</Button>
        </div>
      </Modal>
    </div>
  )
}

function Disputes() {
  const d = useDB()
  const { t, lang, money } = usePrefs()
  const [resolving, setResolving] = useState<string | null>(null)
  const [text, setText] = useState('')
  const items = [...d.disputes].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.createdAt - a.createdAt)
  if (!items.length) return <Empty icon="Inbox" title={t('admin.noDisputes')} />
  return (
    <div className="divide-y">
      {items.map((x) => {
        const deal = d.deals.find((y) => y.id === x.dealId)
        const l = deal && d.listings.find((y) => y.id === deal.listingId)
        const th = deal && d.threads.find((y) => y.listingId === deal.listingId && y.buyerId === deal.buyerId)
        return (
          <div key={x.id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{l?.displayName} {deal && <span className="font-normal text-muted">· {money(deal.agreedPrice, deal.currency, { exact: true })}</span>}</p>
              <p className="mt-1 text-gray-600">"{x.reason}"</p>
              <p className="text-xs text-muted">{d.users.find((u) => u.id === x.openedBy)?.name} · {fmtDate(x.createdAt, lang, true)}{x.resolution && ` · ${t('dispute.resolvedNote')}: ${x.resolution}`}</p>
            </div>
            <StatusBadge status={x.status === 'open' ? 'open' : 'resolved'} />
            {th && <Link to={`/room/${th.id}`}><Button size="sm" variant="outline">Deal Room</Button></Link>}
            {x.status === 'open' && <Button size="sm" onClick={() => setResolving(x.id)}>{t('admin.resolve')}</Button>}
          </div>
        )
      })}
      <Modal open={!!resolving} onClose={() => setResolving(null)} title={t('admin.resolveDispute')}>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('admin.resolutionPh')} />
        <div className="mt-4 flex justify-end">
          <Button disabled={!text.trim()} onClick={() => { admin.resolveDispute(resolving!, text); setResolving(null); setText('') }}>{t('common.confirm')}</Button>
        </div>
      </Modal>
    </div>
  )
}

function AdSettings() {
  const d = useDB()
  const { t } = usePrefs()
  const [s, setS] = useState(d.settings)
  const [saved, setSaved] = useState(false)
  const num = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement>) => { setSaved(false); setS({ ...s, [k]: Number(e.target.value) }) }
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-3 font-semibold">{t('admin.adSettings')}</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t('admin.priceTHB')}><Input type="number" min={0} value={s.adPriceTHB} onChange={num('adPriceTHB')} /></Field>
        <Field label={t('admin.priceUSD')}><Input type="number" min={0} value={s.adPriceUSD} onChange={num('adPriceUSD')} /></Field>
        <Field label={t('admin.adDays')}><Input type="number" min={1} value={s.adDays} onChange={num('adDays')} /></Field>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-green-600">✓ {t('common.saved')}</span>}
        <Button size="sm" onClick={() => { admin.updateSettings(s); setSaved(true) }}>{t('common.save')}</Button>
      </div>
    </div>
  )
}
