import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Check, FileText, Lock, MessageSquare, Repeat, ShieldCheck, Upload, X } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { canViewFull, chat, dealSteps, deals, disputes, feeStatus, lois, room, roomDocsFor, STEP_KEYS, useDB, useMe } from '../lib/store'
import { MAX_DOC_BYTES } from '../lib/constants'
import { cls, fmtBytes, fmtDate, readFileAsDataUrl } from '../lib/utils'
import type { Deal, FileAsset, Listing, Loi, Thread } from '../lib/types'
import { Page } from '../components/Layout'
import { LoiForm, SignBox } from '../components/ContractForms'
import { Alert, Badge, Button, Card, Empty, Field, Img, Input, Modal, Select, StatusBadge, Textarea, toast, useErrorText } from '../components/ui'

type Tab = 'overview' | 'chat' | 'documents' | 'offers' | 'activity'
const TABS: Tab[] = ['overview', 'chat', 'documents', 'offers', 'activity']

/**
 * Deal Room: one workspace per (listing × buyer). Stage, documents and fee status are all derived from stored records
 * (store.dealSteps / roomDocsFor / feeStatus); every action is re-checked in the store layer, which stands in for a server.
 */
export default function DealRoom() {
  const { threadId } = useParams()
  const d = useDB()
  const me = useMe()!
  const { t, lang, money } = usePrefs()
  const [tab, setTab] = useState<Tab>('overview')
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reason, setReason] = useState('')
  const err = useErrorText()
  const [error, setError] = useState('')

  const th = d.threads.find((x) => x.id === threadId)
  if (!th || (th.buyerId !== me.id && th.sellerId !== me.id && !me.isAdmin)) return <Page><Empty title={t('room.notFound')} /></Page>
  const l = d.listings.find((x) => x.id === th.listingId)!
  const buyer = d.users.find((u) => u.id === th.buyerId)!
  const seller = d.users.find((u) => u.id === th.sellerId)!
  const isBuyer = me.id === th.buyerId
  const isSeller = me.id === th.sellerId
  const full = canViewFull(d, th.buyerId, l)
  const { nda, loi, deal, done, current, pct } = dealSteps(d, th.id)
  const dispute = deal && d.disputes.filter((x) => x.dealId === deal.id).sort((a, b) => b.createdAt - a.createdAt)[0]
  const lastRound = loi?.rounds[loi.rounds.length - 1]
  const fee = deal ? feeStatus(d, deal) : undefined

  const run = (f: () => void, ok?: string) => {
    setError('')
    try { f(); if (ok) toast(t(ok)) } catch (e) { const m = err(e); setError(m); toast(m, 'error') }
  }

  const dealBadge = !deal ? <Badge>{t('room.notStarted')}</Badge> : <StatusBadge status={deal.status} />

  return (
    <Page className="max-w-6xl">
      {/* Header + dashboard */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Img src={l.coverImages[0]} alt="" className="h-14 w-14 rounded-xl" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Deal Room</p>
            <h1 className="text-xl font-bold text-navy">{l.displayName}</h1>
            <p className="text-xs text-muted">{t('contract.buyer')}: {buyer.name} · {t('contract.seller')}: {full || !isBuyer ? seller.name : t('detail.sellerHidden')}</p>
          </div>
        </div>
        <Link to={`/listing/${l.id}`}><Button variant="ghost" size="sm">{t('req.viewListing')}</Button></Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('dr.listed')} value={money(l.askingPrice, l.currency, { exact: true })} />
        <Stat label={deal ? t('dr.agreed') : t('dr.offered')} value={deal ? money(deal.agreedPrice, deal.currency, { exact: true }) : lastRound ? money(lastRound.price, lastRound.currency, { exact: true }) : t('dr.noOffer')} strong />
        <Stat label={t('dr.dealStatus')} value={dealBadge} />
        <Stat label={t('dr.progress')} value={<span className="tabular text-lg font-bold text-navy">{pct}%</span>}>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('dr.progress')}>
            <div className="h-full rounded-full bg-brand-400 transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </Stat>
      </div>

      {/* 8-stage tracker */}
      <Card className="mt-4 p-4 md:p-5">
        <ol className="-mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-8 md:overflow-visible" aria-label={t('dr.progress')}>
          {STEP_KEYS.map((k, i) => {
            const state = done[i] ? 'done' : i === current && deal?.status !== 'cancelled' ? 'current' : 'todo'
            return (
              <li key={k} aria-current={state === 'current' ? 'step' : undefined} className="relative min-w-[92px] shrink-0 snap-start text-center md:min-w-0">
                {i > 0 && <span aria-hidden="true" className={cls('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors duration-700', done[i] || state === 'current' ? 'bg-brand-400' : 'bg-gray-200')} />}
                <span className="relative mx-auto flex h-8 w-8 items-center justify-center">
                  {state === 'current' && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />}
                  <span className={cls('relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-500', state === 'done' ? 'bg-brand-500 text-white' : state === 'current' ? 'bg-navy text-white' : 'bg-gray-200 text-gray-500')}>
                    {state === 'done' ? <Check size={15} /> : i + 1}
                  </span>
                </span>
                <p className={cls('mt-2 px-1 text-[11px] font-semibold leading-tight md:text-xs', state === 'todo' ? 'text-gray-500' : 'text-navy')}>{t('dr.s.' + k)}</p>
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Tabs */}
      <div role="tablist" aria-label="Deal Room" className="mt-5 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cls('min-h-[44px] shrink-0 border-b-2 px-4 text-sm font-semibold transition', tab === k ? 'border-brand-500 text-navy' : 'border-transparent text-gray-500 hover:text-navy')}>
            {t('dr.tab.' + k)}
          </button>
        ))}
      </div>

      {error && <div className="mt-4"><Alert t="red">{error}</Alert></div>}

      <div className="mt-5" role="tabpanel">
        {tab === 'overview' && (
          <Overview th={th} l={l} deal={deal} loi={loi} step={current} isBuyer={isBuyer} isSeller={isSeller} run={run} fee={fee} setTab={setTab}
            dispute={dispute} onDispute={() => setDisputeOpen(true)} />
        )}
        {tab === 'chat' && <ChatTab th={th} run={run} />}
        {tab === 'documents' && <DocsTab th={th} l={l} full={full} run={run} />}
        {tab === 'offers' && <OffersTab l={l} loi={loi} nda={nda} isBuyer={isBuyer} isSeller={isSeller} run={run} />}
        {tab === 'activity' && <ActivityTab th={th} l={l} deal={deal} loi={loi} />}
      </div>

      <p className="mt-6 rounded-lg bg-surface px-4 py-3 text-xs leading-relaxed text-muted">{t('dr.proto')}</p>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title={t('dispute.open')}>
        <p className="mb-3 text-sm text-gray-500">{t('dispute.hint')}</p>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('dispute.ph')} />
        <div className="mt-4 flex justify-end">
          <Button variant="danger" disabled={!reason.trim()} onClick={() => run(() => { disputes.open(deal!.id, reason); setDisputeOpen(false); setReason('') })}>{t('dispute.submit')}</Button>
        </div>
      </Modal>
    </Page>
  )
}

