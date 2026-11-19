import type { DB, Listing, Plan, User } from './types'
import { coverSvg } from './covers'
import { demoHash, DAY } from './utils'

export const DB_VERSION = 3

export const DEMO_ACCOUNTS = [
  { email: 'buyer@demo.com', password: 'demo1234', role: 'buyer' },
  { email: 'seller@demo.com', password: 'demo1234', role: 'seller' },
  { email: 'admin@demo.com', password: 'admin1234', role: 'admin' },
] as const

const plans: Plan[] = [
  { id: 'seller-free', audience: 'seller', name: { th: 'Free', en: 'Free' }, priceTHB: 0, priceUSD: 0, listingLimit: 1, feePercent: 3, ndaLimitPerMonth: null, featured: false, alerts: false, active: true },
  { id: 'seller-pro', audience: 'seller', name: { th: 'Pro', en: 'Pro' }, priceTHB: 990, priceUSD: 29, listingLimit: 5, feePercent: 2, ndaLimitPerMonth: null, featured: true, alerts: false, active: true },
  { id: 'seller-business', audience: 'seller', name: { th: 'Business', en: 'Business' }, priceTHB: 2990, priceUSD: 89, listingLimit: null, feePercent: 1, ndaLimitPerMonth: null, featured: true, alerts: false, active: true },
  { id: 'buyer-free', audience: 'buyer', name: { th: 'Free', en: 'Free' }, priceTHB: 0, priceUSD: 0, listingLimit: null, feePercent: 0, ndaLimitPerMonth: 3, featured: false, alerts: false, active: true },
  { id: 'buyer-pro', audience: 'buyer', name: { th: 'Pro', en: 'Pro' }, priceTHB: 490, priceUSD: 15, listingLimit: null, feePercent: 0, ndaLimitPerMonth: null, featured: false, alerts: true, active: true },
]

function user(p: Partial<User> & Pick<User, 'id' | 'email' | 'name'>, password: string): User {
  return {
    passwordHash: demoHash(password),
    primaryRole: 'buyer',
    isAdmin: false,
    emailVerified: true,
    sellerVerified: false,
    suspended: false,
    sellerPlanId: 'seller-free',
    buyerPlanId: 'buyer-free',
    provider: 'password',
    createdAt: Date.now() - 60 * DAY,
    ...p,
  }
}

type Raw = [
  name: string,
  cat: string,
  prov: string,
  cur: 'THB' | 'USD',
  price: number,
  revenue: number,
  profit: number,
  year: number,
  emp: number,
  reason: string,
  desc: string,
  seller: string,
]

