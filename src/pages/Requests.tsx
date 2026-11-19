import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Handshake, MapPin, MessageSquare, Plus, ShieldAlert, Tag, TrendingUp, Wallet } from 'lucide-react'
import { CATEGORIES, PROVINCES, catName, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { auth, kycVerified, pitches, requestMatches, requests, useDB, useMe, useSession } from '../lib/store'
import type { BuyerRequest } from '../lib/types'
import { fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Badge, Button, Card, Empty, Field, Img, Input, Select, StatusBadge, Textarea, useErrorText } from '../components/ui'

// Number inputs change value on mouse-wheel scroll; blur first so scrolling the page can't edit money.
const noWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur()

function Criteria({ r }: { r: BuyerRequest }) {
  const { t, lang, money } = usePrefs()
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
      {r.purpose && <span className="inline-flex items-center gap-1 font-semibold text-brand-600"><Handshake size={14} /> {t('req.purpose.' + r.purpose)}</span>}
      <span className="inline-flex items-center gap-1"><Tag size={14} /> {r.category ? catName(r.category, lang) : t('req.any')}</span>
      <span className="inline-flex items-center gap-1"><MapPin size={14} /> {r.province ? provName(r.province, lang) : t('req.any')}</span>
      <span className="inline-flex items-center gap-1"><Wallet size={14} /> {t('req.budget')} <b>{money(r.maxBudget, 'THB')}</b></span>
      {r.minProfit > 0 && <span className="inline-flex items-center gap-1"><TrendingUp size={14} /> {t('req.minProfit')} <b>{money(r.minProfit, 'THB')}</b></span>}
    </div>
  )
}

