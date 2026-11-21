import type { Bi } from './types'

export const CATEGORIES: { id: string; name: Bi; icon: string; keyword: string }[] = [
  { id: 'food', name: { th: 'ร้านอาหาร / คาเฟ่', en: 'Restaurant / Café' }, icon: 'Coffee', keyword: 'cafe' },
  { id: 'retail', name: { th: 'ค้าปลีก', en: 'Retail' }, icon: 'Store', keyword: 'shop' },
  { id: 'ecommerce', name: { th: 'ออนไลน์ / อีคอมเมิร์ซ', en: 'Online / E-commerce' }, icon: 'ShoppingCart', keyword: 'laptop' },
  { id: 'service', name: { th: 'ธุรกิจบริการ', en: 'Services' }, icon: 'Briefcase', keyword: 'office' },
  { id: 'manufacturing', name: { th: 'โรงงาน / ผลิต', en: 'Manufacturing' }, icon: 'Factory', keyword: 'factory' },
  { id: 'franchise', name: { th: 'แฟรนไชส์', en: 'Franchise' }, icon: 'Network', keyword: 'storefront' },
  { id: 'beauty', name: { th: 'ความงาม / สปา', en: 'Beauty / Spa' }, icon: 'Sparkles', keyword: 'spa' },
  { id: 'education', name: { th: 'การศึกษา', en: 'Education' }, icon: 'GraduationCap', keyword: 'classroom' },
  { id: 'tech', name: { th: 'เทคโนโลยี / SaaS', en: 'Technology / SaaS' }, icon: 'Cpu', keyword: 'technology' },
  { id: 'other', name: { th: 'อื่นๆ', en: 'Other' }, icon: 'LayoutGrid', keyword: 'business' },
]

export const PROVINCES: { id: string; name: Bi }[] = [
  { id: 'bangkok', name: { th: 'กรุงเทพมหานคร', en: 'Bangkok' } },
  { id: 'nonthaburi', name: { th: 'นนทบุรี', en: 'Nonthaburi' } },
  { id: 'pathumthani', name: { th: 'ปทุมธานี', en: 'Pathum Thani' } },
  { id: 'samutprakan', name: { th: 'สมุทรปราการ', en: 'Samut Prakan' } },
  { id: 'chonburi', name: { th: 'ชลบุรี', en: 'Chonburi' } },
  { id: 'rayong', name: { th: 'ระยอง', en: 'Rayong' } },
  { id: 'chiangmai', name: { th: 'เชียงใหม่', en: 'Chiang Mai' } },
  { id: 'chiangrai', name: { th: 'เชียงราย', en: 'Chiang Rai' } },
  { id: 'phuket', name: { th: 'ภูเก็ต', en: 'Phuket' } },
  { id: 'krabi', name: { th: 'กระบี่', en: 'Krabi' } },
  { id: 'suratthani', name: { th: 'สุราษฎร์ธานี', en: 'Surat Thani' } },
  { id: 'songkhla', name: { th: 'สงขลา', en: 'Songkhla' } },
  { id: 'khonkaen', name: { th: 'ขอนแก่น', en: 'Khon Kaen' } },
  { id: 'udonthani', name: { th: 'อุดรธานี', en: 'Udon Thani' } },
  { id: 'nakhonratchasima', name: { th: 'นครราชสีมา', en: 'Nakhon Ratchasima' } },
  { id: 'ayutthaya', name: { th: 'พระนครศรีอยุธยา', en: 'Ayutthaya' } },
  { id: 'prachuap', name: { th: 'ประจวบคีรีขันธ์ (หัวหิน)', en: 'Prachuap Khiri Khan (Hua Hin)' } },
  { id: 'nakhonpathom', name: { th: 'นครปฐม', en: 'Nakhon Pathom' } },
  { id: 'other', name: { th: 'จังหวัดอื่น', en: 'Other province' } },
  { id: 'overseas', name: { th: 'ต่างประเทศ', en: 'Overseas' } },
]

export const catName = (id: string, lang: 'th' | 'en') =>
  CATEGORIES.find((c) => c.id === id)?.name[lang] ?? id
export const provName = (id: string, lang: 'th' | 'en') =>
  PROVINCES.find((p) => p.id === id)?.name[lang] ?? id

export const MAX_COVER_IMAGES = 5
// each file is stored as base64 in localStorage (~5MB total), so keep files small
export const MAX_DOC_BYTES = 300 * 1024
