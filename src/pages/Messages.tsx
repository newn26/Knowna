import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Lock, Paperclip, Send, FileText, Info } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { canViewFull, chat, useDB, useMe } from '../lib/store'
import type { FileAsset } from '../lib/types'
import { MAX_DOC_BYTES } from '../lib/constants'
import { cls, compressImage, fmtBytes, fmtDate, readFileAsDataUrl } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, Empty, Img, Modal, Textarea, useErrorText } from '../components/ui'
import { LoiModal, NdaModal } from '../components/ContractForms'

export default function Messages() {
  const { threadId } = useParams()
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const threads = d.threads
    .filter((x) => x.buyerId === me.id || x.sellerId === me.id)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)

  return (
    <Page>
      <h1 className="mb-6 text-2xl font-bold">{t('chat.title')}</h1>
      <div className="grid h-[70vh] min-h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white md:grid-cols-[320px_1fr]">
        <aside className={cls('overflow-y-auto border-r', threadId && 'hidden md:block')}>
          {threads.length === 0 && <p className="p-6 text-center text-sm text-muted">{t('chat.noThreads')}</p>}
          {threads.map((th) => {
            const l = d.listings.find((x) => x.id === th.listingId)
            const other = d.users.find((u) => u.id === (th.buyerId === me.id ? th.sellerId : th.buyerId))
            const last = [...d.messages].reverse().find((m) => m.threadId === th.id)
            const unread = th.lastMessageAt > (th.lastRead[me.id] ?? 0) && last?.senderId !== me.id
            return (
              <Link key={th.id} to={`/messages/${th.id}`} className={cls('flex gap-3 border-b p-4 hover:bg-gray-50', th.id === threadId && 'bg-brand-50')}>
                <Img src={l?.coverImages[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cls('truncate text-sm', unread ? 'font-bold' : 'font-semibold')}>{l?.displayName}</p>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </div>
                  <p className="truncate text-xs text-muted">{th.buyerId === me.id ? t('chat.withSeller') : `${t('chat.withBuyer')}: ${other?.name}`}</p>
                  <p className="truncate text-xs text-gray-500">{last ? (last.senderId ? last.text || last.file?.name : t('sys.' + last.text)) : ''} · {fmtDate(th.lastMessageAt, lang)}</p>
                </div>
              </Link>
            )
          })}
        </aside>
        <section className={cls('flex min-h-0 flex-col', !threadId && 'hidden md:flex')}>
          {threadId ? <Thread key={threadId} id={threadId} /> : <div className="m-auto"><Empty icon="MessageSquare" title={t('chat.pick')} /></div>}
        </section>
      </div>
    </Page>
  )
}

