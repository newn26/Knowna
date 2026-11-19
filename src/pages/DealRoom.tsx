import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Check, FileText, Lock, MessageSquare, ShieldCheck } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { canViewFull, deals, disputes, useDB, useMe } from '../lib/store'
import { cls, fmtBytes, fmtDate } from '../lib/utils'
import type { FileAsset } from '../lib/types'
import { Page } from '../components/Layout'
import { Alert, Badge, Button, Card, Empty, Img, Modal, StatusBadge, Textarea, useErrorText } from '../components/ui'

type StepState = 'done' | 'current' | 'todo'

/**
 * Deal Room: one page per (listing × buyer) that follows the SCAMPER flow
 * Match → NDA → Deal Room → Negotiation → Transaction, with every shared document in one place.
 */
export default function DealRoom() {
  const { threadId } = useParams()
  const d = useDB()
  const me = useMe()!
  const { t, lang, money } = usePrefs()
  const err = useErrorText()
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const th = d.threads.find((x) => x.id === threadId)
  if (!th || (th.buyerId !== me.id && th.sellerId !== me.id && !me.isAdmin)) return <Page><Empty title={t('room.notFound')} /></Page>
  const l = d.listings.find((x) => x.id === th.listingId)!
  const buyer = d.users.find((u) => u.id === th.buyerId)!
  const seller = d.users.find((u) => u.id === th.sellerId)!
  const isBuyer = me.id === th.buyerId
  const isSeller = me.id === th.sellerId

  const pitch = d.pitches.find((p) => p.listingId === l.id && p.buyerId === th.buyerId)
  const nda = d.ndas.filter((n) => n.listingId === l.id && n.buyerId === th.buyerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const loi = d.lois.filter((o) => o.listingId === l.id && o.buyerId === th.buyerId).sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const deal = d.deals.filter((x) => x.listingId === l.id && x.buyerId === th.buyerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const dispute = deal && d.disputes.filter((x) => x.dealId === deal.id).sort((a, b) => b.createdAt - a.createdAt)[0]
  const full = canViewFull(d, th.buyerId, l)

  // Documents: confidential files on the listing (after NDA) + everything attached in chat.
  const chatFiles = d.messages.filter((m) => m.threadId === th.id && m.file).map((m) => ({ file: m.file as FileAsset, by: m.senderId, at: m.createdAt }))
  const listingDocs = full ? l.confidential.documents.map((f) => ({ file: f, by: l.sellerId, at: l.updatedAt })) : []
  const docs = [...listingDocs, ...chatFiles]

  const steps: { key: string; state: StepState; detail: string }[] = [
    { key: 'match', state: 'done', detail: pitch ? t('room.matchPitch') : t('room.matchDirect') },
    { key: 'nda', state: nda?.status === 'approved' ? 'done' : 'current', detail: nda ? t('status.' + nda.status) : t('room.notStarted') },
    { key: 'room', state: !full ? 'todo' : docs.length ? 'done' : 'current', detail: full ? t('room.nDocs', { n: docs.length }) : t('room.lockedUntilNda') },
    { key: 'negotiation', state: loi?.status === 'accepted' ? 'done' : loi ? 'current' : 'todo', detail: loi ? `LOI: ${t('status.' + loi.status)} · ${t('loi.round', { n: loi.rounds.length })}` : t('room.notStarted') },
    { key: 'transaction', state: deal?.status === 'closed' ? 'done' : deal ? 'current' : 'todo', detail: deal ? t('status.' + deal.status) : t('room.notStarted') },
  ]

  const run = (f: () => void) => { setError(''); try { f() } catch (e) { setError(err(e)) } }

  return (
    <Page className="max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Img src={l.coverImages[0]} alt="" className="h-14 w-14 rounded-lg" />
          <div>
            <p className="text-xs font-semibold uppercase text-brand-500">Deal Room</p>
            <h1 className="text-xl font-bold">{l.displayName}</h1>
            <p className="text-xs text-muted">{t('contract.buyer')}: {buyer.name} · {t('contract.seller')}: {full || !isBuyer ? seller.name : t('detail.sellerHidden')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/messages/${th.id}`}><Button variant="outline" size="sm"><MessageSquare size={14} /> {t('room.chat')}</Button></Link>
          <Link to={`/listing/${l.id}`}><Button variant="ghost" size="sm">{t('req.viewListing')}</Button></Link>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-5">
        <ol className="grid gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.key} className={cls('rounded-lg border p-3', s.state === 'done' ? 'border-green-200 bg-green-50' : s.state === 'current' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white')}>
              <div className="flex items-center gap-2">
                <span className={cls('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', s.state === 'done' ? 'bg-green-600 text-white' : s.state === 'current' ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500')}>
                  {s.state === 'done' ? <Check size={14} /> : i + 1}
                </span>
                <span className="text-sm font-semibold">{t('room.step.' + s.key)}</span>
              </div>
              <p className="mt-1 text-xs text-gray-600">{s.detail}</p>
            </li>
          ))}
        </ol>
      </Card>

      {error && <div className="mt-4"><Alert t="red">{error}</Alert></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Documents */}
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText size={18} /> {t('room.documents')}</h2>
          {!full ? (
            <Alert><span className="flex items-center gap-2"><Lock size={14} /> {t('room.lockedUntilNda')}</span></Alert>
          ) : !docs.length ? (
            <p className="text-sm text-muted">{t('room.noDocs')}</p>
          ) : (
            <ul className="divide-y text-sm">
              {docs.map((x, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <a href={x.file.dataUrl} download={x.file.name} className="flex items-center gap-2 font-medium text-brand-600 hover:underline"><FileText size={14} /> {x.file.name}</a>
                  <span className="text-xs text-muted">{fmtBytes(x.file.size)} · {x.by === th.buyerId ? t('contract.buyer') : t('contract.seller')} · {fmtDate(x.at, lang)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">{t('room.docsHint')}</p>

          <h2 className="mb-2 mt-6 font-semibold">{t('room.contracts')}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {nda ? <Link to={`/contract/nda/${nda.id}`}><Badge t="blue">NDA · {t('status.' + nda.status)}</Badge></Link> : <Badge>NDA · {t('room.notStarted')}</Badge>}
            {loi ? <Link to={`/contract/loi/${loi.id}`}><Badge t="blue">LOI · {t('status.' + loi.status)}</Badge></Link> : <Badge>LOI · {t('room.notStarted')}</Badge>}
          </div>
          {pitch?.offerPrice != null && <p className="mt-3 text-xs text-gray-600">{t('room.pitchOffer')}: {money(pitch.offerPrice, l.currency, { exact: true })}</p>}
        </Card>

        {/* Transaction */}
        <Card className="h-fit p-5">
          <h2 className="mb-3 font-semibold">{t('room.step.transaction')}</h2>
          {!deal ? (
            <p className="text-sm text-muted">{t('room.noDeal')}</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted">{t('deal.agreed')}</span><b>{money(deal.agreedPrice, deal.currency, { exact: true })}</b></div>
              <div className="flex items-center justify-between"><span className="text-muted">{t('dash.col.status')}</span><StatusBadge status={deal.status} /></div>
              <ul className="space-y-1 rounded-lg bg-surface p-3 text-xs">
                <li className={deal.transaction?.buyerPaidAt ? 'text-green-700' : 'text-gray-500'}>{deal.transaction?.buyerPaidAt ? '✓' : '○'} {t('room.txnPaid')}{deal.transaction?.buyerPaidAt && ` · ${fmtDate(deal.transaction.buyerPaidAt, lang, true)}`}</li>
                <li className={deal.transaction?.sellerReceivedAt ? 'text-green-700' : 'text-gray-500'}>{deal.transaction?.sellerReceivedAt ? '✓' : '○'} {t('room.txnReceived')}{deal.transaction?.sellerReceivedAt && ` · ${fmtDate(deal.transaction.sellerReceivedAt, lang, true)}`}</li>
                <li className={deal.status === 'closed' ? 'text-green-700' : 'text-gray-500'}>{deal.status === 'closed' ? '✓' : '○'} {t('room.txnClosed')}</li>
              </ul>
              {deal.status === 'in_progress' && (
                <div className="space-y-2">
                  {isBuyer && !deal.transaction?.buyerPaidAt && <Button className="w-full" onClick={() => run(() => deals.markPaid(deal.id))}>{t('room.btnPaid')}</Button>}
                  {isSeller && deal.transaction?.buyerPaidAt && !deal.transaction.sellerReceivedAt && <Button className="w-full" onClick={() => run(() => deals.markReceived(deal.id))}>{t('room.btnReceived')}</Button>}
                  <Link to="/dashboard?tab=deals" className="block"><Button variant="outline" className="w-full">{t('room.goConfirm')}</Button></Link>
                </div>
              )}
              <p className="text-[11px] text-muted">{t('room.txnNote')}</p>
              <div className="border-t pt-3">
                {dispute?.status === 'open' ? (
                  <Alert><span className="flex items-center gap-2"><AlertTriangle size={14} /> {t('dispute.openNote')}</span></Alert>
                ) : dispute?.status === 'resolved' ? (
                  <Alert t="green"><span className="flex items-start gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> {t('dispute.resolvedNote')}: {dispute.resolution}</span></Alert>
                ) : null}
                {(isBuyer || isSeller) && dispute?.status !== 'open' && (
                  <Button variant="danger" size="sm" className="mt-2 w-full" onClick={() => setDisputeOpen(true)}><AlertTriangle size={14} /> {t('dispute.open')}</Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

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