const raw: Raw[] = [
  ['คาเฟ่สไตล์มินิมอล ย่านอารีย์', 'food', 'bangkok', 'THB', 2_800_000, 4_200_000, 950_000, 2019, 6, 'ย้ายไปต่างประเทศ', 'คาเฟ่ 40 ที่นั่ง ใกล้ BTS อารีย์ ลูกค้าประจำแน่น มีสูตรเครื่องดื่มซิกเนเจอร์และเมล็ดกาแฟคั่วเอง สัญญาเช่าเหลือ 4 ปี ส่งต่อพร้อมอุปกรณ์ครบชุด', 'u-seller'],
  ['ร้านอาหารอีสานพรีเมียม 2 สาขา', 'food', 'khonkaen', 'THB', 6_500_000, 12_000_000, 2_100_000, 2016, 18, 'เจ้าของเกษียณ', 'ร้านอาหารอีสานพรีเมียม 2 สาขาในตัวเมืองขอนแก่น ระบบครัวกลาง มีรีวิวดีบน Google และ Wongnai ทีมงานพร้อมอยู่ต่อ', 'u-seller2'],
  ['Online Skincare Brand (Shopee/Lazada)', 'ecommerce', 'bangkok', 'THB', 9_000_000, 18_500_000, 3_400_000, 2020, 7, 'Founder pursuing new venture', 'D2C skincare brand with 120k followers, Shopee Mall & Lazada LazMall stores, contract OEM manufacturing, 38% repeat purchase rate.', 'u-seller'],
  ['ร้านมินิมาร์ทใกล้มหาวิทยาลัย', 'retail', 'chiangmai', 'THB', 1_900_000, 7_800_000, 720_000, 2014, 5, 'ต้องการเปลี่ยนธุรกิจ', 'มินิมาร์ทหน้า ม.เชียงใหม่ เปิด 24 ชม. ยอดขายสม่ำเสมอตลอดปี มีระบบ POS และสต็อกออนไลน์', 'u-seller2'],
  ['B2B Inventory SaaS', 'tech', 'bangkok', 'USD', 420_000, 260_000, 110_000, 2021, 4, 'Founders focusing on another product', 'Cloud inventory SaaS for Thai SMEs, 180 paying customers, MRR $21k, churn < 2%/mo. Codebase in TypeScript, hosted on AWS.', 'u-seller3'],
  ['สปาเพื่อสุขภาพ ริมหาดกะตะ', 'beauty', 'phuket', 'THB', 8_200_000, 9_600_000, 2_300_000, 2015, 14, 'เจ้าของย้ายภูมิลำเนา', 'สปา 8 ห้องทรีตเมนต์ ติดหาดกะตะ ลูกค้าต่างชาติ 80% มีพาร์ทเนอร์โรงแรมและเอเจนซีทัวร์', 'u-seller3'],
  ['โรงงานผลิตบรรจุภัณฑ์กระดาษ', 'manufacturing', 'samutprakan', 'THB', 45_000_000, 68_000_000, 7_500_000, 2008, 52, 'ไม่มีทายาทสืบทอด', 'โรงงานบนที่ดิน 3 ไร่ (รวมในราคา) เครื่องจักรนำเข้าจากเยอรมนี ลูกค้า B2B ระยะยาวกว่า 40 ราย', 'u-seller2'],
  ['แฟรนไชส์ชานมไข่มุก 5 จุดขาย', 'franchise', 'nonthaburi', 'THB', 1_200_000, 3_600_000, 640_000, 2021, 8, 'ลงทุนธุรกิจอื่น', 'ขายสิทธิ์และจุดขาย 5 จุดในห้างย่านนนทบุรี ส่งต่อพร้อมสัญญาแฟรนไชส์ที่ยังเหลือ 3 ปี', 'u-seller'],
  ['สถาบันกวดวิชาภาษาอังกฤษ', 'education', 'bangkok', 'THB', 3_500_000, 5_200_000, 1_300_000, 2012, 11, 'เจ้าของสุขภาพไม่เอื้ออำนวย', 'นักเรียนปัจจุบัน 350 คน หลักสูตร IELTS/TOEIC และเด็กประถม มีคอร์สออนไลน์ที่สร้างรายได้แบบ passive', 'u-seller3'],
  ['Boutique Digital Marketing Agency', 'service', 'bangkok', 'USD', 350_000, 480_000, 120_000, 2017, 12, 'Partner exit', 'Performance marketing agency with 25 retainer clients across F&B and real estate. Google Partner & Meta Business Partner.', 'u-seller'],
  ['ร้านซ่อมและขายมือถือ 3 สาขา', 'retail', 'udonthani', 'THB', 2_400_000, 6_900_000, 880_000, 2013, 9, 'เจ้าของย้ายถิ่นฐาน', 'ร้านในห้างหลัก 3 แห่งในอุดรธานี ทั้งงานซ่อมและขายอุปกรณ์เสริม มีฐานลูกค้า LINE OA กว่า 15,000 คน', 'u-seller2'],
  ['ร้านเบเกอรี่โฮมเมด', 'food', 'chonburi', 'THB', 850_000, 2_100_000, 420_000, 2018, 4, 'ย้ายตามครอบครัว', 'เบเกอรี่โฮมเมดในพัทยา ขายหน้าร้านและส่งคาเฟ่ 12 แห่ง สูตรทั้งหมดส่งต่อพร้อมสอนงาน 1 เดือน', 'u-seller3'],
  ['Co-working Space in Nimman', 'service', 'chiangmai', 'USD', 180_000, 150_000, 42_000, 2019, 5, 'Owner relocating', '300 sqm co-working space in Nimman with 60 desks, 3 meeting rooms, and strong digital-nomad community.', 'u-seller'],
  ['ร้านเสริมสวยและทำเล็บ', 'beauty', 'nonthaburi', 'THB', 650_000, 1_800_000, 380_000, 2017, 5, 'เจ้าของตั้งครรภ์', 'ร้านเสริมสวยในหมู่บ้านใหญ่ ลูกค้าประจำกว่า 400 คน อุปกรณ์ใหม่ปี 2024', 'u-seller2'],
  ['ร้านขายวัสดุก่อสร้าง', 'retail', 'nakhonratchasima', 'THB', 12_000_000, 28_000_000, 2_600_000, 2005, 15, 'เจ้าของเกษียณ', 'ร้านวัสดุก่อสร้างพร้อมโกดัง 2 หลังและรถส่งของ 4 คัน ลูกค้ารับเหมาประจำ', 'u-seller3'],
  ['Mobile App Studio', 'tech', 'bangkok', 'USD', 260_000, 320_000, 85_000, 2018, 9, 'Founder joining corporate role', 'App development studio with recurring maintenance contracts (40% of revenue) and 2 in-house apps.', 'u-seller'],
  ['โรงงานผลิตน้ำดื่มบรรจุขวด', 'manufacturing', 'ayutthaya', 'THB', 7_800_000, 11_000_000, 1_700_000, 2010, 16, 'ปรับโครงสร้างธุรกิจครอบครัว', 'มี อย. และมาตรฐาน GMP กำลังผลิต 20,000 ขวด/วัน พร้อมรถส่ง 6 คัน', 'u-seller2'],
  ['เกสต์เฮาส์ย่านเมืองเก่า', 'service', 'chiangrai', 'THB', 5_200_000, 3_100_000, 900_000, 2016, 6, 'ย้ายไปดูแลพ่อแม่', 'เกสต์เฮาส์ 14 ห้อง ใกล้หอนาฬิกาเชียงราย คะแนน Booking.com 9.1 อัตราการเข้าพักเฉลี่ย 78%', 'u-seller3'],
  ['Pet Supplies Online Store', 'ecommerce', 'pathumthani', 'THB', 2_200_000, 5_500_000, 760_000, 2020, 4, 'Founder relocating abroad', 'Online pet supplies store with own website + marketplace shops, 9,000 monthly orders, warehouse in Rangsit.', 'u-seller'],
  ['โรงเรียนสอนว่ายน้ำเด็ก', 'education', 'songkhla', 'THB', 1_500_000, 2_400_000, 610_000, 2015, 7, 'เปลี่ยนสายอาชีพ', 'สระว่ายน้ำในร่มพร้อมหลักสูตรสำหรับเด็ก 3–12 ปี นักเรียนต่อเดือนเฉลี่ย 220 คน หาดใหญ่', 'u-seller2'],
]

