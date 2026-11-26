import type { AddressParts, ColorId, ColorInfo } from './types'

export const BRAND = 'KNOWNA'

export const PRODUCT = {
  id: 'kn-classic-01',
  model: 'KNOWNA Classic',
  nameTh: 'รองเท้าผ้าใบนักเรียนชาย ผูกเชือก',
  price: 259, // report 4.1.2: 259 baht per pair, shipping included
  details: [
    'ราคาคู่ละ 259 บาท รวมค่าจัดส่งแล้ว',
    'ผ้าใบทอแน่น ระบายอากาศ ซักทั้งคู่ได้',
    'สั่งไซส์ผิด เปลี่ยนได้ฟรี 1 ครั้งต่อคำสั่งซื้อ',
    'แบรนด์ออกค่าส่งรองเท้าคู่ใหม่ให้',
    'หัวยางหุ้มปลายเท้า กันกระแทกตอนเตะบอล',
    'แผ่นรองเท้าบุโฟมถอดซักได้',
  ],
  specs: [
    ['วัสดุด้านบน', 'ผ้าใบ (canvas)'],
    ['พื้น', 'ยางกันลื่น'],
    ['ไซส์', 'EU 28–45 (ป.1–ม.6)'],
    ['ราคา', '259 บาท รวมค่าจัดส่ง'],
    ['เปลี่ยนไซส์', 'ฟรี 1 ครั้งต่อคำสั่งซื้อ แบรนด์ออกค่าส่งคู่ใหม่'],
  ] as [string, string][],
}

/** Free size exchange from Ecommerce Report.pdf: once per order, brand pays shipping for the new pair. */
export const EXCHANGE = {
  short: 'สั่งไซส์ผิด เปลี่ยนฟรี 1 ครั้ง',
  rule: 'เปลี่ยนไซส์ได้ฟรี 1 ครั้งต่อคำสั่งซื้อ หากสั่งไซส์ผิด แบรนด์เป็นผู้ออกค่าจัดส่งรองเท้าคู่ใหม่',
  // PENDING-PDF: the report has not filled these in yet; keep them as pending labels, do not guess
  pending: ['ระยะเวลาที่ขอเปลี่ยนได้', 'ค่าส่งรองเท้าคู่เดิมกลับ', 'ต้องส่งคู่เดิมคืนก่อนหรือไม่'],
}

export const ALL_COLORS: ColorInfo[] = [
  { id: 'brown', name: 'Brown', nameTh: 'น้ำตาล', hint: 'ชุดลูกเสือ และโรงเรียนที่ใช้ผ้าใบน้ำตาล', code: 'BR' },
  { id: 'black', name: 'Black', nameTh: 'ดำ', hint: 'ชุดนักเรียนปกติ', code: 'BK' },
  { id: 'white', name: 'White', nameTh: 'ขาว', hint: 'วันพละ และโรงเรียนที่ใช้รองเท้าขาว', code: 'WH' },
]

export const COLORS = ALL_COLORS

export const colorInfo = (id: ColorId) => ALL_COLORS.find((c) => c.id === id)!

export const SIZES = Array.from({ length: 18 }, (_, i) => 28 + i) // EU 28–45, ป.1–ม.6

/** Approximate foot length (cm) each EU size fits. EU ≈ 1.5 × (foot cm + 1.5). */
export const footLengthFor = (eu: number) => Math.round((eu / 1.5 - 1.5) * 10) / 10

export const sizeForFoot = (cm: number) => {
  const eu = Math.round(1.5 * (cm + 1.5))
  return Math.min(SIZES[SIZES.length - 1], Math.max(SIZES[0], eu))
}

