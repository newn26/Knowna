import { ArrowRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Container, LinkButton } from '../components/ui'
import { WORN } from '../lib/photos'

/** Any route the app does not know: say so plainly and point back to the three things people come for. */
export default function NotFound() {
  const { pathname } = useLocation()
  return (
    <Container className="grid min-h-[calc(100dvh-16rem)] items-center gap-10 py-16 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <h1 className="font-display text-6xl font-black leading-[0.9] tracking-tight sm:text-8xl" style={{ fontStretch: '78%' }}>
          หน้านี้
          <br />
          หลงทาง<span className="text-signal">.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-sub">
          ไม่มีหน้า <code className="rounded bg-stone px-1.5 py-0.5 text-[0.9em] text-ink">{pathname}</code> ในร้านเรา ลิงก์อาจพิมพ์ผิด หรือหน้านั้นถูกย้ายไปแล้ว
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/" size="lg">
            กลับหน้าแรก <ArrowRight size={18} />
          </LinkButton>
          <LinkButton to="/shop" size="lg" variant="outline">
            ซื้อคู่ใหม่
          </LinkButton>
          <LinkButton to="/soles" size="lg" variant="outline">
            พื้นรองเท้า
          </LinkButton>
        </div>
      </div>
      <img src={WORN.src} alt={WORN.alt} className="w-full -rotate-6 animate-rise drop-shadow-[0_30px_30px_rgba(0,0,0,.18)]" />
    </Container>
  )
}
