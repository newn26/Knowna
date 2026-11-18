import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, CreditCard, Loader2, QrCode, XCircle } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { billing, useDB, useMe } from '../lib/store'
import { DECLINED_TEST_CARD, paymentProvider } from '../lib/payment'
import { cls, fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, Card, Empty, Field, Input } from '../components/ui'

export default function Checkout() {
  const { invoiceId } = useParams()
  const d = useDB()
  const me = useMe()!
  const { t, L, lang, money } = usePrefs()
  const inv = d.invoices.find((i) => i.id === invoiceId)
  const [method, setMethod] = useState<'card' | 'promptpay'>('card')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [exp, setExp] = useState('12/30')
  const [cvc, setCvc] = useState('123')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!inv || inv.userId !== me.id) return <Page><Empty title={t('checkout.notFound')} /></Page>
  const payment = inv.paymentId ? d.payments.find((p) => p.id === inv.paymentId) : undefined

  const pay = async (simulateFailure = false) => {
    setBusy(true)
    setFailed(false)
    const r = await paymentProvider.charge({ amount: inv.amount, currency: inv.currency, method, cardNumber: card, simulateFailure })
    billing.recordPayment(inv.id, r.ok, method, `${r.detail} · ${r.reference}`)
    setFailed(!r.ok)
    setBusy(false)
  }

  if (inv.status === 'paid')
    return (
      <Page className="max-w-lg">
        <Card className="p-8 text-center">
          <CheckCircle2 size={56} className="mx-auto text-green-500" />
          <h1 className="mt-4 text-2xl font-bold">{t('checkout.success')}</h1>
          <p className="mt-2 text-sm text-gray-500">{L(inv.description)}</p>
          <div className="mt-6 space-y-2 rounded-lg bg-surface p-4 text-left text-sm">
            <Row k={t('checkout.receiptNo')} v={inv.id.toUpperCase()} />
            <Row k={t('billing.amount')} v={money(inv.amount, inv.currency, { exact: true })} />
            <Row k={t('checkout.paidAt')} v={fmtDate(inv.paidAt!, lang, true)} />
            <Row k={t('checkout.method')} v={payment?.detail ?? '-'} />
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>{t('checkout.printReceipt')}</Button>
            <Link to="/dashboard?tab=billing"><Button>{t('checkout.back')}</Button></Link>
          </div>
        </Card>
      </Page>
    )

  return (
    <Page className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">{t('checkout.title')}</h1>
      <div className="mb-4"><Alert t="blue">{t('checkout.demoNote')}</Alert></div>
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <Card className="p-6">
          <div className="mb-5 grid grid-cols-2 gap-2">
            {([['card', <CreditCard key="c" size={18} />], ['promptpay', <QrCode key="q" size={18} />]] as const).map(([m, icon]) => (
              <button key={m} onClick={() => setMethod(m)} className={cls('flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold', method === m ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200')}>
                {icon} {t('checkout.' + m)}
              </button>
            ))}
          </div>
          {method === 'card' ? (
            <div className="space-y-4">
              <Field label={t('checkout.cardNumber')} hint={t('checkout.testCards', { bad: DECLINED_TEST_CARD })}><Input value={card} onChange={(e) => setCard(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="MM/YY"><Input value={exp} onChange={(e) => setExp(e.target.value)} /></Field>
                <Field label="CVC"><Input value={cvc} onChange={(e) => setCvc(e.target.value)} /></Field>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <FakeQr seed={inv.id} />
              <p className="text-sm text-gray-500">{t('checkout.scan')}</p>
            </div>
          )}
          {failed && <div className="mt-4"><Alert t="red"><span className="flex items-center gap-2"><XCircle size={16} /> {t('checkout.failed')}</span></Alert></div>}
          <Button className="mt-6 w-full" size="lg" disabled={busy} onClick={() => pay(false)}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : null}
            {method === 'card' ? t('checkout.payAmount', { amount: money(inv.amount, inv.currency, { exact: true }) }) : t('checkout.iPaid')}
          </Button>
          <button disabled={busy} onClick={() => pay(true)} className="mt-3 w-full text-center text-xs text-muted underline">{t('checkout.simulateFail')}</button>
        </Card>
        <Card className="h-fit p-6">
          <p className="text-xs font-semibold uppercase text-muted">{t('checkout.summary')}</p>
          <p className="mt-2 text-sm font-semibold">{L(inv.description)}</p>
          <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>{t('checkout.total')}</span><span>{money(inv.amount, inv.currency, { exact: true })}</span></div>
          <p className="mt-2 text-xs text-muted">{t('checkout.provider', { name: paymentProvider.name })}</p>
        </Card>
      </div>
    </Page>
  )
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-4"><span className="text-muted">{k}</span><span className="font-semibold">{v}</span></div>

/** Decorative QR-like grid (not a real PromptPay payload). */
function FakeQr({ seed }: { seed: string }) {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0
    const x = i % 21, y = Math.floor(i / 21)
    const finder = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7
    if (finder(0, 0) || finder(14, 0) || finder(0, 14)) {
      const lx = x % 14 === x ? x : x - 14, ly = y % 14 === y ? y : y - 14
      const r = Math.max(Math.abs(lx - 3), Math.abs(ly - 3))
      return r !== 2
    }
    return (h >> 16) % 2 === 0
  })
  return (
    <div className="rounded-xl border-4 border-[#113566] bg-white p-3">
      <p className="mb-2 text-center text-xs font-bold text-[#113566]">PromptPay (DEMO)</p>
      <svg viewBox="0 0 21 21" width="180" height="180" shapeRendering="crispEdges">
        {cells.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width="1" height="1" fill="#111" />)}
      </svg>
    </div>
  )
}