/** Typical size range per grade (Thai school levels), from our fitting records. */
export const GRADES: { id: string; label: string; age: string; range: [number, number] }[] = [
  { id: 'p1', label: 'ป.1', age: '6–7 ปี', range: [28, 31] },
  { id: 'p2', label: 'ป.2', age: '7–8 ปี', range: [29, 32] },
  { id: 'p3', label: 'ป.3', age: '8–9 ปี', range: [30, 33] },
  { id: 'p4', label: 'ป.4', age: '9–10 ปี', range: [32, 35] },
  { id: 'p5', label: 'ป.5', age: '10–11 ปี', range: [33, 37] },
  { id: 'p6', label: 'ป.6', age: '11–12 ปี', range: [35, 40] },
  // the report has no size numbers per grade; these secondary ranges are demo estimates
  { id: 'm1', label: 'ม.1', age: '12–13 ปี', range: [36, 41] },
  { id: 'm2', label: 'ม.2', age: '13–14 ปี', range: [37, 42] },
  { id: 'm3', label: 'ม.3', age: '14–15 ปี', range: [38, 43] },
  { id: 'm4', label: 'ม.4', age: '15–16 ปี', range: [39, 44] },
  { id: 'm5', label: 'ม.5', age: '16–17 ปี', range: [40, 45] },
  { id: 'm6', label: 'ม.6', age: '17–18 ปี', range: [40, 45] },
]

/**
 * Size comparison with brands parents already buy (report 1.4 names them).
 * The report has no numbers, so the offsets are demo samples: KNOWNA size = brand size + offset.
 */
export const BRANDS: { id: string; name: string; offset: number }[] = [
  { id: 'nanyang', name: 'นันยาง', offset: 0 },
  { id: 'breaker', name: 'Breaker', offset: 0 },
  { id: 'goldcity', name: 'Gold City', offset: 1 },
  { id: 'tiger', name: 'Tiger', offset: -1 },
]

/** Reminders go out before the April–May school-shoe season (report 1.3: 70–80% of yearly sales). */
export const nextReminder = (now = new Date()) => {
  const april = new Date(now.getFullYear(), 3, 1)
  return now < april ? april : new Date(now.getFullYear() + 1, 3, 1)
}

/** Children grow out of shoes; ask to measure again after 6 months. */
export const needsRemeasure = (measuredAt: string, now = new Date()) => now.getTime() - new Date(measuredAt).getTime() > 182 * 86400000

export const sizeFromBrand =(brandId: string, brandSize: number) => {
  const b = BRANDS.find((x) => x.id === brandId) ?? BRANDS[0]
  return Math.min(SIZES[SIZES.length - 1], Math.max(SIZES[0], brandSize + b.offset))
}


// shortcut: plain text for subdistrict/district; a real build would autocomplete from a Thai postcode dataset
export const PROVINCES = 'กรุงเทพมหานคร กระบี่ กาญจนบุรี กาฬสินธุ์ กำแพงเพชร ขอนแก่น จันทบุรี ฉะเชิงเทรา ชลบุรี ชัยนาท ชัยภูมิ ชุมพร เชียงราย เชียงใหม่ ตรัง ตราด ตาก นครนายก นครปฐม นครพนม นครราชสีมา นครศรีธรรมราช นครสวรรค์ นนทบุรี นราธิวาส น่าน บึงกาฬ บุรีรัมย์ ปทุมธานี ประจวบคีรีขันธ์ ปราจีนบุรี ปัตตานี พระนครศรีอยุธยา พะเยา พังงา พัทลุง พิจิตร พิษณุโลก เพชรบุรี เพชรบูรณ์ แพร่ ภูเก็ต มหาสารคาม มุกดาหาร แม่ฮ่องสอน ยโสธร ยะลา ร้อยเอ็ด ระนอง ระยอง ราชบุรี ลพบุรี ลำปาง ลำพูน เลย ศรีสะเกษ สกลนคร สงขลา สตูล สมุทรปราการ สมุทรสงคราม สมุทรสาคร สระแก้ว สระบุรี สิงห์บุรี สุโขทัย สุพรรณบุรี สุราษฎร์ธานี สุรินทร์ หนองคาย หนองบัวลำภู อ่างทอง อำนาจเจริญ อุดรธานี อุตรดิตถ์ อุทัยธานี อุบลราชธานี'.split(' ')

export const isBangkok = (province: string) => province === 'กรุงเทพมหานคร'

/** One-line Thai address for labels and couriers: แขวง/เขต in Bangkok, ต./อ. elsewhere. */
export function formatAddress(a: AddressParts) {
  const bkk = isBangkok(a.province)
  return `${a.line.trim()} ${bkk ? 'แขวง' : 'ต.'}${a.subdistrict.trim()} ${bkk ? 'เขต' : 'อ.'}${a.district.trim()} ${bkk ? '' : 'จ.'}${a.province} ${a.zip}`
}
