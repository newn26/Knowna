import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Printer, Repeat, X } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { lois, ndas, useDB, useMe } from '../lib/store'
import { loiPreamble, ndaText } from '../lib/contracts'
import type { Signature } from '../lib/types'
import { cls, fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, Card, Empty, Modal, StatusBadge, useErrorText } from '../components/ui'
import { LoiForm, SignBox } from '../components/ContractForms'

function SigLine({ label, sig }: { label: string; sig?: Signature }) {
  const { lang, t } = usePrefs()
  return (
    <div className="flex-1 border-t-2 border-gray-300 pt-2">
      <p className="text-xs text-muted">{label}</p>
      {sig ? (
        <>
          <p className="font-[cursive] text-xl text-brand-700">{sig.name}</p>
          <p className="text-[11px] text-muted">{t('contract.signedAt')} {fmtDate(sig.at, lang, true)}</p>
        </>
      ) : <p className="py-2 text-sm italic text-muted">{t('contract.notSigned')}</p>}
    </div>
  )
}

export default function Contract() {
  const { kind, id } = useParams()
  const d = useDB()
  const me = useMe()!
  const { t } = usePrefs()
  const doc = kind === 'nda' ? d.ndas.find((n) => n.id === id) : d.lois.find((o) => o.id === id)
  if (!doc || (doc.buyerId !== me.id && doc.sellerId !== me.id && !me.isAdmin)) return <Page><Empty title={t('contract.notFound')} /></Page>
  return kind === 'nda' ? <NdaDoc id={doc.id} /> : <LoiDoc id={doc.id} />
}

function DocShell({ title, status, listingId, children }: { title: string; status: string; listingId: string; children: React.ReactNode }) {
  const { t } = usePrefs()
  const d = useDB()
  const l = d.listings.find((x) => x.id === listingId)
  return (
    <Page className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to={`/listing/${listingId}`} className="text-sm text-brand-500">← {l?.displayName}</Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> {t('contract.pdf')}</Button>
      </div>
      <Card className="p-8 print:border-0 print:p-0">
        <div className="mb-6 flex items-start justify-between border-b pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">BizMarket</p>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted">{l?.displayName}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        {children}
      </Card>
    </Page>
  )
}

