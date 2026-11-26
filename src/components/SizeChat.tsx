import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BRANDS, GRADES, sizeForFoot, sizeFromBrand } from '../lib/catalog'

type Msg = { from: 'shop' | 'me'; text: string; size?: number }

const HELLO: Msg = {
  from: 'shop',
  text: 'สวัสดีครับ ให้ช่วยเลือกไซส์ไหมครับ บอกได้ 3 แบบ: ความยาวเท้าเป็นเซนติเมตร (เช่น 22.5), แบรนด์กับเบอร์ที่ใส่อยู่ (เช่น นันยาง 36) หรือระดับชั้น (เช่น ม.2)',
}

/** Auto-reply that reuses the size rules of the size page. A real shop would route this to staff. */
export function replyTo(text: string): Msg {
  const n = Number(text.match(/\d+(\.\d+)?/)?.[0])
  const brand = BRANDS.find((b) => text.toLowerCase().includes(b.name.toLowerCase()))
  if (brand && n >= 20 && n <= 50) {
    const eu = sizeFromBrand(brand.id, n)
    return { from: 'shop', text: `ใส่ ${brand.name} เบอร์ ${n} แนะนำ KNOWNA เบอร์ ${eu} ครับ (ตารางเทียบเป็นตัวอย่างสำหรับเว็บสาธิต)`, size: eu }
  }
  const grade = GRADES.find((g) => text.replace(/\s/g, '').includes(g.label))
  if (grade) return { from: 'shop', text: `นักเรียน ${grade.label} ส่วนใหญ่ใส่ EU ${grade.range[0]}–${grade.range[1]} ครับ ถ้าวัดความยาวเท้าแล้วบอกเป็นเซนติเมตร จะแนะนำได้เบอร์เดียวที่แม่นกว่า` }
  if (n >= 15 && n <= 32) {
    const eu = sizeForFoot(n + 0.5)
    return { from: 'shop', text: `เท้ายาว ${n} ซม. เผื่อโตอีก 0.5 ซม. แนะนำเบอร์ ${eu} ครับ ถ้าได้รับแล้วไม่พอดี เปลี่ยนไซส์ได้ฟรี 1 ครั้งต่อคำสั่งซื้อ`, size: eu }
  }
  return { from: 'shop', text: 'ขอข้อมูลเพิ่มนิดนึงครับ: ความยาวเท้า (ซม.), แบรนด์กับเบอร์ที่ใส่อยู่ หรือระดับชั้นของน้อง' }
}

export function SizeChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([HELLO])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs, typing, open])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setDraft('')
    setMsgs((m) => [...m, { from: 'me', text }])
    setTyping(true)
    setTimeout(() => {
      setMsgs((m) => [...m, replyTo(text)])
      setTyping(false)
    }, 700)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
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
            {typing && <p className="text-xs text-sub">กำลังพิมพ์…</p>}
            <div ref={end} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="เช่น 22.5 หรือ นันยาง 36"
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
