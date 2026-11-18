import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { FileText, ImagePlus, Lock, Trash2, X } from 'lucide-react'
import { CATEGORIES, MAX_COVER_IMAGES, MAX_DOC_BYTES, PROVINCES } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { activeListingCount, auth, listings, planOf, unpaidFeeInvoices, useDB, useMe, useSession, type ListingInput } from '../lib/store'
import type { Currency, FileAsset } from '../lib/types'
import { compressImage, fmtBytes, readFileAsDataUrl } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, Card, Field, Img, Input, Select, Textarea, useErrorText } from '../components/ui'

const empty: ListingInput = {
  displayName: '', category: 'food', province: 'bangkok', currency: 'THB', askingPrice: 0, annualRevenue: 0, netProfit: 0,
  yearEstablished: new Date().getFullYear() - 3, employees: 1, reasonForSale: '', description: '', coverImages: [],
  confidential: { legalName: '', address: '', images: [], documents: [] },
}

export default function ListingForm() {
  const { id } = useParams()
  const d = useDB()
  const me = useMe()!
  const session = useSession()!
  const { t, L, money } = usePrefs()
  const nav = useNavigate()
  const err = useErrorText()
  const existing = id ? d.listings.find((l) => l.id === id) : undefined
  const [f, setF] = useState<ListingInput>(() => (existing ? { ...existing } : empty))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (id && (!existing || existing.sellerId !== me.id)) return <Navigate to="/dashboard" replace />
  if (existing && ['sold', 'under_offer'].includes(existing.status)) return <Navigate to={`/listing/${existing.id}`} replace />

  const plan = planOf(d, me, 'seller')
  const unpaid = unpaidFeeInvoices(d, me.id)
  const used = activeListingCount(d, me.id)

  const set = <K extends keyof ListingInput>(k: K, v: ListingInput[K]) => setF((x) => ({ ...x, [k]: v }))
  const setC = <K extends keyof ListingInput['confidential']>(k: K, v: ListingInput['confidential'][K]) =>
    setF((x) => ({ ...x, confidential: { ...x.confidential, [k]: v } }))

  const addImages = async (files: FileList | null, target: 'cover' | 'conf') => {
    if (!files) return
    setBusy(true)
    try {
      const urls = await Promise.all([...files].map((file) => compressImage(file)))
      if (target === 'cover') set('coverImages', [...f.coverImages, ...urls].slice(0, MAX_COVER_IMAGES))
      else setC('images', [...f.confidential.images, ...urls].slice(0, 10))
    } catch {
      setError(t('form.imageError'))
    }
    setBusy(false)
  }
  const addDocs = async (files: FileList | null) => {
    if (!files) return
    const docs: FileAsset[] = []
    for (const file of [...files]) {
      if (file.size > MAX_DOC_BYTES) { setError(t('form.docTooBig', { name: file.name })); continue }
      docs.push({ name: file.name, type: file.type, size: file.size, dataUrl: await readFileAsDataUrl(file) })
    }
    setC('documents', [...f.confidential.documents, ...docs])
  }

  const valid = f.displayName.trim() && f.description.trim() && f.askingPrice > 0 && f.coverImages.length > 0
  const save = (submit: boolean) => {
    setError('')
    if (submit && !valid) return setError(t('form.incomplete'))
    try {
      const newId = listings.save(f, { id: existing?.id, submit })
      nav(submit ? '/dashboard?tab=listings&submitted=1' : `/listing/${newId}/edit`, { replace: true })
    } catch (e) {
      setError(err(e))
    }
  }

  return (
    <Page className="max-w-4xl">
      <h1 className="text-2xl font-bold">{existing ? t('form.editTitle') : t('form.newTitle')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('form.subtitle')}</p>
      {session.role !== 'seller' && (
        <div className="mt-4"><Alert t="blue">{t('form.switchedToSeller')} <button className="font-semibold underline" onClick={() => auth.setRole('seller')}>{t('form.switchNow')}</button></Alert></div>
      )}
      <div className="mt-4 space-y-2">
        <Alert t="blue">
          {t('form.planInfo', { plan: L(plan.name), used, limit: plan.listingLimit ?? '∞', fee: plan.feePercent })} <Link to="/pricing" className="font-semibold underline">{t('form.upgrade')}</Link>
        </Alert>
        {unpaid.length > 0 && <Alert t="red">{t('form.unpaidBlock', { n: unpaid.length })} <Link to={`/checkout/${unpaid[0].id}`} className="font-semibold underline">{t('form.payNow')}</Link></Alert>}
        {existing?.rejectReason && <Alert t="red">{t('detail.rejectReason')}: {existing.rejectReason}</Alert>}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-1 text-lg font-bold">{t('form.teaser')}</h2>
        <p className="mb-5 text-sm text-gray-500">{t('form.teaserHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.displayName') + ' *'} hint={t('form.displayNameHint')} className="sm:col-span-2">
            <Input value={f.displayName} onChange={(e) => set('displayName', e.target.value)} maxLength={80} />
          </Field>
          <Field label={t('form.category')}>
            <Select value={f.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </Select>
          </Field>
          <Field label={t('form.province')}>
            <Select value={f.province} onChange={(e) => set('province', e.target.value)}>
              {PROVINCES.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </Select>
          </Field>
          <Field label={t('form.currency')} hint={t('form.currencyHint')}>
            <Select value={f.currency} onChange={(e) => set('currency', e.target.value as Currency)}><option>THB</option><option>USD</option></Select>
          </Field>
          <Field label={t('form.askingPrice') + ' *'} hint={f.askingPrice ? money(f.askingPrice, f.currency, { exact: true }) : undefined}>
            <Input type="number" min={0} value={f.askingPrice || ''} onChange={(e) => set('askingPrice', Number(e.target.value))} />
          </Field>
          <Field label={t('form.revenue')}>
            <Input type="number" min={0} value={f.annualRevenue || ''} onChange={(e) => set('annualRevenue', Number(e.target.value))} />
          </Field>
          <Field label={t('form.profit')}>
            <Input type="number" value={f.netProfit || ''} onChange={(e) => set('netProfit', Number(e.target.value))} />
          </Field>
          <Field label={t('form.year')}>
            <Input type="number" min={1900} max={2100} value={f.yearEstablished} onChange={(e) => set('yearEstablished', Number(e.target.value))} />
          </Field>
          <Field label={t('form.employees')}>
            <Input type="number" min={0} value={f.employees} onChange={(e) => set('employees', Number(e.target.value))} />
          </Field>
          <Field label={t('form.reason')} className="sm:col-span-2">
            <Input value={f.reasonForSale} onChange={(e) => set('reasonForSale', e.target.value)} />
          </Field>
          <Field label={t('form.description') + ' *'} className="sm:col-span-2">
            <Textarea rows={5} value={f.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">{t('form.coverImages', { n: MAX_COVER_IMAGES })} *</p>
          <ImageGrid images={f.coverImages} onRemove={(i) => set('coverImages', f.coverImages.filter((_, k) => k !== i))} onAdd={(fl) => addImages(fl, 'cover')} canAdd={f.coverImages.length < MAX_COVER_IMAGES} busy={busy} />
        </div>
      </Card>

      <Card className="mt-6 border-dashed p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><Lock size={18} /> {t('form.confidential')}</h2>
        <p className="mb-5 text-sm text-gray-500">{t('form.confidentialHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('form.legalName')}><Input value={f.confidential.legalName} onChange={(e) => setC('legalName', e.target.value)} /></Field>
          <Field label={t('form.address')}><Input value={f.confidential.address} onChange={(e) => setC('address', e.target.value)} /></Field>
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">{t('form.confImages')}</p>
          <ImageGrid images={f.confidential.images} onRemove={(i) => setC('images', f.confidential.images.filter((_, k) => k !== i))} onAdd={(fl) => addImages(fl, 'conf')} canAdd busy={busy} />
        </div>
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold">{t('form.documents')}</p>
          <ul className="mb-2 space-y-1">
            {f.confidential.documents.map((doc, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <FileText size={14} className="text-brand-500" /> {doc.name} <span className="text-muted">({fmtBytes(doc.size)})</span>
                <button onClick={() => setC('documents', f.confidential.documents.filter((_, k) => k !== i))} className="text-red-500"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-brand-500">
            <FileText size={16} /> {t('form.addDocs')}
            <input type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg" multiple className="hidden" onChange={(e) => { addDocs(e.target.files); e.target.value = '' }} />
          </label>
          <p className="mt-1 text-xs text-muted">{t('form.docLimit', { size: fmtBytes(MAX_DOC_BYTES) })}</p>
        </div>
      </Card>

      {error && <div className="mt-4"><Alert t="red">{error}</Alert></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => nav(-1)}>{t('common.cancel')}</Button>
        <Button variant="outline" onClick={() => save(false)}>{t('form.saveDraft')}</Button>
        <Button onClick={() => save(true)} disabled={busy}>{existing && ['published'].includes(existing.status) ? t('form.saveChanges') : t('form.submit')}</Button>
      </div>
    </Page>
  )
}

function ImageGrid({ images, onRemove, onAdd, canAdd, busy }: { images: string[]; onRemove: (i: number) => void; onAdd: (f: FileList | null) => void; canAdd: boolean; busy: boolean }) {
  const { t } = usePrefs()
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {images.map((src, i) => (
        <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
          <Img src={src} alt="" className="h-full w-full" />
          <button onClick={() => onRemove(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X size={12} /></button>
          {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-brand-500 px-1.5 text-[10px] font-semibold text-white">{t('form.cover')}</span>}
        </div>
      ))}
      {canAdd && (
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-500 hover:text-brand-500">
          <ImagePlus size={22} /> {busy ? '…' : t('form.addImage')}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}