function NdaDoc({ id }: { id: string }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const err = useErrorText()
  const n = d.ndas.find((x) => x.id === id)!
  const l = d.listings.find((x) => x.id === n.listingId)!
  const buyer = d.users.find((u) => u.id === n.buyerId)!
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const act = (approve: boolean) => {
    try { ndas.decide(n.id, approve, name) } catch (e) { setError(err(e)) }
  }
  return (
    <DocShell title={t('nda.title')} status={n.status} listingId={l.id}>
      <div className="space-y-3 text-sm leading-relaxed">
        {ndaText(lang, { buyer: buyer.name, listing: l.displayName, date: fmtDate(n.createdAt, lang) }).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-10 flex gap-8">
        <SigLine label={t('contract.recipient')} sig={n.buyerSignature} />
        <SigLine label={t('contract.discloser')} sig={n.sellerSignature} />
      </div>
      {n.status === 'pending' && me.id === n.sellerId && (
        <div className="mt-8 space-y-3 print:hidden">
          <Alert t="blue">{t('nda.sellerPrompt', { name: buyer.name })}</Alert>
          <SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} />
          {error && <Alert t="red">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="danger" onClick={() => act(false)}><X size={16} /> {t('common.reject')}</Button>
            <Button disabled={!agreed || !name.trim()} onClick={() => act(true)}><Check size={16} /> {t('nda.approve')}</Button>
          </div>
        </div>
      )}
      {n.status === 'pending' && me.id === n.buyerId && <div className="mt-6 print:hidden"><Alert>{t('detail.ndaPending')}</Alert></div>}
    </DocShell>
  )
}

function LoiDoc({ id }: { id: string }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang, money } = usePrefs()
  const err = useErrorText()
  const o = d.lois.find((x) => x.id === id)!
  const l = d.listings.find((x) => x.id === o.listingId)!
  const buyer = d.users.find((u) => u.id === o.buyerId)!
  const seller = d.users.find((u) => u.id === o.sellerId)!
  const last = o.rounds[o.rounds.length - 1]
  const myRole = o.buyerId === me.id ? 'buyer' : o.sellerId === me.id ? 'seller' : null
  const myTurn = o.status === 'open' && myRole && last.by !== myRole
  const expired = last.expiresAt < Date.now()
  const [counter, setCounter] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const run = (f: () => void) => { setError(''); try { f() } catch (e) { setError(err(e)) } }
  const deal = d.deals.find((x) => x.loiId === o.id)

  return (
    <DocShell title={t('loi.title')} status={o.status} listingId={l.id}>
      <p className="text-sm leading-relaxed">{loiPreamble(lang, { buyer: buyer.name, listing: l.displayName })}</p>

      <div className="mt-6 space-y-4">
        {o.rounds.map((r, i) => {
          const isLast = i === o.rounds.length - 1
          return (
            <div key={i} className={cls('rounded-lg border p-4', isLast ? 'border-brand-500 bg-brand-50/40' : 'opacity-70')}>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-semibold">{t('loi.round', { n: i + 1 })} — {r.by === 'buyer' ? t('contract.buyer') : t('contract.seller')}</span>
                <span className="text-muted">{fmtDate(r.signature.at, lang, true)}</span>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row k={t('loi.price')} v={<b>{money(r.price, r.currency, { exact: true })}</b>} />
                <Row k={t('loi.deposit')} v={money(r.deposit, r.currency, { exact: true })} />
                <Row k={t('loi.ddDays')} v={t('loi.days', { n: r.ddDays })} />
                <Row k={t('loi.expires')} v={<span className={cls(isLast && r.expiresAt < Date.now() && 'text-red-600')}>{fmtDate(r.expiresAt, lang)}</span>} />
                {r.conditions && <div className="sm:col-span-2"><Row k={t('loi.conditions')} v={<span className="whitespace-pre-line">{r.conditions}</span>} /></div>}
              </dl>
              <p className="mt-3 text-xs text-muted">{t('contract.signedBy')} <span className="font-[cursive] text-base text-brand-700">{r.signature.name}</span></p>
            </div>
          )
        })}
      </div>

      <div className="mt-10 flex gap-8">
        <SigLine label={`${t('contract.buyer')} — ${buyer.name}`} sig={o.status === 'accepted' && last.by === 'seller' ? o.acceptedSignature : o.rounds.filter((r) => r.by === 'buyer').pop()?.signature} />
        <SigLine label={`${t('contract.seller')} — ${seller.name}`} sig={o.status === 'accepted' && last.by === 'buyer' ? o.acceptedSignature : o.rounds.filter((r) => r.by === 'seller').pop()?.signature} />
      </div>
      {o.status === 'accepted' && (
        <div className="mt-6 print:hidden"><Alert t="green">{t('loi.acceptedNote')} <Link to="/dashboard?tab=deals" className="font-semibold underline">{t('loi.goDeal')}</Link>{deal?.status === 'closed' && ` · ${t('status.closed')}`}</Alert></div>
      )}

      {error && <div className="mt-4"><Alert t="red">{error}</Alert></div>}
      {o.status === 'open' && myRole && (
        <div className="mt-8 border-t pt-6 print:hidden">
          {myTurn ? (
            <>
              {expired && <div className="mb-3"><Alert t="red">{t('loi.expiredNote')}</Alert></div>}
              <p className="mb-3 text-sm font-semibold">{t('loi.yourTurn')}</p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={expired} onClick={() => setAcceptOpen(true)}><Check size={16} /> {t('loi.accept')}</Button>
                <Button variant="outline" onClick={() => setCounter(!counter)}><Repeat size={16} /> {t('loi.counter')}</Button>
                <Button variant="danger" onClick={() => run(() => lois.respond(o.id, 'reject'))}><X size={16} /> {t('common.reject')}</Button>
              </div>
              {counter && (
                <div className="mt-6 rounded-lg border p-4">
                  <LoiForm listing={l} initial={last} submitLabel={t('loi.sendCounter')} onSubmit={(r) => run(() => { lois.respond(o.id, 'counter', { signatureName: r.signatureName, round: r }); setCounter(false) })} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Alert>{t('loi.waiting')}</Alert>
              {myRole === 'buyer' && <Button variant="ghost" size="sm" onClick={() => run(() => lois.respond(o.id, 'withdraw'))}>{t('loi.withdraw')}</Button>}
            </div>
          )}
        </div>
      )}

      <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title={t('loi.accept')}>
        <p className="mb-3 text-sm">{t('loi.acceptConfirm', { price: money(last.price, last.currency, { exact: true }) })}</p>
        <SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} />
        <div className="mt-4 flex justify-end">
          <Button disabled={!agreed || !name.trim()} onClick={() => run(() => { lois.respond(o.id, 'accept', { signatureName: name }); setAcceptOpen(false) })}>{t('loi.accept')}</Button>
        </div>
      </Modal>
    </DocShell>
  )
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div><dt className="text-xs text-muted">{k}</dt><dd>{v}</dd></div>
)