export function RequestList() {
  const d = useDB()
  const me = useMe()
  const { t, lang } = usePrefs()
  const open = d.buyerRequests.filter((r) => r.status === 'open').sort((a, b) => b.createdAt - a.createdAt)
  const myLive = me ? d.listings.filter((l) => l.sellerId === me.id && l.status === 'published') : []
  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('req.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('req.subtitle')}</p>
          <p className="mt-1 text-xs text-muted">{t('req.count', { n: open.length })}</p>
        </div>
        <Link to="/requests/new"><Button><Plus size={16} /> {t('req.new')}</Button></Link>
      </div>
      {!open.length ? <Empty icon="Search" title={t('req.empty')} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((r) => {
            const n = d.pitches.filter((p) => p.requestId === r.id).length
            const matching = r.buyerId === me?.id ? 0 : myLive.filter((l) => requestMatches(l, r, d.fx.usdThb)).length
            return (
              <Link key={r.id} to={`/requests/${r.id}`} className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug">{r.title}</h2>
                  <Badge t="blue" className="shrink-0">{t('req.pitchCount', { n })}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-500">{r.description}</p>
                <div className="mt-3"><Criteria r={r} /></div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{fmtDate(r.createdAt, lang)}</span>
                  {matching > 0 && <span className="inline-flex items-center gap-1 font-semibold text-green-600"><CheckCircle2 size={14} /> {t('req.matchHint', { n: matching })}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Page>
  )
}

export function RequestForm() {
  const { t, L } = usePrefs()
  const session = useSession()
  const nav = useNavigate()
  const err = useErrorText()
  const [f, setF] = useState({ title: '', category: '', province: '', maxBudget: '', minProfit: '0', description: '', purpose: 'buy' as 'buy' | 'invest' | 'partner' })
  const [error, setError] = useState('')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (session?.role !== 'buyer') auth.setRole('buyer')
      const id = requests.create({ ...f, maxBudget: Number(f.maxBudget), minProfit: Number(f.minProfit || 0) })
      nav(`/requests/${id}`)
    } catch (x) {
      setError(err(x))
    }
  }
  return (
    <Page className="max-w-3xl">
      <h1 className="text-2xl font-bold">{t('req.formTitle')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('req.formSubtitle')}</p>
      <Card className="mt-6 p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label={t('req.fPurpose')}>
            <div className="grid grid-cols-3 gap-2">
              {(['buy', 'invest', 'partner'] as const).map((x) => (
                <button type="button" key={x} onClick={() => setF({ ...f, purpose: x })} className={'rounded-lg border-2 px-3 py-2 text-sm font-semibold ' + (f.purpose === x ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600')}>
                  {t('req.purpose.' + x)}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('req.fTitle') + ' *'}><Input value={f.title} onChange={set('title')} placeholder={t('req.fTitlePh')} required maxLength={120} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('form.category')}>
              <Select value={f.category} onChange={set('category')}>
                <option value="">{t('req.any')}</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
              </Select>
            </Field>
            <Field label={t('form.province')}>
              <Select value={f.province} onChange={set('province')}>
                <option value="">{t('req.any')}</option>
                {PROVINCES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
              </Select>
            </Field>
            <Field label={t('req.fBudget') + ' *'}><Input type="number" min={1} value={f.maxBudget} onChange={set('maxBudget')} onWheel={noWheel} required /></Field>
            <Field label={t('req.fMinProfit')} hint={t('req.fMinProfitHint')}><Input type="number" min={0} value={f.minProfit} onChange={set('minProfit')} onWheel={noWheel} /></Field>
          </div>
          <Field label={t('req.fDesc')}><Textarea value={f.description} onChange={set('description')} maxLength={1000} /></Field>
          {error && <Alert t="red">{error}</Alert>}
          <div className="flex justify-end"><Button type="submit">{t('req.submit')}</Button></div>
        </form>
      </Card>
    </Page>
  )
}

export function RequestDetail() {
  const { id } = useParams()
  const d = useDB()
  const me = useMe()
  const { t, lang } = usePrefs()
  const r = d.buyerRequests.find((x) => x.id === id)
  if (!r) return <Page><Empty title={t('err.not_found')} /></Page>
  const isOwner = me?.id === r.buyerId
  const count = d.pitches.filter((p) => p.requestId === r.id).length
  return (
    <Page className="max-w-5xl">
      <Link to="/requests" className="text-sm text-brand-500">← {t('req.title')}</Link>
      <Card className="mt-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{r.title}</h1>
            <p className="mt-1 text-xs text-muted">{t('req.by')} {isOwner ? me!.name : t('req.anonBuyer')} · {fmtDate(r.createdAt, lang)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge t={r.status === 'open' ? 'green' : 'gray'}>{r.status === 'open' ? t('req.open') : t('req.closed')}</Badge>
            <Badge t="blue">{t('req.pitchCount', { n: count })}</Badge>
          </div>
        </div>
        <div className="mt-4"><Criteria r={r} /></div>
        {r.description && <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{r.description}</p>}
        {isOwner && r.status === 'open' && <div className="mt-4"><Button size="sm" variant="ghost" onClick={() => requests.close(r.id)}>{t('req.close')}</Button></div>}
      </Card>
      <div className="mt-6">
        {isOwner ? <OwnerPitches r={r} /> : <PitchBox r={r} />}
      </div>
      {isOwner && <p className="mt-6 text-xs text-muted">{t('req.nextStep')}</p>}
    </Page>
  )
}

/** Buyer view: every pitch received, with shortlist/pass. */
function OwnerPitches({ r }: { r: BuyerRequest }) {
  const d = useDB()
  const { t, lang, money } = usePrefs()
  const err = useErrorText()
  const [error, setError] = useState('')
  const [sort, setSort] = useState<'newest' | 'price'>('newest')
  const offerOf = (p: (typeof d.pitches)[number]) => {
    const l = d.listings.find((x) => x.id === p.listingId)
    const v = p.offerPrice ?? l?.askingPrice ?? 0
    return l?.currency === 'USD' ? v * d.fx.usdThb : v
  }
  const items = d.pitches.filter((p) => p.requestId === r.id).sort((a, b) => (sort === 'price' ? offerOf(a) - offerOf(b) : b.createdAt - a.createdAt))
  const act = (fn: () => void) => { try { setError(''); fn() } catch (x) { setError(err(x)) } }
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('req.pitches')}</h2>
        {items.length > 1 && (
          <Select value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'price')} className="w-auto">
            <option value="newest">{t('sort.newest')}</option>
            <option value="price">{t('req.sortOffer')}</option>
          </Select>
        )}
      </div>
      {error && <div className="mb-3"><Alert t="red">{error}</Alert></div>}
      {!items.length ? <Empty icon="Inbox" title={t('req.noPitches')} /> : (
        <div className="space-y-3">
          {items.map((p) => {
            const l = d.listings.find((x) => x.id === p.listingId)
            if (!l) return null
            const thread = d.threads.find((x) => x.listingId === l.id && x.buyerId === r.buyerId)
            return (
              <Card key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row">
                <Img src={l.coverImages[0]} alt={l.displayName} className="h-28 w-full shrink-0 rounded-lg sm:w-40" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/listing/${l.id}`} className="font-semibold hover:text-brand-500">{l.displayName}</Link>
                    <StatusBadge status={p.status} />
                    <Badge t={requestMatches(l, r, d.fx.usdThb) ? 'green' : 'amber'}>{requestMatches(l, r, d.fx.usdThb) ? t('req.match') : t('req.notMatch')}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{catName(l.category, lang)} · {provName(l.province, lang)} · {t('card.asking')} {money(l.askingPrice, l.currency)} · {t('form.profit')} {money(l.netProfit, l.currency)}</p>
                  {p.offerPrice != null && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-brand-600">{t('req.offerPrice')}: {money(p.offerPrice, l.currency)}</span>
                      {p.offerPrice < l.askingPrice && <span className="ml-2 text-xs text-green-600">({t('req.belowAsking', { pct: Math.round((1 - p.offerPrice / l.askingPrice) * 100) })})</span>}
                    </p>
                  )}
                  {p.offerTerms && <p className="mt-1 text-xs text-gray-600">{t('req.offerTerms')}: {p.offerTerms}</p>}
                  {p.message && <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-gray-700">“{p.message}”</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.status === 'pending' && <>
                      <Button size="sm" onClick={() => act(() => pitches.decide(p.id, 'shortlisted'))}>{t('req.shortlist')}</Button>
                      <Button size="sm" variant="danger" onClick={() => act(() => pitches.decide(p.id, 'declined'))}>{t('req.decline')}</Button>
                    </>}
                    {p.status === 'shortlisted' && thread && <Link to={`/messages/${thread.id}`}><Button size="sm"><MessageSquare size={14} /> {t('req.openChat')}</Button></Link>}
                    <Link to={`/listing/${l.id}`}><Button size="sm" variant="outline">{t('req.viewListing')}</Button></Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

/** Seller view: pitch one of your matching live listings. */
function PitchBox({ r }: { r: BuyerRequest }) {
  const d = useDB()
  const me = useMe()
  const session = useSession()
  const { t, money } = usePrefs()
  const err = useErrorText()
  const [listingId, setListingId] = useState('')
  const [msg, setMsg] = useState('')
  const [offer, setOffer] = useState('')
  const [terms, setTerms] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  if (!me) return <Card className="p-6 text-center"><Link to={`/login?next=${encodeURIComponent('/requests/' + r.id)}`} className="font-semibold text-brand-500">{t('req.loginToPitch')}</Link></Card>
  const mine = d.pitches.filter((p) => p.requestId === r.id && p.sellerId === me.id)
  const pitched = new Set(mine.map((p) => p.listingId))
  const options = d.listings.filter((l) => l.sellerId === me.id && l.status === 'published' && !pitched.has(l.id) && requestMatches(l, r, d.fx.usdThb))
  const chosen = listingId || options[0]?.id || ''
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      if (session?.role !== 'seller') auth.setRole('seller')
      pitches.send(r.id, chosen, msg, { price: offer ? Number(offer) : undefined, terms })
      setMsg('')
      setOffer('')
      setTerms('')
      setListingId('')
      setSent(true)
    } catch (x) {
      setError(err(x))
    }
  }
  return (
    <div className="space-y-4">
      {mine.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">{t('req.yourPitches')}</h2>
          <div className="divide-y">
            {mine.map((p) => {
              const l = d.listings.find((x) => x.id === p.listingId)
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link to={`/listing/${p.listingId}`} className="font-medium hover:text-brand-500">{l?.displayName}</Link>
                  <StatusBadge status={p.status} />
                </div>
              )
            })}
          </div>
        </Card>
      )}
      {r.status === 'open' && (!kycVerified(me) || options.length > 0 || !mine.length) && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">{t('req.pitchTitle')}</h2>
          {sent && <div className="mb-3"><Alert t="green">{t('req.pitchSent')}</Alert></div>}
          {!kycVerified(me) ? (
            <Alert><span className="flex flex-wrap items-center gap-2"><ShieldAlert size={16} /> {t('kyc.neededToPitch')} <Link to="/verify" className="font-semibold underline">{t('kyc.goVerify')}</Link></span></Alert>
          ) : !options.length ? <p className="text-sm text-gray-500">{t('req.noMatch')}</p> : (
            <form onSubmit={send} className="space-y-3">
              <Field label={t('req.pitchSelect')}>
                <Select value={chosen} onChange={(e) => setListingId(e.target.value)}>
                  {options.map((l) => <option key={l.id} value={l.id}>{l.displayName} — {money(l.askingPrice, l.currency)}</option>)}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('req.offerPrice')} hint={t('req.offerHint')}>
                  <Input type="number" min={1} value={offer} onChange={(e) => setOffer(e.target.value)} onWheel={noWheel} placeholder={String(d.listings.find((l) => l.id === chosen)?.askingPrice ?? '')} />
                </Field>
                <Field label={t('req.offerTerms')}>
                  <Input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={t('req.offerTermsPh')} maxLength={200} />
                </Field>
              </div>
              <Field label={t('req.pitchMsg')}><Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('req.pitchMsgPh')} maxLength={600} /></Field>
              {error && <Alert t="red">{error}</Alert>}
              <div className="flex justify-end"><Button type="submit">{t('req.pitchSend')}</Button></div>
            </form>
          )}
        </Card>
      )}
    </div>
  )
}
