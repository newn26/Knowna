import type { ColorId, ColorInfo } from './types'

export const BRAND = 'KAOWNA'

export const PRODUCT = {
  id: 'kw-classic-01',
  model: 'KAOWNA Classic',
  nameTh: 'รองเท้านักเรียนชาย หนังผูกเชือก',
  price: 890,
  details: [
    'หนังสังเคราะห์เกรดพรีเมียม ขัดเงาง่าย ไม่ลอกเมื่อโดนฝน',
    'พื้นยางกันลื่น เย็บติดพื้นรอบตัว ไม่อ้าปากง่าย',
    'แผ่นรองเท้าบุโฟมถอดซักได้ ระบายอากาศ',
    'หัวรองเท้าเสริมแข็ง กันกระแทกตอนเตะบอล',
    'ทุกคู่มี Product ID และ QR ใต้ลิ้นรองเท้า ใช้เทิร์นได้ในอนาคต',
  ],
  specs: [
    ['วัสดุด้านบน', 'หนัง PU ผิวเรียบ'],
    ['พื้น', 'ยาง TPR กันลื่น เย็บรอบ'],
    ['น้ำหนัก', 'ราว 320 กรัม (เบอร์ 38)'],
    ['ไซซ์', 'EU 30–45 (ป.1–ม.6)'],
    ['รับประกัน', 'พื้นหลุด/ด้ายขาด 6 เดือน'],
  ] as [string, string][],
}

export const COLORS: ColorInfo[] = [
  { id: 'black', name: 'Black', nameTh: 'ดำ', hint: 'ชุดนักเรียนปกติ ทุกระดับชั้น', code: 'BK' },
  { id: 'white', name: 'White', nameTh: 'ขาว', hint: 'วันพละ และโรงเรียนที่ใช้รองเท้าขาว', code: 'WH' },
  { id: 'brown', name: 'Brown', nameTh: 'น้ำตาล', hint: 'ชุดลูกเสือ / เนตรนารี', code: 'BR' },
]

export const colorInfo = (id: ColorId) => COLORS.find((c) => c.id === id)!

export const SIZES = Array.from({ length: 16 }, (_, i) => 30 + i) // EU 30–45

/** Approximate foot length (cm) each EU size fits. EU ≈ 1.5 × (foot cm + 1.5). */
export const footLengthFor = (eu: number) => Math.round((eu / 1.5 - 1.5) * 10) / 10

export const sizeForFoot = (cm: number) => {
  const eu = Math.round(1.5 * (cm + 1.5))
  return Math.min(45, Math.max(30, eu))
}

/** Typical size range per grade (Thai school levels), from our fitting records. */
export const GRADES: { id: string; label: string; age: string; range: [number, number] }[] = [
  { id: 'p1', label: 'ป.1', age: '6–7 ปี', range: [30, 32] },
  { id: 'p2', label: 'ป.2', age: '7–8 ปี', range: [31, 33] },
  { id: 'p3', label: 'ป.3', age: '8–9 ปี', range: [32, 34] },
  { id: 'p4', label: 'ป.4', age: '9–10 ปี', range: [33, 35] },
  { id: 'p5', label: 'ป.5', age: '10–11 ปี', range: [34, 37] },
  { id: 'p6', label: 'ป.6', age: '11–12 ปี', range: [35, 38] },
  { id: 'm1', label: 'ม.1', age: '12–13 ปี', range: [36, 39] },
  { id: 'm2', label: 'ม.2', age: '13–14 ปี', range: [37, 41] },
  { id: 'm3', label: 'ม.3', age: '14–15 ปี', range: [38, 42] },
  { id: 'm4', label: 'ม.4', age: '15–16 ปี', range: [39, 43] },
  { id: 'm5', label: 'ม.5', age: '16–17 ปี', range: [40, 44] },
  { id: 'm6', label: 'ม.6', age: '17–18 ปี', range: [40, 45] },
]

export const SHIPPING_FEE = 50
export const FREE_SHIPPING_FROM = 1500

export const STORES = ['สาขาสยาม (BTS สยาม ทางออก 4)', 'สาขาบางนา (เมกาบางนา ชั้น 2)', 'สาขางามวงศ์วาน (ตรงข้ามเดอะมอลล์)']