function listing(r: Raw, i: number): Listing {
  const [displayName, category, province, currency, askingPrice, annualRevenue, netProfit, yearEstablished, employees, reasonForSale, description, sellerId] = r
  const created = Date.now() - (i * 2 + 1) * DAY
  return {
    id: 'l-' + (i + 1),
    sellerId,
    status: 'published',
    displayName,
    category,
    province,
    currency,
    askingPrice,
    annualRevenue,
    netProfit,
    yearEstablished,
    employees,
    reasonForSale,
    description,
    coverImages: [0, 1, 2].map((k) => coverSvg(category, i + k)),
    confidential: {
      legalName: `บริษัท ${displayName.split(' ')[0]} จำกัด (ตัวอย่าง)`,
      address: `เลขที่ ${100 + i} ถนนตัวอย่าง ${province}`,
      images: [coverSvg(category, i + 1, 'Confidential')],
      documents: [],
    },
    views: 30 + ((i * 37) % 400),
    createdAt: created,
    updatedAt: created,
    publishedAt: created,
  }
}

export function makeSeed(): DB {
  const users: User[] = [
    user({ id: 'u-buyer', email: 'buyer@demo.com', name: 'สมชาย ผู้ลงทุน', primaryRole: 'buyer' }, 'demo1234'),
    user({ id: 'u-seller', email: 'seller@demo.com', name: 'วิภา เจ้าของกิจการ', primaryRole: 'seller', sellerVerified: true, sellerPlanId: 'seller-business', sellerPlanUntil: Date.now() + 30 * DAY }, 'demo1234'),
    user({ id: 'u-seller2', email: 'seller2@demo.com', name: 'ประเสริฐ ศรีสุข', primaryRole: 'seller', sellerVerified: true }, 'demo1234'),
    user({ id: 'u-seller3', email: 'seller3@demo.com', name: 'Daniel Carter', primaryRole: 'seller' }, 'demo1234'),
    user({ id: 'u-admin', email: 'admin@demo.com', name: 'Admin', isAdmin: true }, 'admin1234'),
  ]
  const listings = raw.map(listing)
  // one listing awaiting review so the admin queue is not empty
  listings.push({
    ...listing(['ร้านก๋วยเตี๋ยวเรือเจ้าดัง', 'food', 'ayutthaya', 'THB', 1_100_000, 2_600_000, 540_000, 2011, 5, 'เจ้าของเกษียณ', 'ร้านก๋วยเตี๋ยวเรือริมน้ำ ลูกค้านักท่องเที่ยวแน่นทุกเสาร์อาทิตย์', 'u-seller'], 20),
    status: 'pending',
    publishedAt: undefined,
  })

  const t0 = Date.now() - 2 * DAY
  return {
    version: DB_VERSION,
    users,
    plans,
    listings,
    ndas: [
      { id: 'n-1', listingId: 'l-1', buyerId: 'u-buyer', sellerId: 'u-seller', status: 'approved', buyerSignature: { name: 'สมชาย ผู้ลงทุน', at: t0 }, sellerSignature: { name: 'วิภา เจ้าของกิจการ', at: t0 + 3600_000 }, createdAt: t0, decidedAt: t0 + 3600_000 },
    ],
    lois: [],
    deals: [],
    invoices: [],
    payments: [],
    threads: [
      { id: 't-1', listingId: 'l-1', buyerId: 'u-buyer', sellerId: 'u-seller', createdAt: t0, lastMessageAt: t0 + 7200_000, lastRead: { 'u-buyer': t0 + 7200_000 } },
    ],
    messages: [
      { id: 'm-1', threadId: 't-1', senderId: 'u-buyer', text: 'สวัสดีครับ สนใจคาเฟ่ครับ ยอดขายช่วงโลว์ซีซันเป็นอย่างไรบ้างครับ', createdAt: t0 },
      { id: 'm-2', threadId: 't-1', senderId: null, text: 'nda_signed', createdAt: t0 + 60_000 },
      { id: 'm-3', threadId: 't-1', senderId: null, text: 'nda_approved', createdAt: t0 + 3600_000 },
      { id: 'm-4', threadId: 't-1', senderId: 'u-seller', text: 'สวัสดีค่ะ โลว์ซีซันยอดลดลงประมาณ 15% ค่ะ รายละเอียดงบการเงินดูได้ในหน้าข้อมูลเต็มแล้วนะคะ', createdAt: t0 + 7200_000 },
    ],
    reports: [],
    notifications: [],
    savedSearches: [],
    buyerRequests: [
      { id: 'r-1', buyerId: 'u-buyer', title: 'หาซื้อร้านอาหารหรือคาเฟ่ที่มีกำไรแล้ว', category: 'food', province: '', maxBudget: 3_000_000, minProfit: 400_000, description: 'อยากได้ร้านที่มีลูกค้าประจำและสูตรของตัวเอง พร้อมรับช่วงต่อทันที ไม่จำเป็นต้องอยู่กรุงเทพ', status: 'open', createdAt: t0 },
      { id: 'r-2', buyerId: 'u-seller2', title: 'มองหาธุรกิจออนไลน์ งบไม่เกิน 10 ล้าน', category: 'ecommerce', province: '', maxBudget: 10_000_000, minProfit: 500_000, description: 'สนใจแบรนด์ที่ขายบน Shopee/Lazada หรือเว็บของตัวเอง มีระบบหลังบ้านและทีมงานพร้อม', status: 'open', createdAt: t0 + 3600_000 },
      { id: 'r-3', buyerId: 'u-seller3', title: 'ต้องการธุรกิจการศึกษาในกรุงเทพ', category: 'education', province: 'bangkok', maxBudget: 5_000_000, minProfit: 0, description: 'โรงเรียนกวดวิชาหรือสถาบันสอนภาษา ยินดีให้เจ้าของเดิมสอนต่อช่วงแรก', status: 'open', createdAt: t0 + 7200_000 },
    ],
    pitches: [
      { id: 'p-1', requestId: 'r-1', listingId: 'l-12', sellerId: 'u-seller3', buyerId: 'u-buyer', message: 'ร้านเบเกอรี่เปิดมา 9 ปี ลูกค้าประจำเยอะ ส่งต่อสูตรและอุปกรณ์ครบ ราคาต่ำกว่างบของคุณมาก', status: 'pending', createdAt: t0 + 5400_000 },
    ],
    favorites: [],
    fx: { usdThb: 36, updatedAt: 0 },
  }
}
