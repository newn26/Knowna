import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BadgeCheck, Building, Calendar, Eye, FileText, Flag, Heart, Lock, MapPin, MessageSquare, Pencil, Send, Unlock, Users } from 'lucide-react'
import { catName, provName } from '../lib/constants'
import { usePrefs } from '../lib/prefs'
import { canViewFull, chat, featuredIds, listings, useDB, useMe, useSession } from '../lib/store'
import { cls, fmtBytes, fmtDate } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Badge, Button, Card, Empty, Img, Modal, StatusBadge, Textarea, useErrorText } from '../components/ui'
import { LoiModal, NdaModal } from '../components/ContractForms'

export default function ListingDetail() {
  const { id } = useParams()
  const d = useDB()
  const me = useMe()
  const session = useSession()
  const { t, lang, money } = usePrefs()
  const nav = useNavigate()
  const err = useErrorText()
  const l = d.listings.find((x) => x.id === id)
  const [img, setImg] = useState(0)
  const [ndaOpen, setNdaOpen] = useState(false)
  const [loiOpen, setLoiOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (id) listings.view(id)
  }, [id])

  if (!l) return <Page><Empty title={t('detail.notFound')} /></Page>
  const isOwner = me?.id === l.sellerId
  const isPublic = ['published', 'under_offer', 'sold'].includes(l.status)
  if (!isPublic && !isOwner && !me?.isAdmin) return <Page><Empty icon="Lock" title={t('detail.notAvailable')} /></Page>

  const seller = d.users.find((u) => u.id === l.sellerId)
  const full = canViewFull(d, me?.id, l)
  const myNda = me && d.ndas.filter((n) => n.listingId === l.id && n.buyerId === me.id).sort((a, b) => b.createdAt - a.createdAt)[0]
  const myLoi = me && d.lois.find((o) => o.listingId === l.id && o.buyerId === me.id && ['open', 'accepted'].includes(o.status))
  const fav = !!me && d.favorites.some((f) => f.userId === me.id && f.listingId === l.id)
  const margin = l.annualRevenue ? Math.round((l.netProfit / l.annualRevenue) * 100) : 0
  const multiple = l.netProfit ? (l.askingPrice / l.netProfit).toFixed(1) : '—'
  const images = [...l.coverImages, ...(full ? l.confidential.images : [])]

  const needLogin = () => nav(`/login?next=/listing/${l.id}`)
  const run = (f: () => void) => {
    setError('')
    if (!me) return needLogin()
    try { f() } catch (e) { setError(err(e)) }
  }
  const openChat = () => run(() => nav(`/messages/${chat.open(l.id)}`))

  return (
    <Page>
      <nav className="mb-4 text-sm text-muted">
        <Link to="/search" className="hover:text-brand-500">{t('nav.browse')}</Link> / <Link to={`/search?category=${l.category}`} className="hover:text-brand-500">{catName(l.category, lang)}</Link>
      </nav>
      {isOwner && (
        <div className="mb-4">
          <Alert t="blue">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">{t('detail.ownerView')} <StatusBadge status={l.status} /></span>
              {l.rejectReason && <span className="text-red-600">{t('detail.rejectReason')}: {l.rejectReason}</span>}
              {!['sold', 'under_offer'].includes(l.status) && <Link to={`/listing/${l.id}/edit`} className="flex items-center gap-1 font-semibold"><Pencil size={14} /> {t('common.edit')}</Link>}
            </div>
          </Alert>
        </div>
      )}
      {session?.role === 'seller' && !isOwner && me && <div className="mb-4"><Alert>{t('detail.switchToBuyer')}</Alert></div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <div className="aspect-[16/10] overflow-hidden rounded-xl border bg-white">
              <Img src={images[img]} alt={l.displayName} className="h-full w-full" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImg(i)} className={cls('h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2', i === img ? 'border-brand-500' : 'border-transparent')}>
                  <Img src={src} alt="" className="h-full w-full" />
                </button>
              ))}
              {!full && l.confidential.images.length > 0 && (
                <div className="flex h-16 w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-200 text-[10px] text-gray-500"><Lock size={14} /> +{l.confidential.images.length}</div>
              )}
            </div>
          </div>

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-bold">{t('detail.about')}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{l.description}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Info icon={<Calendar size={16} />} label={t('form.year')} value={String(l.yearEstablished)} />
              <Info icon={<Users size={16} />} label={t('form.employees')} value={String(l.employees)} />
              <Info icon={<MapPin size={16} />} label={t('form.province')} value={provName(l.province, lang)} />
            </div>
            <div className="mt-5 rounded-lg bg-surface p-4 text-sm"><b>{t('form.reason')}:</b> {l.reasonForSale}</div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold">{t('detail.financials')}</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label={t('form.askingPrice')} value={money(l.askingPrice, l.currency)} />
              <Stat label={t('form.revenue')} value={money(l.annualRevenue, l.currency)} />
              <Stat label={t('form.profit')} value={money(l.netProfit, l.currency)} />
              <Stat label={t('detail.margin')} value={`${margin}% · ${multiple}x`} hint={t('detail.multipleHint')} />
            </div>
            <p className="mt-3 text-xs text-muted">{t('detail.baseCurrency', { c: l.currency, v: money(l.askingPrice, l.currency, { exact: true }) })}</p>
          </Card>

          <Card className={cls('p-6', !full && 'border-dashed')}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">{full ? <Unlock size={18} className="text-green-600" /> : <Lock size={18} />} {t('detail.confidential')}</h2>
            {full ? (
              <div className="space-y-3 text-sm">
                <p><b>{t('form.legalName')}:</b> {l.confidential.legalName || '—'}</p>
                <p><b>{t('form.address')}:</b> {l.confidential.address || '—'}</p>
                <div>
                  <b>{t('form.documents')}:</b>
                  {l.confidential.documents.length === 0 ? <span className="ml-1 text-muted">—</span> : (
                    <ul className="mt-2 space-y-1">
                      {l.confidential.documents.map((f, i) => (
                        <li key={i}><a href={f.dataUrl} download={f.name} className="inline-flex items-center gap-2 text-brand-500 hover:underline"><FileText size={14} /> {f.name} <span className="text-muted">({fmtBytes(f.size)})</span></a></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <p>{t('detail.lockedBody')}</p>
                {myNda?.status === 'pending' && <p className="mt-3"><Badge t="amber">{t('detail.ndaPending')}</Badge></p>}
                {myNda?.status === 'rejected' && <p className="mt-3"><Badge t="red">{t('detail.ndaRejected')}</Badge></p>}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-brand-500">{catName(l.category, lang)}</p>
              <div className="flex gap-1">
                {featuredIds(d).has(l.id) && <Badge t="dark">{t('card.featured')}</Badge>}
                {l.status !== 'published' && <StatusBadge status={l.status} />}
              </div>
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{l.displayName}</h1>
            <p className="mt-1 flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1"><MapPin size={12} /> {provName(l.province, lang)}</span><span className="flex items-center gap-1"><Eye size={12} /> {l.views}</span></p>
            <p className="mt-4 text-xs text-muted">{t('card.asking')}</p>
            <p className="text-3xl font-bold">{money(l.askingPrice, l.currency)}</p>

            {error && <div className="mt-4"><Alert t="red">{error}</Alert></div>}
            {notice && <div className="mt-4"><Alert t="green">{notice}</Alert></div>}

            {!isOwner && l.status !== 'sold' && (
              <div className="mt-5 space-y-2">
                <Button className="w-full" onClick={openChat}><MessageSquare size={16} /> {t('detail.chat')}</Button>
                {!full && (!myNda || myNda.status === 'rejected') && (
                  <Button variant="outline" className="w-full" onClick={() => (me ? setNdaOpen(true) : needLogin())}><Lock size={16} /> {t('detail.requestNda')}</Button>
                )}
                {full && l.status === 'published' && !myLoi && (
                  <Button variant="dark" className="w-full" onClick={() => setLoiOpen(true)}><Send size={16} /> {t('detail.makeOffer')}</Button>
                )}
                {myLoi && <Link to={`/contract/loi/${myLoi.id}`} className="block text-center text-sm font-semibold text-brand-500">{t('detail.viewMyOffer')}</Link>}
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => run(() => listings.toggleFavorite(l.id))}><Heart size={14} className={cls(fav && 'fill-red-500 text-red-500')} /> {t('detail.save')}</Button>
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => (me ? setReportOpen(true) : needLogin())}><Flag size={14} /> {t('detail.report')}</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase text-muted">{t('detail.seller')}</p>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-500"><Building size={18} /></span>
              <div>
                <p className="font-semibold">{full ? seller?.name : t('detail.sellerHidden')}</p>
                {seller?.sellerVerified ? <p className="flex items-center gap-1 text-xs text-green-600"><BadgeCheck size={14} /> {t('detail.verifiedSeller')}</p> : <p className="text-xs text-muted">{t('detail.unverifiedSeller')}</p>}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{t('detail.memberSince', { d: fmtDate(seller?.createdAt ?? 0, lang) })}</p>
          </Card>
          <p className="px-1 text-xs text-muted">{t('detail.safety')}</p>
        </aside>
      </div>

      {me && <NdaModal listing={l} open={ndaOpen} onClose={() => { setNdaOpen(false) }} />}
      {me && full && <LoiModal listing={l} open={loiOpen} onClose={() => setLoiOpen(false)} />}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('detail.report')}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('report.reasonPh')} />
        <div className="mt-4 flex justify-end">
          <Button disabled={!reason.trim()} onClick={() => run(() => { listings.report(l.id, reason); setReportOpen(false); setReason(''); setNotice(t('report.thanks')) })}>{t('report.send')}</Button>
        </div>
      </Modal>
    </Page>
  )
}

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-lg border p-3">
    <span className="text-brand-500">{icon}</span>
    <div><p className="text-xs text-muted">{label}</p><p className="text-sm font-semibold">{value}</p></div>
  </div>
)
const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg bg-surface p-4" title={hint}>
    <p className="text-xs text-muted">{label}</p>
    <p className="mt-1 font-bold">{value}</p>
  </div>
)
