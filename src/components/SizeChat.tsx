import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRANDS, GRADES, SIZES, sizeForFoot, sizeFromBrand } from '../lib/catalog'
/** A tap-to-answer button: `label` is shown, `text` is what gets sent (defaults to the label). */
type Chip = { label: string; text?: string }
type Msg = { from: 'shop' | 'me'; text: string; size?: number; chips?: Chip[] }

// Menu topics: replyTo matches these exact texts, so tapping and typing go through the same path.
const T = { grade: 'เลือกตามชั้นเรียนของลูก', brand: 'เทียบกับแบรนด์ที่ลูกใส่อยู่', measure: 'วัดความยาวเท้าเอง', exchange: 'ไซส์ไม่พอดี เปลี่ยนได้ไหม' }
const MENU: Chip[] = Object.values(T).map((label) => ({ label }))
const AGAIN: Chip[] = [{ label: 'ถามเรื่องอื่น', text: 'เมนู' }]

const HELLO: Msg = {
  from: 'shop',
  text: 'สวัสดีครับ ไม่รู้ไซส์ลูกก็ไม่เป็นไร เลือกหัวข้อด้านล่างได้เลย หรือพิมพ์ความยาวเท้า (เช่น 22.5) ก็ได้ครับ',
  chips: MENU,
}

/** Auto-reply that reuses the size rules of the size page. A real shop would route this to staff. */
export function replyTo(text: string): Msg {
  const shop = (t: string, more: Partial<Msg> = {}): Msg => ({ from: 'shop', text: t, ...more })
  const said = text.trim()
  if (said === 'เมนู') return shop('มีอะไรให้ช่วยอีกไหมครับ', { chips: MENU })
  if (said === T.grade) return shop('ลูกเรียนชั้นไหนครับ', { chips: GRADES.map((g) => ({ label: g.label })) })
  if (said === T.brand) return shop('ตอนนี้ลูกใส่รองเท้าแบรนด์อะไรครับ', { chips: BRANDS.map((b) => ({ label: b.name })) })
  if (said === T.measure)
    return shop('ให้ลูกยืนบนกระดาษ ส้นเท้าชิดผนัง ขีดเส้นที่ปลายนิ้วที่ยาวที่สุด แล้ววัดจากผนังถึงเส้น ได้กี่เซนติเมตรครับ', {
      chips: Array.from({ length: 11 }, (_, i) => ({ label: `${17 + i} ซม.` })),
    })
  if (said === T.exchange) return shop('ได้ครับ ถ้าได้รับแล้วไซส์ไม่พอดี เปลี่ยนได้ 1 ครั้งต่อคำสั่งซื้อ ภายใน 3 วันหลังได้รับสินค้า กดขอเปลี่ยนในหน้าคำสั่งซื้อ แล้วส่งคู่เดิมที่ยังไม่ใช้งานพร้อมกล่องกลับมา ลูกค้าออกค่าส่งคู่เดิม แบรนด์ส่งคู่ใหม่ให้ฟรี', { chips: AGAIN })

  const n = Number(text.match(/\d+(\.\d+)?/)?.[0])
  const brand = BRANDS.find((b) => text.toLowerCase().includes(b.name.toLowerCase()))
  if (brand && n >= 20 && n <= 50) {
    const eu = sizeFromBrand(brand.id, n)
    return shop(`ใส่ ${brand.name} เบอร์ ${n} แนะนำ KNOWNA เบอร์ ${eu} ครับ (ตารางเทียบเป็นตัวอย่างสำหรับเว็บสาธิต)`, { size: eu, chips: AGAIN })
  }
  if (brand)
    return shop(`ใส่ ${brand.name} เบอร์อะไรอยู่ครับ`, {
      chips: SIZES.filter((s) => s >= 30 && s <= 44).map((s) => ({ label: String(s), text: `${brand.name} ${s}` })),
    })
  const grade = GRADES.find((g) => said.replace(/\s/g, '').includes(g.label))
  if (grade)
    return shop(`นักเรียน ${grade.label} ส่วนใหญ่ใส่ EU ${grade.range[0]}–${grade.range[1]} ครับ ถ้าวัดความยาวเท้าได้ จะแนะนำได้เบอร์เดียวที่แม่นกว่า`, {
      chips: [{ label: T.measure }, ...AGAIN],
    })
  if (n >= 15 && n <= 32) {
    const eu = sizeForFoot(n + 0.5)
    return shop(`เท้ายาว ${n} ซม. เผื่อโตอีก 0.5 ซม. แนะนำเบอร์ ${eu} ครับ ถ้าได้รับแล้วไม่พอดี เปลี่ยนไซส์ได้ฟรี 1 ครั้งต่อคำสั่งซื้อ`, { size: eu, chips: AGAIN })
  }
  return shop('ยังไม่เข้าใจคำถามครับ ลองเลือกหัวข้อด้านล่างนะครับ', { chips: MENU })
}

export function SizeChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([HELLO])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, typing, open])
  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  const say = (text: string) => {
    if (!text || typing) return
    setMsgs((m) => [...m, { from: 'me', text }])
    setTyping(true)
    setTimeout(() => {
      setMsgs((m) => [...m, replyTo(text)])
      setTyping(false)
    }, 700)
  }
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    say(draft.trim())
    setDraft('')
  }
  const last = msgs[msgs.length - 1]

  return (
    // z-30: below the header (40) and every dialog/drawer (50), so overlays always cover it
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      {open && (
        <section className="flex h-[460px] w-[340px] animate-rise flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl" aria-label="แชตถามไซส์">
          <header className="flex items-center justify-between bg-ink px-5 py-3 text-paper">
            <div>
              <p className="font-semibold">ถามไซส์กับ KNOWNA</p>
              <p className="text-xs text-paper/60">แชตจำลอง ตอบอัตโนมัติ</p>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper/10" aria-label="ปิดแชต">
              <X size={18} />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.from === 'me' ? 'ml-auto bg-ink text-paper' : 'bg-stone'}`}>
                {m.text}
                {m.size && (
                  <Link to={`/product?size=${m.size}`} onClick={() => setOpen(false)} className="mt-2 block font-semibold underline underline-offset-4">
                    ดูรองเท้าเบอร์ {m.size} →
                  </Link>
                )}
              </div>
            ))}
            {!typing && last.from === 'shop' && last.chips && (
              <div className="flex flex-wrap gap-2" aria-label="ตัวเลือกคำตอบ">
                {last.chips.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => say(c.text ?? c.label)}
                    className="rounded-full border border-ink/25 bg-card px-3.5 py-1.5 text-sm font-medium transition hover:border-ink hover:bg-ink hover:text-paper"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {typing && <p className="text-xs text-sub">กำลังพิมพ์…</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="กดตัวเลือกด้านบน หรือพิมพ์เอง"
              aria-label="ข้อความ"
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none placeholder:text-sub/45 focus:border-ink"
            />
            <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper disabled:opacity-40" disabled={!draft.trim() || typing} aria-label="ส่ง">
              <Send size={16} />
            </button>
          </form>
        </section>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-14 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-paper shadow-xl transition hover:-translate-y-0.5"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {open ? 'ปิด' : 'ถามไซส์'}
      </button>
    </div>
  )
}
