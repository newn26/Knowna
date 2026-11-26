import { Link } from 'react-router-dom'
import { Accordion, Container, ExchangeRule, PageHead } from '../components/ui'
import { COLORS, PRODUCT, SIZES } from '../lib/catalog'
import { baht } from '../lib/pricing'

const link = 'font-semibold text-ink underline underline-offset-4'

// Every answer comes from the group report; anything it leaves blank stays pending (see ExchangeRule).
const TOPICS: { id: string; title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    id: 'order',
    title: 'สินค้าและราคา',
    items: [
      { q: 'ราคาเท่าไหร่ ต้องจ่ายค่าส่งเพิ่มไหม', a: `คู่ละ ${baht(PRODUCT.price)} รวมค่าจัดส่งแล้ว ไม่มีค่าส่งเพิ่ม` },
      { q: 'มีสีอะไรบ้าง', a: `${COLORS.map((c) => c.nameTh).join(' ')} สีน้ำตาลสำหรับวันลูกเสือ` },
      { q: 'มีไซส์ไหนบ้าง', a: `EU ${SIZES[0]}–${SIZES[SIZES.length - 1]} สำหรับนักเรียนชาย ป.1–ม.6` },
      { q: 'มีหน้าร้านให้ไปลองไหม', a: 'ไม่มีหน้าร้าน ขายผ่านเว็บไซต์ของแบรนด์เท่านั้น ถ้าได้รับแล้วไซส์ไม่พอดี เปลี่ยนไซส์ได้ฟรี 1 ครั้งต่อคำสั่งซื้อ' },
    ],
  },
  {
    id: 'size',
    title: 'การเลือกไซส์',
    items: [
      {
        q: 'ไม่รู้ว่าลูกใส่ไซส์อะไร',
        a: (
          <>
            ใช้ <Link to="/size" className={link}>หน้าหาไซส์</Link> ได้ 3 วิธี: เลือกตามชั้นเรียน วัดความยาวเท้า หรือเทียบกับแบรนด์ที่ลูกใส่อยู่ หรือกดปุ่ม "ถามไซส์" มุมขวาล่างเพื่อถามทางแชต
          </>
        ),
      },
      {
        q: 'บันทึกไซส์ของลูกไว้ได้ไหม',
        a: (
          <>
            ได้ ที่ <Link to="/account" className={link}>บัญชีของฉัน</Link> บันทึกความยาวเท้าของลูกแต่ละคน แล้วเราจะแจ้งเตือนก่อนเปิดเทอมพร้อมไซส์ที่บันทึกไว้
          </>
        ),
      },
    ],
  },
  {
    id: 'pay',
    title: 'การชำระเงินและการจัดส่ง',
    items: [
      { q: 'ชำระเงินได้ทางไหน', a: 'พร้อมเพย์ สแกน QR จ่ายผ่านระบบรับชำระเงิน Omise' },
      { q: 'จัดส่งอย่างไร', a: 'จัดส่งถึงบ้านตามที่อยู่ที่กรอกตอนสั่งซื้อ ค่าจัดส่งรวมอยู่ในราคาสินค้าแล้ว' },
      {
        q: 'ติดตามพัสดุได้ที่ไหน',
        a: (
          <>
            ที่ <Link to="/track" className={link}>ติดตามพัสดุ</Link> ใช้เลขคำสั่งซื้อกับเบอร์โทรที่ใช้สั่ง หรือดูในบัญชีของฉันถ้าสั่งตอนเข้าสู่ระบบ
          </>
        ),
      },
    ],
  },
  {
    id: 'exchange',
    title: 'การเปลี่ยนไซส์',
    items: [
      { q: 'ไซส์ไม่พอดี เปลี่ยนได้ไหม', a: <ExchangeRule /> },
      { q: 'ขอเปลี่ยนไซส์อย่างไร', a: 'ภายใน 3 วันหลังได้รับสินค้า เปิดหน้าคำสั่งซื้อ กด "ขอเปลี่ยนไซส์" แล้วเลือกไซส์ใหม่ แบรนด์จะส่งคู่ใหม่ให้โดยไม่เสียค่าส่ง' },
      { q: 'สั่งหลายคู่ในคำสั่งซื้อเดียว เปลี่ยนได้กี่คู่', a: 'เปลี่ยนได้ 1 ครั้งต่อคำสั่งซื้อ ไม่ใช่ต่อคู่' },
    ],
  },
]

export default function Help() {
  return (
    <>
      <PageHead title="คำถามที่พบบ่อย" sub="ราคา ไซส์ การชำระเงิน การจัดส่ง และการเปลี่ยนไซส์ ไม่เจอคำตอบ ถามทางแชตได้ที่ปุ่ม &quot;ถามไซส์&quot;" />
      <Container className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <nav aria-label="หัวข้อ" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <a href={`#/help#${t.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }))} className="block rounded-full px-4 py-2 text-sm font-medium text-sub transition hover:bg-stone hover:text-ink lg:rounded-xl">
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl space-y-14">
          {TOPICS.map((t) => (
            <section key={t.id} id={t.id} className="scroll-mt-24">
              <h2 className="font-display text-2xl font-black" style={{ fontStretch: '80%' }}>
                {t.title}
              </h2>
              <div className="mt-2 border-t border-line">
                {t.items.map((i) => (
                  <Accordion key={i.q} title={i.q}>
                    {i.a}
                  </Accordion>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </>
  )
}
