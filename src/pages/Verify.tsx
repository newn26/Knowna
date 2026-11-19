import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, IdCard, ImagePlus, XCircle } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { kyc, useMe } from '../lib/store'
import { compressImage, fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, Card, Field, Input, useErrorText } from '../components/ui'

/** Identity verification (KYC) — simulated: an admin reviews the uploaded ID card. */
export default function Verify() {
  const me = useMe()!
  const { t, lang } = usePrefs()
  const err = useErrorText()
  const [name, setName] = useState(me.kyc?.fullName ?? me.name)
  const [idNo, setIdNo] = useState('')
  const [img, setImg] = useState('')
  const [error, setError] = useState('')
  const k = me.kyc
  const canSubmit = !k || k.status === 'rejected'

  const pick = async (f?: File) => {
    if (!f) return
    try { setImg(await compressImage(f, 700, 0.7)) } catch { setError(t('form.imageError')) }
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try { kyc.submit({ fullName: name, idNumber: idNo, idImage: img }); setIdNo(''); setImg('') } catch (x) { setError(err(x)) }
  }

  return (
    <Page className="max-w-2xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><IdCard /> {t('kyc.title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('kyc.subtitle')}</p>

      <div className="mt-6">
        {me.isAdmin ? <Alert t="blue">{t('kyc.adminNote')}</Alert>
          : k?.status === 'verified' ? <Alert t="green"><span className="flex items-center gap-2"><BadgeCheck size={16} /> {t('kyc.verified')} {k.reviewedAt && `· ${fmtDate(k.reviewedAt, lang)}`}</span></Alert>
          : k?.status === 'pending' ? <Alert><span className="flex items-center gap-2"><Clock size={16} /> {t('kyc.pending', { d: fmtDate(k.submittedAt, lang, true) })}</span></Alert>
          : k?.status === 'rejected' ? <Alert t="red"><span className="flex items-center gap-2"><XCircle size={16} /> {t('kyc.rejected')}: {k.note || '-'}</span></Alert>
          : <Alert t="blue">{t('kyc.why')}</Alert>}
      </div>

      {canSubmit && !me.isAdmin && (
        <Card className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-4">
            <Field label={t('kyc.fullName')}><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label={t('kyc.idNumber')} hint={t('kyc.idHint')}><Input value={idNo} onChange={(e) => setIdNo(e.target.value)} required inputMode="numeric" /></Field>
            <div>
              <p className="mb-1.5 text-sm font-semibold">{t('kyc.idImage')}</p>
              {img ? (
                <div className="flex items-end gap-3">
                  <img src={img} alt="ID" className="h-32 rounded-lg border object-cover" />
                  <button type="button" className="text-xs text-red-500" onClick={() => setImg('')}>{t('common.delete')}</button>
                </div>
              ) : (
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-brand-500">
                  <ImagePlus /> {t('kyc.upload')}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
              )}
            </div>
            <p className="text-xs text-muted">{t('kyc.privacy')}</p>
            {error && <Alert t="red">{error}</Alert>}
            <div className="flex justify-end"><Button disabled={!img || !name.trim() || !idNo.trim()}>{t('kyc.submit')}</Button></div>
          </form>
        </Card>
      )}
      <p className="mt-6 text-sm"><Link to="/dashboard" className="text-brand-500">← {t('nav.dashboard')}</Link></p>
    </Page>
  )
}