function Stat({ label, value, strong, children }: { label: string; value: React.ReactNode; strong?: boolean; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <div className={cls('tabular mt-1 min-h-[28px] text-base', strong ? 'font-bold text-brand-600' : 'font-semibold text-navy')}>{value}</div>
      {children}
    </div>
  )
}

type Run = (f: () => void, ok?: string) => void

function Overview({ th, l, deal, loi, step, isBuyer, isSeller, run, fee, setTab, dispute, onDispute }: {
  th: Thread; l: Listing; deal?: Deal; loi?: Loi; step: number; isBuyer: boolean; isSeller: boolean; run: Run
  fee?: ReturnType<typeof feeStatus>; setTab: (t: Tab) => void; dispute?: { status: string; resolution?: string }; onDispute: () => void
}) {
  const { t, lang, money } = usePrefs()
  const me = useMe()!
  const [note, setNote] = useState('')
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const party = isBuyer || isSeller
  const myConfirm = deal && (isBuyer ? deal.buyerConfirm : deal.sellerConfirm)
  const mySig = deal && (isBuyer ? deal.contract?.buyer : deal.contract?.seller)
  const cancelled = !deal && loi?.status === 'accepted' // accepted LOI whose deal was cancelled
  const key = STEP_KEYS[step]
  const rate = deal ? (d_rate(deal, fee)) : undefined

  const evidence: [string, number | undefined, string?][] = deal ? [
    [t('dr.ev.dd'), deal.dd?.at, deal.dd?.note],
    [t('dr.ev.signB'), deal.contract?.buyer?.at, deal.contract?.buyer?.name],
    [t('dr.ev.signS'), deal.contract?.seller?.at, deal.contract?.seller?.name],
    [t('dr.ev.paid'), deal.transaction?.buyerPaidAt],
    [t('dr.ev.received'), deal.transaction?.sellerReceivedAt],
    [t('dr.ev.handover'), deal.handoverAt],
    [t('dr.ev.closeB'), deal.buyerConfirm?.at, deal.buyerConfirm && money(deal.buyerConfirm.price, deal.currency, { exact: true })],
    [t('dr.ev.closeS'), deal.sellerConfirm?.at, deal.sellerConfirm && money(deal.sellerConfirm.price, deal.currency, { exact: true })],
  ] : []

  let next: React.ReactNode = null
  if (deal?.status === 'closed') next = <Alert t="green">{t('dr.a.done')}</Alert>
  else if (cancelled) next = <Alert>{t('dr.a.cancelled')}</Alert>
  else if (key === 'nda' || key === 'disclose') next = <Hint text={t('dr.a.' + key)} />
  else if (key === 'loi') next = <Hint text={t('dr.a.loi')} action={<Button size="sm" onClick={() => setTab('offers')}>{t('dr.tab.offers')}</Button>} />
  else if (key === 'negotiate') next = <Hint text={t('dr.a.negotiate')} action={<Button size="sm" onClick={() => setTab('offers')}>{t('dr.tab.offers')}</Button>} />
  else if (deal && key === 'dd') {
    next = isBuyer ? (
      <div className="space-y-3">
        <Hint text={t('dr.a.dd')} />
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('dr.a.ddNote')} maxLength={500} />
        <Button onClick={() => run(() => deals.completeDD(deal.id, note), 'dr.t.dd')}>{t('dr.a.ddBtn')}</Button>
      </div>
    ) : <Hint text={t('dr.wait')} />
  } else if (deal && key === 'contract') {
    next = party && !mySig ? (
      <div className="space-y-3">
        <Hint text={t('dr.a.contract')} />
        <SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} />
        <Button disabled={!agreed || !name.trim()} onClick={() => run(() => deals.signContract(deal.id, name), 'dr.t.sign')}>{t('dr.a.signBtn')}</Button>
      </div>
    ) : <Hint text={t('dr.wait')} />
  } else if (deal && key === 'payment') {
    const tx = deal.transaction
    next = (
      <div className="space-y-3">
        <Hint text={tx?.sellerReceivedAt ? t('dr.a.handover') : t('dr.a.pay')} />
        <div className="flex flex-wrap gap-2">
          {isBuyer && !tx?.buyerPaidAt && <Button onClick={() => run(() => deals.markPaid(deal.id), 'dr.t.paid')}>{t('room.btnPaid')}</Button>}
          {isSeller && tx?.buyerPaidAt && !tx.sellerReceivedAt && <Button onClick={() => run(() => deals.markReceived(deal.id), 'dr.t.received')}>{t('room.btnReceived')}</Button>}
          {isBuyer && tx?.sellerReceivedAt && !deal.handoverAt && <Button onClick={() => run(() => deals.confirmHandover(deal.id), 'dr.t.handover')}>{t('dr.a.handoverBtn')}</Button>}
        </div>
      </div>
    )
  } else if (deal && key === 'close') {
    next = (
      <div className="space-y-3">
        <Hint text={t('dr.a.close')} />
        {party && !myConfirm
          ? <Button onClick={() => run(() => { const r: string = deals.confirm(deal.id, deal.agreedPrice); toast(t(r === 'closed' ? 'dr.t.closed' : 'dr.t.confirm')) })}>{t('dr.a.closeBtn')}</Button>
          : <Hint text={t('dr.wait')} />}
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-navy">{t('dr.next')}</h2>
            {step < 8 && deal?.status !== 'closed' && <Badge t="blue">{t('dr.stage', { n: step + 1 })} · {t('dr.s.' + key)}</Badge>}
          </div>
          {next ?? <Alert t="green">{t('dr.allDone')}</Alert>}
        </Card>

        {deal && (
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-navy">{t('dr.evidence')}</h2>
            <ul className="divide-y text-sm">
              {evidence.map(([label, at, detail]) => (
                <li key={label} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className={cls('flex items-center gap-2', at ? 'text-navy' : 'text-gray-500')}>{at ? <Check size={14} className="text-brand-500" /> : <span className="inline-block h-3.5 w-3.5 rounded-full border border-gray-300" />} {label}</span>
                  <span className="tabular text-xs text-muted">{at ? `${detail ? detail + ' · ' : ''}${fmtDate(at, lang, true)}` : t('dr.ev.none')}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <FeeCard deal={deal} fee={fee} rate={rate} listing={l} isSeller={isSeller} />
        {deal && (
          <Card className="p-5">
            {dispute?.status === 'open' ? (
              <Alert><span className="flex items-center gap-2"><AlertTriangle size={14} /> {t('dispute.openNote')}</span></Alert>
            ) : dispute?.status === 'resolved' ? (
              <Alert t="green"><span className="flex items-start gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> {t('dispute.resolvedNote')}: {dispute.resolution}</span></Alert>
            ) : null}
            {party && dispute?.status !== 'open' && (
              <Button variant="danger" size="sm" className="mt-2 w-full" onClick={onDispute}><AlertTriangle size={14} /> {t('dispute.open')}</Button>
            )}
            {!party && !dispute && <p className="text-xs text-muted">{t('room.txnNote')}</p>}
          </Card>
        )}
        <Link to={`/contract/loi/${loi?.id ?? ''}`} className={cls('block', !loi && 'hidden')}><Button variant="outline" className="w-full">{t('dr.offer.full')}</Button></Link>
      </div>
    </div>
  )
}

/** Fee rate: the invoice is the source of truth once issued, otherwise the seller's current plan. */
function d_rate(deal: Deal, fee?: ReturnType<typeof feeStatus>) {
  return fee?.invoice ? Math.round((fee.invoice.amount / deal.agreedPrice) * 10000) / 100 : undefined
}

const Hint = ({ text, action }: { text: string; action?: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-700">{text}</p>{action}</div>
)

function FeeCard({ deal, fee, rate, listing, isSeller }: { deal?: Deal; fee?: ReturnType<typeof feeStatus>; rate?: number; listing: Listing; isSeller: boolean }) {
  const { t, money } = usePrefs()
  const d = useDB()
  const seller = d.users.find((u) => u.id === listing.sellerId)!
  const planRate = d.plans.find((p) => p.id === (seller.sellerPlanId ?? 'seller-free'))?.feePercent ?? 4.5
  const pct = rate ?? planRate
  const base = deal?.agreedPrice ?? 0
  const amount = fee?.invoice?.amount ?? Math.round(base * pct) / 100
  const state = fee?.state ?? 'not_due'
  const tone = ({ not_due: 'gray', unpaid: 'amber', paid: 'green', unverified: 'red' } as const)[state]
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-navy">{t('dr.fee.title')}</h2>
        <Badge t={tone}>{t('dr.fee.' + state)}</Badge>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">{t('dr.fee.rate')}</dt><dd className="tabular font-semibold">{pct}%</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t('dr.fee.base')}</dt><dd className="tabular">{deal ? money(base, deal.currency, { exact: true }) : '—'}</dd></div>
        <div className="flex justify-between border-t pt-2"><dt className="font-semibold">{t('dr.fee.amount')}</dt><dd className="tabular text-lg font-bold text-navy">{deal ? money(amount, deal.currency, { exact: true }) : '—'}</dd></div>
      </dl>
      {deal && state === 'not_due' && <p className="mt-3 text-xs text-muted">{t('dr.fee.est')}</p>}
      {state === 'paid' && fee?.payment && <p className="mt-3 text-xs text-green-700">{t('dr.fee.paidNote', { id: fee.payment.id, method: fee.payment.method })}</p>}
      {state === 'unverified' && <p className="mt-3 text-xs text-red-700">{t('dr.fee.unverifiedNote')}</p>}
      {state === 'unpaid' && fee?.invoice && (isSeller
        ? <Link to={`/checkout/${fee.invoice.id}`}><Button className="mt-3 w-full" size="sm">{t('dr.fee.pay')}</Button></Link>
        : <p className="mt-3 text-xs text-muted">{t('dr.fee.sellerOnly')}</p>)}
    </Card>
  )
}

function ChatTab({ th, run }: { th: Thread; run: Run }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const [text, setText] = useState('')
  const msgs = d.messages.filter((m) => m.threadId === th.id).sort((a, b) => a.createdAt - b.createdAt).slice(-30)
  const send = () => { if (!text.trim()) return; run(() => { chat.send(th.id, text.trim()); setText('') }) }
  return (
    <Card className="p-4 md:p-5">
      <div className="mb-3 flex justify-end"><Link to={`/messages/${th.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"><MessageSquare size={14} /> {t('dr.chat.open')}</Link></div>
      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {!msgs.length && <p className="text-sm text-muted">{t('dr.chat.empty')}</p>}
        {msgs.map((m) => m.senderId === null ? (
          <p key={m.id} className="rounded-lg bg-surface px-3 py-2 text-center text-xs text-gray-600">{t('sys.' + m.text)}</p>
        ) : (
          <div key={m.id} className={cls('flex', m.senderId === me.id ? 'justify-end' : 'justify-start')}>
            <div className={cls('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', m.senderId === me.id ? 'bg-navy text-white' : 'bg-gray-100 text-navy')}>
              {m.text && <p className="whitespace-pre-line break-words">{m.text}</p>}
              {m.file && <p className="mt-1 flex items-center gap-1 text-xs underline"><FileText size={12} /> {m.file.name}</p>}
              <p className="mt-1 text-[10px] opacity-60">{fmtDate(m.createdAt, lang, true)}</p>
            </div>
          </div>
        ))}
      </div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} aria-label={t('chat.placeholder')} />
        <Button type="submit" disabled={!text.trim()}>{t('chat.send')}</Button>
      </form>
    </Card>
  )
}

function DocsTab({ th, l, full, run }: { th: Thread; l: Listing; full: boolean; run: Run }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const [access, setAccess] = useState<'nda' | 'deal'>('nda')
  const [busy, setBusy] = useState(false)
  const party = me.id === th.buyerId || me.id === th.sellerId
  const rows = roomDocsFor(d, me.id, th.id)
  const listingDocs = full ? l.confidential.documents : []
  const chatFiles = d.messages.filter((m) => m.threadId === th.id && m.file)
  const who = (id: string) => (id === th.buyerId ? t('contract.buyer') : t('contract.seller'))

  const pick = async (f?: File) => {
    if (!f) return
    if (f.size > MAX_DOC_BYTES) return toast(t('form.docTooBig', { name: f.name }), 'error')
    setBusy(true)
    try {
      const file: FileAsset = { name: f.name, type: f.type, size: f.size, dataUrl: await readFileAsDataUrl(f) }
      run(() => room.upload(th.id, file, access), 'dr.t.upload')
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy"><FileText size={18} /> {t('room.documents')}</h2>
        {!full && <Alert><span className="flex items-center gap-2"><Lock size={14} /> {t('room.lockedUntilNda')}</span></Alert>}
        <ul className="divide-y text-sm">
          {listingDocs.map((f, i) => <DocRow key={'l' + i} file={f} meta={`${t('dr.doc.listing')} · ${fmtBytes(f.size)}`} />)}
          {rows.map((r) => r.file
            ? <DocRow key={r.id} file={r.file} meta={`${who(r.by)} · ${t('dr.doc.' + r.access)} · ${fmtBytes(r.file.size)} · ${fmtDate(r.at, lang)}`} />
            : <li key={r.id} className="flex items-center gap-2 py-2 text-gray-500"><Lock size={14} /> {t('dr.doc.locked')} <span className="text-xs">({who(r.by)} · {t('dr.doc.' + r.access)})</span></li>)}
          {chatFiles.map((m) => <DocRow key={m.id} file={m.file!} meta={`${who(m.senderId ?? '')} · ${t('dr.doc.chat')} · ${fmtBytes(m.file!.size)}`} />)}
        </ul>
        {!listingDocs.length && !rows.length && !chatFiles.length && <p className="text-sm text-muted">{t('dr.doc.empty')}</p>}
        <p className="mt-3 text-xs text-muted">{t('room.docsHint')}</p>
      </Card>

      {party && (
        <Card className="h-fit p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-navy"><Upload size={18} /> {t('dr.doc.upload')}</h2>
          {!full ? <Alert>{t('dr.doc.needNda')}</Alert> : (
            <div className="space-y-3">
              <Field label={t('dr.doc.access')}>
                <Select value={access} onChange={(e) => setAccess(e.target.value as 'nda' | 'deal')}>
                  <option value="nda">{t('dr.doc.nda')}</option>
                  <option value="deal">{t('dr.doc.deal')}</option>
                </Select>
              </Field>
              <label className={cls('flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-400 px-4 text-sm font-semibold text-brand-600 hover:bg-brand-50', busy && 'pointer-events-none opacity-50')}>
                <Upload size={16} /> {t('dr.doc.upload')}
                <input type="file" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              <p className="text-xs text-muted">{t('dr.doc.limit', { size: fmtBytes(MAX_DOC_BYTES) })}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

const DocRow = ({ file, meta }: { file: FileAsset; meta: string }) => (
  <li className="flex flex-wrap items-center justify-between gap-2 py-2">
    <a href={file.dataUrl} download={file.name} className="flex items-center gap-2 font-medium text-brand-600 hover:underline"><FileText size={14} /> {file.name}</a>
    <span className="text-xs text-muted">{meta}</span>
  </li>
)

function OffersTab({ l, loi, nda, isBuyer, isSeller, run }: { l: Listing; loi?: Loi; nda?: { status: string }; isBuyer: boolean; isSeller: boolean; run: Run }) {
  const { t, lang, money } = usePrefs()
  const me = useMe()!
  const [counter, setCounter] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const last = loi?.rounds[loi.rounds.length - 1]
  const myRole = isBuyer ? 'buyer' : isSeller ? 'seller' : null
  const myTurn = !!loi && loi.status === 'open' && !!myRole && last!.by !== myRole
  const expired = !!last && last.expiresAt < Date.now()
  const canCreate = isBuyer && (!loi || loi.status !== 'open') && !(loi && loi.status === 'accepted')

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-navy">{t('dr.offer.history')}</h2>
          {loi && <StatusBadge status={loi.status} />}
        </div>
        {!loi ? <p className="text-sm text-muted">{t('dr.offer.none')}</p> : (
          <ol className="space-y-3">
            {loi.rounds.map((r, i) => (
              <li key={i} className={cls('rounded-lg border p-3 text-sm', i === loi.rounds.length - 1 ? 'border-brand-400 bg-brand-50/40' : 'border-gray-200')}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold">{t('loi.round', { n: i + 1 })} — {r.by === 'buyer' ? t('contract.buyer') : t('contract.seller')}</span>
                  <span className="text-muted">{fmtDate(r.signature.at, lang, true)}</span>
                </div>
                <p className="tabular mt-1 text-lg font-bold text-navy">{money(r.price, r.currency, { exact: true })}</p>
                <p className="text-xs text-muted">{t('loi.deposit')} {money(r.deposit, r.currency, { exact: true })} · {t('loi.ddDays')} {t('loi.days', { n: r.ddDays })} · {t('loi.expires')} {fmtDate(r.expiresAt, lang)}</p>
                {r.conditions && <p className="mt-1 whitespace-pre-line text-xs text-gray-600">{r.conditions}</p>}
              </li>
            ))}
          </ol>
        )}

        {loi?.status === 'open' && myRole && (
          <div className="mt-5 border-t pt-4">
            {myTurn ? (
              <>
                {expired && <div className="mb-3"><Alert t="red">{t('loi.expiredNote')}</Alert></div>}
                <p className="mb-3 text-sm font-semibold">{t('loi.yourTurn')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={expired} onClick={() => setAcceptOpen(true)}><Check size={16} /> {t('loi.accept')}</Button>
                  <Button variant="outline" onClick={() => setCounter(!counter)}><Repeat size={16} /> {t('loi.counter')}</Button>
                  <Button variant="danger" onClick={() => run(() => lois.respond(loi.id, 'reject'), 'dr.t.offer')}><X size={16} /> {t('common.reject')}</Button>
                </div>
                {counter && (
                  <div className="mt-4 rounded-lg border p-4">
                    <LoiForm listing={l} initial={last} submitLabel={t('loi.sendCounter')} onSubmit={(r) => run(() => { lois.respond(loi.id, 'counter', { signatureName: r.signatureName, round: r }); setCounter(false) }, 'dr.t.offer')} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Alert>{t('loi.waiting')}</Alert>
                {isBuyer && <Button variant="ghost" size="sm" onClick={() => run(() => lois.respond(loi.id, 'withdraw'), 'dr.t.offer')}>{t('loi.withdraw')}</Button>}
              </div>
            )}
          </div>
        )}
      </Card>

      {canCreate && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-navy">{t('dr.offer.new')}</h2>
          {nda?.status !== 'approved' ? <Alert>{t('dr.offer.needNda')}</Alert> : (
            <LoiForm listing={l} submitLabel={t('loi.send')} onSubmit={(r) => run(() => { lois.create(l.id, r) }, 'dr.t.offer')} />
          )}
        </Card>
      )}
      {isSeller && !loi && <Alert>{t('dr.offer.sellerWait')}</Alert>}

      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title={t('loi.accept')}>
        {last && <p className="mb-3 text-sm">{t('loi.acceptConfirm', { price: money(last.price, last.currency, { exact: true }) })}</p>}
        <SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} />
        <div className="mt-4 flex justify-end">
          <Button disabled={!agreed || !name.trim()} onClick={() => run(() => { lois.respond(loi!.id, 'accept', { signatureName: name }); setAcceptOpen(false) }, 'dr.t.offer')}>{t('loi.accept')}</Button>
        </div>
      </Modal>
    </div>
  )
}

type Ev = { at: number; text: string; by?: string }

function ActivityTab({ th, l, deal, loi }: { th: Thread; l: Listing; deal?: Deal; loi?: Loi }) {
  const d = useDB()
  const { t, lang, money } = usePrefs()
  const nda = d.ndas.filter((n) => n.listingId === l.id && n.buyerId === th.buyerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const ev: Ev[] = []
  if (nda) {
    ev.push({ at: nda.createdAt, text: t('dr.act.nda_signed') })
    if (nda.decidedAt) ev.push({ at: nda.decidedAt, text: t('dr.act.nda_' + (nda.status === 'approved' ? 'approved' : 'rejected')) })
  }
  loi?.rounds.forEach((r) => ev.push({ at: r.signature.at, text: t(r.by === 'buyer' ? 'dr.act.loi_buyer' : 'dr.act.loi_seller', { price: money(r.price, r.currency, { exact: true }) }), by: r.signature.name }))
  if (loi?.acceptedSignature) ev.push({ at: loi.acceptedSignature.at, text: t('dr.act.loi_accepted'), by: loi.acceptedSignature.name })
  d.roomDocs.filter((x) => x.threadId === th.id).forEach((x) => ev.push({ at: x.at, text: t('dr.act.doc', { name: x.file.name }), by: d.users.find((u) => u.id === x.by)?.name }))
  if (deal) {
    ev.push({ at: deal.createdAt, text: t('dr.act.deal', { price: money(deal.agreedPrice, deal.currency, { exact: true }) }) })
    if (deal.dd) ev.push({ at: deal.dd.at, text: t('dr.ev.dd'), by: d.users.find((u) => u.id === deal.dd!.by)?.name })
    if (deal.contract?.buyer) ev.push({ at: deal.contract.buyer.at, text: t('dr.ev.signB'), by: deal.contract.buyer.name })
    if (deal.contract?.seller) ev.push({ at: deal.contract.seller.at, text: t('dr.ev.signS'), by: deal.contract.seller.name })
    if (deal.transaction?.buyerPaidAt) ev.push({ at: deal.transaction.buyerPaidAt, text: t('dr.ev.paid') })
    if (deal.transaction?.sellerReceivedAt) ev.push({ at: deal.transaction.sellerReceivedAt, text: t('dr.ev.received') })
    if (deal.handoverAt) ev.push({ at: deal.handoverAt, text: t('dr.ev.handover') })
    if (deal.buyerConfirm) ev.push({ at: deal.buyerConfirm.at, text: t('dr.ev.closeB') })
    if (deal.sellerConfirm) ev.push({ at: deal.sellerConfirm.at, text: t('dr.ev.closeS') })
    if (deal.closedAt) ev.push({ at: deal.closedAt, text: t('dr.act.closed') })
    const f = feeStatus(d, deal)
    if (f.invoice) ev.push({ at: f.invoice.createdAt, text: t('dr.act.invoice', { amount: money(f.invoice.amount, f.invoice.currency, { exact: true }) }) })
    if (f.state === 'paid' && f.payment) ev.push({ at: f.payment.createdAt, text: t('dr.act.feePaid') })
  }
  ev.sort((a, b) => b.at - a.at)
  return (
    <Card className="p-5">
      {!ev.length ? <p className="text-sm text-muted">{t('dr.act.empty')}</p> : (
        <ol className="relative space-y-4 border-l-2 border-gray-200 pl-5">
          {ev.map((e, i) => (
            <li key={i} className="relative">
              <span aria-hidden="true" className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-400" />
              <p className="text-sm font-medium text-navy">{e.text}</p>
              <p className="tabular text-xs text-muted">{fmtDate(e.at, lang, true)}{e.by ? ` · ${e.by}` : ''}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
