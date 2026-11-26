import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FOOT } from '../lib/photos'
import { Container } from './ui'

// The same two steps the size page already lists, split into four scroll chapters.
const CHAPTERS = [
  { id: 'paper', label: 'เตรียม', h: 'กระดาษชิดผนัง', d: 'วางกระดาษบนพื้นชิดผนัง ให้ลูกใส่ถุงเท้านักเรียนแล้วยืนบนกระดาษ ส้นเท้าชิดผนัง' },
  { id: 'mark', label: 'ขีดเส้น', h: 'ขีดที่ปลายนิ้ว', d: 'ขีดเส้นตรงปลายนิ้วที่ยาวที่สุด ปากกาตั้งตรง ไม่เอียงเข้าใต้นิ้ว' },
  { id: 'measure', label: 'วัด', h: 'วัดจากผนังถึงเส้น', d: 'วัดทั้งสองข้าง แล้วใช้ค่าที่ยาวกว่า' },
  { id: 'done', label: 'ได้ไซส์', h: 'กรอกตัวเลข ได้เบอร์', d: 'เลื่อนลงไปกรอกความยาวเท้า ระบบบอกเบอร์ที่แนะนำให้ ถ้าได้รับแล้วไม่พอดี เปลี่ยนฟรี 1 ครั้งต่อคำสั่งซื้อ' },
] as const

// Where the foot sits inside foot-side.webp (alpha bounding box), in % of the image: the toes are on the left, the heel on the right.
const TOE = 1
const HEEL = 99
// The example reading the ruler shows: wall (heel) to the toe line.
const EXAMPLE_CM = 22.5
const MARKS = [0, 5, 10, 15, 20]

/** Full-screen, scroll-driven: the photo stays put while the measuring marks draw in, one chapter at a time. */
export function MeasureStory() {
  const ref = useRef<HTMLElement>(null)
  const [chapter, setChapter] = useState(0)
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = ref.current!.getBoundingClientRect()
        const prog = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)))
        setP(prog)
        setChapter(Math.min(CHAPTERS.length - 1, Math.floor(prog * CHAPTERS.length)))
      })
    }
    update()
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', update)
      removeEventListener('resize', update)
    }
  }, [])
  const at = (id: (typeof CHAPTERS)[number]['id']) => CHAPTERS.findIndex((c) => c.id === id) <= chapter
  // inside the "measure" chapter the arrow grows from the wall (heel) to the line (toe)
  const grow = Math.min(1, Math.max(0, (p - 2 / CHAPTERS.length) * CHAPTERS.length * 1.25))
  const fade = (on: boolean) =>
    `transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none ${on ? 'opacity-100 translate-y-0 blur-0' : 'pointer-events-none opacity-0 translate-y-4 blur-sm'}`
  const show = (on: boolean) => `transition-opacity duration-700 motion-reduce:transition-none ${on ? 'opacity-100' : 'opacity-0'}`

  return (
    <section ref={ref} aria-label="วิธีวัดเท้า" className="relative mt-4 bg-stone" style={{ height: `${CHAPTERS.length * 85}vh` }}>
      <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden">
        <Container className="grid h-full items-center gap-10 py-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <ol className="flex gap-2" aria-hidden>
              {CHAPTERS.map((c, i) => (
                <li key={c.id} className="flex-1">
                  <span className="block h-1 overflow-hidden rounded-full bg-ink/10">
                    <span className={`block h-full origin-left bg-ink transition-transform duration-500 ${i <= chapter ? 'scale-x-100' : 'scale-x-0'}`} />
                  </span>
                  <span className={`mt-2 block text-xs font-semibold transition-colors ${i === chapter ? 'text-ink' : 'text-sub'}`}>
                    {i + 1}. {c.label}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-10 grid">
              {CHAPTERS.map((c, i) => (
                <div key={c.id} className={`[grid-area:1/1] ${fade(i === chapter)}`} aria-hidden={i !== chapter}>
                  <h2 className="font-display text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl" style={{ fontStretch: '78%' }}>
                    {c.h}
                  </h2>
                  <p className="mt-4 max-w-md text-lg text-sub">{c.d}</p>
                  {c.id === 'done' && (
                    <a href="#measure" onClick={(e) => (e.preventDefault(), document.getElementById('measure')?.scrollIntoView({ behavior: 'smooth' }))} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
                      กรอกความยาวเท้า <ArrowDown size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <figure className="relative" aria-hidden>
            {/* paper on the floor, against the wall on the heel side */}
            <div className={`absolute -inset-x-[3%] bottom-[-6%] top-[48%] rounded-sm bg-paper shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)] ${show(at('paper'))}`} />
            {/* wall */}
            <div className={`absolute -top-[30%] bottom-[-10%] w-3 rounded-sm bg-ink/80 ${show(at('paper'))}`} style={{ left: `calc(${HEEL}% + 2px)` }}>
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-sub">ผนัง</span>
            </div>
            <img src={FOOT.src} alt="" className="relative w-full drop-shadow-[0_24px_24px_rgba(0,0,0,.18)]" />
            {/* pen line at the toe */}
            <div className={`absolute bottom-[-6%] top-[30%] w-0 border-l-[3px] border-dashed border-signal ${show(at('mark'))}`} style={{ left: `${TOE}%` }}>
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-signal">เส้นปลายนิ้ว</span>
            </div>
            {/* ruler + arrow from the wall to the line */}
            <div className={`absolute inset-x-0 top-[104%] ${show(at('measure'))}`}>
              {/* 0 cm at the wall (right), counting toward the toes (left); one tick per cm */}
              <div className="relative h-10 rounded-sm bg-[#e9d9a8] text-[#3b3324] shadow-sm" style={{ marginLeft: `${TOE}%`, marginRight: `${100 - HEEL}%` }}>
                {Array.from({ length: Math.floor(EXAMPLE_CM) + 1 }, (_, cm) => (
                  <span key={cm} className={`absolute top-0 w-px bg-black/60 ${cm % 5 === 0 ? 'h-[55%]' : 'h-[30%]'}`} style={{ right: `${(cm / EXAMPLE_CM) * 100}%` }} />
                ))}
                {MARKS.map((cm) => (
                  <span key={cm} className="absolute bottom-1.5 translate-x-1/2 text-[12px] font-bold leading-none tabular" style={{ right: `${(cm / EXAMPLE_CM) * 100}%` }}>
                    {cm}
                  </span>
                ))}
                <div className="absolute -bottom-1.5 right-0 h-[3px] origin-right rounded-full bg-signal" style={{ width: '100%', transform: `scaleX(${grow})` }} />
              </div>
              <p className="mt-3 text-center text-sm font-semibold">
                ความยาวเท้า = ระยะจากผนังถึงเส้น{' '}
                <span className={`inline-block rounded-full bg-signal px-2.5 py-0.5 text-paper tabular transition-opacity duration-500 ${grow >= 1 ? 'opacity-100' : 'opacity-0'}`}>ตัวอย่าง: {EXAMPLE_CM} ซม.</span>
              </p>
            </div>
          </figure>
        </Container>
        <p className="absolute bottom-3 left-4 text-xs text-sub sm:left-6 lg:left-10">ภาพเท้า: Foot-outside.jpg จาก Wikimedia Commons (สาธารณสมบัติ)</p>
      </div>
    </section>
  )
}
