import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Currency, Listing, LoiRound } from '../lib/types'
import { usePrefs } from '../lib/prefs'
import { lois, ndas, useMe, type RoundInput } from '../lib/store'
import { ndaText } from '../lib/contracts'
import { DAY, fmtDate } from '../lib/utils'
import { Alert, Button, Field, Input, Modal, Select, Textarea, useErrorText } from './ui'

export function SignBox({ name, setName, agreed, setAgreed }: { name: string; setName: (s: string) => void; agreed: boolean; setAgreed: (b: boolean) => void }) {
  const { t } = usePrefs()
  return (
    <div className="space-y-3 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
      <Field label={t('sign.typeName')} hint={t('sign.hint')}>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="font-[cursive] text-lg" />
      </Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
        <span>{t('sign.agree')}</span>
      </label>
    </div>
  )
}

export function NdaModal({ listing, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const { t, lang } = usePrefs()
  const me = useMe()!
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const err = useErrorText()
  const submit = () => {
    try {
      ndas.request(listing.id, name.trim())
      onClose()
    } catch (e) {
      setError(err(e))
    }
  }
  return (
    <Modal open={open} onClose={onClose} title={t('nda.title')} wide>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-4 text-sm leading-relaxed">
        {ndaText(lang, { buyer: me.name, listing: listing.displayName, date: fmtDate(Date.now(), lang) }).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <div className="mt-4"><SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} /></div>
      {error && <div className="mt-3"><Alert t="red">{error}</Alert></div>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        <Button disabled={!agreed || !name.trim()} onClick={submit}>{t('nda.signSubmit')}</Button>
      </div>
    </Modal>
  )
}

/** Used both for a new LOI and for a counter-offer. */
export function LoiForm({ listing, initial, onSubmit, submitLabel }: {
  listing: Listing
  initial?: LoiRound
  onSubmit: (r: RoundInput) => void
  submitLabel: string
}) {
  const { t } = usePrefs()
  const me = useMe()!
  const [price, setPrice] = useState(String(initial?.price ?? listing.askingPrice))
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? listing.currency)
  const [deposit, setDeposit] = useState(String(initial?.deposit ?? Math.round(listing.askingPrice * 0.1)))
  const [ddDays, setDd] = useState(String(initial?.ddDays ?? 30))
  const [validDays, setValid] = useState('7')
  const [conditions, setConditions] = useState(initial?.conditions ?? '')
  const [name, setName] = useState(me.name)
  const [agreed, setAgreed] = useState(false)
  const ok = Number(price) > 0 && Number(deposit) >= 0 && Number(ddDays) > 0 && agreed && name.trim()
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Field label={t('loi.price')}><Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label={t('loi.currency')}>
          <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}><option>THB</option><option>USD</option></Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t('loi.deposit')}><Input type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} /></Field>
        <Field label={t('loi.ddDays')}><Input type="number" min={1} value={ddDays} onChange={(e) => setDd(e.target.value)} /></Field>
        <Field label={t('loi.validDays')}><Input type="number" min={1} value={validDays} onChange={(e) => setValid(e.target.value)} /></Field>
      </div>
      <Field label={t('loi.conditions')}>
        <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder={t('loi.conditionsPh')} />
      </Field>
      <SignBox name={name} setName={setName} agreed={agreed} setAgreed={setAgreed} />
      <div className="flex justify-end">
        <Button
          disabled={!ok}
          onClick={() =>
            onSubmit({
              price: Number(price), currency, deposit: Number(deposit), ddDays: Number(ddDays), conditions,
              expiresAt: Date.now() + Number(validDays || 7) * DAY, signatureName: name.trim(),
            })
          }
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

export function LoiModal({ listing, open, onClose }: { listing: Listing; open: boolean; onClose: () => void }) {
  const { t } = usePrefs()
  const nav = useNavigate()
  const [error, setError] = useState('')
  const err = useErrorText()
  return (
    <Modal open={open} onClose={onClose} title={t('loi.title')} wide>
      <p className="mb-4 text-sm text-gray-500">{t('loi.intro')}</p>
      {error && <div className="mb-3"><Alert t="red">{error}</Alert></div>}
      <LoiForm
        listing={listing}
        submitLabel={t('loi.send')}
        onSubmit={(r) => {
          try {
            const id = lois.create(listing.id, r)
            onClose()
            nav(`/contract/loi/${id}`)
          } catch (e) {
            setError(err(e))
          }
        }}
      />
    </Modal>
  )
}
