import type { Lang } from './types'

/** Platform-standard NDA. Sellers cannot edit it so every deal uses the same terms. */
export function ndaText(lang: Lang, v: { buyer: string; listing: string; date: string }): string[] {
  if (lang === 'th')
    return [
      `สัญญาไม่เปิดเผยข้อมูล (Non-Disclosure Agreement) ฉบับนี้ทำขึ้นเมื่อวันที่ ${v.date} ระหว่าง "ผู้รับข้อมูล" คือ ${v.buyer} และ "ผู้เปิดเผยข้อมูล" คือเจ้าของกิจการที่ประกาศขายในชื่อ "${v.listing}" ผ่านแพลตฟอร์ม RUB Job`,
      '1. ข้อมูลลับ หมายถึงข้อมูลทั้งหมดที่ผู้เปิดเผยข้อมูลให้ไว้ผ่านแพลตฟอร์ม ไม่ว่าจะเป็นชื่อกิจการ ที่ตั้ง งบการเงิน รายชื่อลูกค้า สัญญา เอกสาร รูปภาพ หรือข้อมูลที่ได้จากการสนทนา',
      '2. ผู้รับข้อมูลจะใช้ข้อมูลลับเพื่อวัตถุประสงค์ในการพิจารณาซื้อกิจการเท่านั้น และจะไม่เปิดเผยต่อบุคคลภายนอก เว้นแต่ที่ปรึกษาทางกฎหมาย บัญชี หรือการเงินที่มีหน้าที่รักษาความลับเช่นเดียวกัน',
      '3. ผู้รับข้อมูลจะไม่ติดต่อพนักงาน ลูกค้า คู่ค้า หรือผู้ให้เช่าของกิจการโดยตรงโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้เปิดเผยข้อมูล',
      '4. ผู้รับข้อมูลตกลงดำเนินการเจรจาและปิดการซื้อขายผ่านแพลตฟอร์ม และจะไม่หลีกเลี่ยงแพลตฟอร์มเพื่อทำธุรกรรมกับผู้เปิดเผยข้อมูลโดยตรงภายใน 24 เดือนนับจากวันที่ลงนาม',
      '5. เมื่อการเจรจาสิ้นสุดลงโดยไม่มีการซื้อขาย ผู้รับข้อมูลจะทำลายหรือส่งคืนข้อมูลลับทั้งหมด',
      '6. หน้าที่รักษาความลับมีผลเป็นเวลา 2 ปีนับจากวันที่ลงนาม',
      '— เอกสารนี้เป็นตัวอย่างในระบบต้นแบบ (prototype) ไม่ใช่คำแนะนำทางกฎหมาย —',
    ]
  return [
    `This Non-Disclosure Agreement is made on ${v.date} between ${v.buyer} (the "Recipient") and the owner of the business listed as "${v.listing}" (the "Discloser") on the RUB Job platform.`,
    '1. Confidential Information means all information provided by the Discloser through the platform, including business name, location, financial statements, customer lists, contracts, documents, images and information exchanged in conversation.',
    '2. The Recipient shall use Confidential Information solely to evaluate a potential acquisition and shall not disclose it to third parties other than legal, accounting or financial advisers bound by equivalent confidentiality obligations.',
    '3. The Recipient shall not contact employees, customers, suppliers or landlords of the business without the Discloser\'s prior written consent.',
    '4. The Recipient agrees to negotiate and close any transaction through the platform and shall not circumvent the platform to transact directly with the Discloser for 24 months from signing.',
    '5. If negotiations end without a transaction, the Recipient shall destroy or return all Confidential Information.',
    '6. Confidentiality obligations survive for 2 years from the date of signing.',
    '— Sample document in a prototype system. Not legal advice. —',
  ]
}

export function loiPreamble(lang: Lang, v: { buyer: string; listing: string }): string {
  return lang === 'th'
    ? `หนังสือแสดงเจตจำนงซื้อกิจการ (Letter of Intent) จาก ${v.buyer} ถึงเจ้าของกิจการ "${v.listing}" มีสาระสำคัญดังต่อไปนี้ เอกสารนี้ไม่มีผลผูกพันในการซื้อขาย ยกเว้นข้อตกลงเรื่องการรักษาความลับและการทำธุรกรรมผ่านแพลตฟอร์ม`
    : `Letter of Intent from ${v.buyer} to the owner of "${v.listing}" setting out the principal terms below. This LOI is non-binding except for confidentiality and the obligation to transact through the platform.`
}
