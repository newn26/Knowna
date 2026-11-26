import { Footprints, Ruler } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container, LinkButton, PageHead } from '../components/ui'
import { GRADES, SIZES, footLengthFor, sizeForFoot } from '../lib/catalog'

const gradesFor = (eu: number) => GRADES.filter((g) => eu >= g.range[0] && eu <= g.range[1]).map((g) => g.label)

/** Full chart, also used in the product page's size guide dialog. */
export function SizeTable({ highlight }: { highlight?: number | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full text-sm tabular">
        <thead className="bg-stone text-left text-xs uppercase tracking-wider text-sub">
          <tr>
            <th className="px-4 py-3">EU</th>
            <th className="px-4 py-3">ความยาวเท้า (ซม.)</th>
            <th className="px-4 py-3">ชั้นที่ใส่บ่อย</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {SIZES.map((s) => (
            <tr key={s} className={s === highlight ? 'bg-ink text-paper' : ''}>
              <td className="px-4 py-2.5 font-semibold">{s}</td>
              <td className="px-4 py-2.5">{footLengthFor(s).toFixed(1)}</td>
              <td className={`px-4 py-2.5 ${s === highlight ? '' : 'text-sub'}`}>{gradesFor(s).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SizeFinder() {
  const [params] = useSearchParams()
  const [grade, setGrade] = useState(GRADES.find((g) => g.id === params.get('grade')) ?? GRADES[2])
  const [cm, setCm] = useState(23.5)
  const [room, setRoom] = useState(true)
  const eu = sizeForFoot(cm + (room ? 0.5 : 0))
  return (
    <>
      <PageHead title="หาไซส์ที่ใช่" sub="รองเท้าคับทำให้เดินเจ็บ หลวมไปก็หลุดตอนวิ่ง ใช้ 2 วิธีนี้ หรือดูตารางเต็มด้านล่าง ถ้าได้รับแล้วไซส์ไม่พอดี เปลี่ยนได้ฟรี 1 ครั้งต่อคำสั่งซื้อ แบรนด์ออกค่าส่งคู่ใหม่" />
      <Container className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Footprints size={20} />
            <h2 className="font-semibold">วิธีที่ 1 · เลือกระดับชั้น</h2>
          </div>
          <div className="mt-6 grid grid-cols-6 gap-2">
            {GRADES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGrade(g)}
                className={`h-11 rounded-xl border text-sm font-semibold transition ${grade.id === g.id ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm text-sub">
            {grade.label} อายุ {grade.age} ส่วนใหญ่ใส่
          </p>
          <p key={grade.id} className="animate-rise font-display text-6xl font-black tabular" style={{ fontStretch: '78%' }}>
            EU {grade.range[0]}–{grade.range[1]}
          </p>
          <p className="mt-4 text-sm text-sub">เด็กแต่ละคนเท้าต่างกันได้ 2–3 เบอร์ในชั้นเดียวกัน ถ้าอยากได้เบอร์เดียวที่แม่น ใช้วิธีที่ 2</p>
        </section>

        <section className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <div className="flex items-center gap-3">
            <Ruler size={20} />
            <h2 className="font-semibold">วิธีที่ 2 · วัดความยาวเท้า</h2>
          </div>
          <ol className="mt-5 space-y-2 text-sm text-paper/70">
            <li>1. ให้ลูกยืนบนกระดาษ ส้นเท้าชิดผนัง ใส่ถุงเท้านักเรียน</li>
            <li>2. ขีดเส้นที่ปลายนิ้วที่ยาวที่สุด แล้ววัดจากผนังถึงเส้น วัดทั้งสองข้าง ใช้ค่าที่ยาวกว่า</li>
          </ol>
          <div className="mt-6 flex items-end justify-between">
            <label htmlFor="cm" className="text-sm text-paper/70">
              ความยาวเท้า
            </label>
            <p className="font-display text-4xl font-black tabular" style={{ fontStretch: '78%' }}>
              {cm.toFixed(1)} <span className="text-lg text-paper/60">ซม.</span>
            </p>
          </div>
          <input id="cm" type="range" min={17.5} max={29} step={0.1} value={cm} onChange={(e) => setCm(+e.target.value)} className="mt-3 h-8 w-full accent-[rgb(var(--signal))]" />
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={room} onChange={(e) => setRoom(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--signal))]" />
            เผื่อโต +0.5 ซม. (แนะนำสำหรับเด็กประถม)
          </label>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-paper/15 pt-6">
            <div>
              <p className="text-sm text-paper/60">เบอร์ที่แนะนำ</p>
              <p key={eu} className="animate-rise font-display text-7xl font-black tabular leading-none" style={{ fontStretch: '78%' }}>
                {eu}
              </p>
            </div>
            <LinkButton to={`/product?size=${eu}`} variant="signal">
              ซื้อเบอร์ {eu}
            </LinkButton>
          </div>
        </section>
      </Container>
      <Container className="mt-16">
        <h2 className="font-display text-2xl font-black uppercase">ตารางไซส์เต็ม</h2>
        <div className="mt-6">
          <SizeTable highlight={eu} />
        </div>
      </Container>
    </>
  )
}