function Thread({ id }: { id: string }) {
  const d = useDB()
  const me = useMe()!
  const { t, lang } = usePrefs()
  const nav = useNavigate()
  const err = useErrorText()
  const th = d.threads.find((x) => x.id === id)
  const msgs = d.messages.filter((m) => m.threadId === id)
  const [text, setText] = useState('')
  const [file, setFile] = useState<FileAsset | undefined>()
  const [error, setError] = useState('')
  const [ndaOpen, setNdaOpen] = useState(false)
  const [loiOpen, setLoiOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reported, setReported] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
    chat.markRead(id)
  }, [id, msgs.length])

  if (!th || (th.buyerId !== me.id && th.sellerId !== me.id)) return <div className="m-auto"><Empty title={t('chat.notFound')} /></div>
  const l = d.listings.find((x) => x.id === th.listingId)!
  const isBuyer = th.buyerId === me.id
  const other = d.users.find((u) => u.id === (isBuyer ? th.sellerId : th.buyerId))
  const full = canViewFull(d, th.buyerId, l)
  const nda = d.ndas.filter((n) => n.listingId === l.id && n.buyerId === th.buyerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const loi = d.lois.find((o) => o.listingId === l.id && o.buyerId === th.buyerId && ['open', 'accepted'].includes(o.status))

  const pick = async (fl: FileList | null) => {
    const f = fl?.[0]
    if (!f) return
    if (f.type.startsWith('image/')) {
      const dataUrl = await compressImage(f, 1000, 0.75)
      setFile({ name: f.name, type: 'image/jpeg', size: Math.round(dataUrl.length * 0.75), dataUrl })
    } else if (f.size > MAX_DOC_BYTES) setError(t('form.docTooBig', { name: f.name }))
    else setFile({ name: f.name, type: f.type, size: f.size, dataUrl: await readFileAsDataUrl(f) })
  }
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !file) return
    try {
      chat.send(id, text.trim(), file)
      setText('')
      setFile(undefined)
      setError('')
    } catch (x) {
      setError(err(x))
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <button className="md:hidden" onClick={() => nav('/messages')}><ArrowLeft size={18} /></button>
        <Img src={l.coverImages[0]} alt="" className="h-10 w-10 rounded-lg" />
        <div className="min-w-0 flex-1">
          <Link to={`/listing/${l.id}`} className="block truncate text-sm font-semibold hover:text-brand-500">{l.displayName}</Link>
          <p className="truncate text-xs text-muted">{isBuyer ? (full ? other?.name : t('detail.sellerHidden')) : other?.name}</p>
        </div>
        <Link to={`/room/${th.id}`} className="rounded-full border border-brand-500 px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50">Deal Room</Link>
        <button onClick={() => setReportOpen(true)} className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500" title={t('chat.report')}><Flag size={16} /></button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b bg-surface px-4 py-2 text-xs">
        <Info size={14} className="text-brand-500" />
        {nda ? <Link to={`/contract/nda/${nda.id}`} className="font-semibold text-brand-500">NDA: {t('status.' + nda.status)}</Link> : <span>{t('chat.noNda')}</span>}
        {loi && <Link to={`/contract/loi/${loi.id}`} className="font-semibold text-brand-500">· LOI: {t('status.' + loi.status)}</Link>}
        <span className="ml-auto flex gap-2">
          {isBuyer && !full && (!nda || nda.status === 'rejected') && <Button size="sm" variant="outline" onClick={() => setNdaOpen(true)}><Lock size={12} /> {t('detail.requestNda')}</Button>}
          {isBuyer && full && !loi && l.status === 'published' && <Button size="sm" onClick={() => setLoiOpen(true)}><Send size={12} /> {t('detail.makeOffer')}</Button>}
          {!isBuyer && nda?.status === 'pending' && <Button size="sm" onClick={() => nav(`/contract/nda/${nda.id}`)}>{t('chat.reviewNda')}</Button>}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m) => {
          if (!m.senderId)
            return (
              <div key={m.id} className="text-center">
                <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {t('sys.' + m.text)} {m.link && <Link to={m.link} className="ml-1 font-semibold text-brand-500">{t('chat.view')}</Link>}
                </span>
              </div>
            )
          const mine = m.senderId === me.id
          return (
            <div key={m.id} className={cls('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cls('max-w-[75%] rounded-2xl px-4 py-2 text-sm', mine ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm bg-gray-100')}>
                {m.file && (m.file.type.startsWith('image/') ? (
                  <a href={m.file.dataUrl} target="_blank" rel="noreferrer"><img src={m.file.dataUrl} alt={m.file.name} className="mb-1 max-h-60 rounded-lg" /></a>
                ) : (
                  <a href={m.file.dataUrl} download={m.file.name} className={cls('mb-1 flex items-center gap-2 underline', mine ? 'text-white' : 'text-brand-600')}><FileText size={14} /> {m.file.name} ({fmtBytes(m.file.size)})</a>
                ))}
                {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                <p className={cls('mt-1 text-[10px]', mine ? 'text-brand-100' : 'text-muted')}>{fmtDate(m.createdAt, lang, true)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      {error && <div className="px-4"><Alert t="red">{error}</Alert></div>}
      {file && (
        <div className="mx-4 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs">
          <Paperclip size={14} /> {file.name} <button className="ml-auto text-red-500" onClick={() => setFile(undefined)}>✕</button>
        </div>
      )}
      <form onSubmit={send} className="flex items-center gap-2 border-t p-3">
        <label className="cursor-pointer rounded-full p-2 text-gray-500 hover:bg-gray-100" title={t('chat.attach')}>
          <Paperclip size={18} />
          <input type="file" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = '' }} />
        </label>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chat.placeholder')} className="flex-1 rounded-full border border-gray-200 bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand-500" />
        <Button size="sm" className="h-10 w-10 !p-0" aria-label="send"><Send size={16} /></Button>
      </form>
      <p className="px-4 pb-2 text-[11px] text-muted">{t('chat.tabsHint')}</p>

      {isBuyer && <NdaModal listing={l} open={ndaOpen} onClose={() => setNdaOpen(false)} />}
      {isBuyer && full && <LoiModal listing={l} open={loiOpen} onClose={() => setLoiOpen(false)} />}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('chat.report')}>
        {reported ? <Alert t="green">{t('report.thanks')}</Alert> : (
          <>
            <p className="mb-3 text-sm text-gray-500">{t('chat.reportHint')}</p>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('report.reasonPh')} />
            <div className="mt-4 flex justify-end"><Button disabled={!reason.trim()} onClick={() => { chat.report(id, reason); setReported(true) }}>{t('report.send')}</Button></div>
          </>
        )}
      </Modal>
    </>
  )
}
