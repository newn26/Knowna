// Run with `npm test`. Checks pricing, addresses, the mock order flow and the free size exchange end to end.
import assert from 'node:assert/strict'
import { ApiError, findOrder, getStock, placeOrder, requestExchange, stockOf } from '../src/lib/api'
import { resetDB } from '../src/lib/db'
import { totals } from '../src/lib/pricing'
import { GRADES, PRODUCT, PROVINCES, SIZES, formatAddress, needsRemeasure, nextReminder, sizeForFoot, sizeFromBrand } from '../src/lib/catalog'
import { replyTo } from '../src/components/SizeChat'
import type { CartLine } from '../src/lib/types'

let passed = 0
const test = async (name: string, fn: () => unknown) => {
  try {
    await fn()
    passed++
    console.log('  ok  ', name)
  } catch (e) {
    console.error('  FAIL', name)
    throw e
  }
}

const line = (qty = 1, size = 35): CartLine => ({ key: `new-brown-${size}`, kind: 'new', color: 'brown', size, qty, unitPrice: PRODUCT.price })

await test('price is 259 per pair with shipping included', () => {
  assert.equal(PRODUCT.price, 259)
  assert.equal(totals([line()]).shipping, 0)
  assert.equal(totals([line(2)]).total, 518)
})

await test('sizes run EU 28–45 for ป.1–ม.6; brand comparison stays in range', () => {
  assert.equal(SIZES[0], 28)
  assert.equal(SIZES[SIZES.length - 1], 45)
  assert.equal(GRADES[GRADES.length - 1].label, 'ม.6')
  for (const g of GRADES) assert.ok(SIZES.includes(g.range[0]) && SIZES.includes(g.range[1]), g.label)
  assert.equal(sizeForFoot(40), 45)
  assert.equal(sizeFromBrand('goldcity', 45), 45)
  assert.equal(sizeFromBrand('tiger', 28), 28)
})

await test('size chat: cm, brand + size, grade, and a fallback question', () => {
  assert.equal(replyTo('เท้ายาว 22.5').size, sizeForFoot(23))
  assert.equal(replyTo('ใส่นันยาง 36 อยู่').size, 36)
  assert.equal(replyTo('Gold City 38').size, 39)
  assert.match(replyTo('ลูกอยู่ ม.2').text, /EU 37–42/)
  assert.equal(replyTo('สวัสดี').size, undefined)
})

await test('size chat: tapping through every menu reaches a size or the exchange rule', () => {
  const menu = replyTo('เมนู').chips!
  assert.equal(menu.length, 4)
  for (const topic of menu) {
    const step = replyTo(topic.text ?? topic.label)
    assert.ok(step.chips?.length, topic.label)
    for (const c of step.chips!) {
      const r = replyTo(c.text ?? c.label)
      assert.ok(r.size || r.text.includes('EU') || r.text.includes('KNOWNA') || r.chips?.length, `${topic.label} → ${c.label}`)
      for (const d of r.chips ?? []) assert.ok(!replyTo(d.text ?? d.label).text.startsWith('ยังไม่เข้าใจ'), `${c.label} → ${d.label}`)
    }
  }
  assert.equal(replyTo('Breaker').chips?.[0].text, 'Breaker 30')
  assert.equal(replyTo('Breaker 30').size, 30)
})

await test('reminder: next 1 April, and remeasure after 6 months', () => {
  assert.equal(nextReminder(new Date(2026, 10, 27)).getFullYear(), 2027)
  assert.equal(nextReminder(new Date(2027, 1, 1)).getMonth(), 3)
  assert.equal(needsRemeasure('2025-11-10', new Date(2026, 10, 27)), true)
  assert.equal(needsRemeasure('2026-09-01', new Date(2026, 10, 27)), false)
})

await test('address: 77 provinces, Bangkok uses แขวง/เขต, others ต./อ./จ.', () => {
  assert.equal(new Set(PROVINCES).size, 77)
  assert.equal(formatAddress({ line: '1 ถ.พระราม 1', subdistrict: 'วังใหม่', district: 'ปทุมวัน', province: 'กรุงเทพมหานคร', zip: '10330' }), '1 ถ.พระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330')
  assert.equal(formatAddress({ line: '5', subdistrict: 'สุเทพ', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่', zip: '50200' }), '5 ต.สุเทพ อ.เมืองเชียงใหม่ จ.เชียงใหม่ 50200')
})

resetDB()

await test('order: new pair takes stock, order is findable by phone', async () => {
  const before = stockOf(await getStock(), 'brown', 35)
  const o = await placeOrder({
    userId: 'u-demo',
    customer: { name: 'ทดสอบ', phone: '081-234-5678', email: '', address: 'x' },
    lines: [line()],
    payment: 'promptpay',
  })
  assert.equal(o.subtotal, 259)
  assert.equal(stockOf(await getStock(), 'brown', 35), before - 1)
  assert.ok(await findOrder(o.id, '0812345678'))
  assert.equal(await findOrder(o.id, '0800000000'), null)
})

const rejects = (p: Promise<unknown>) => assert.rejects(p, ApiError)

await test('exchange: not before delivery', async () => {
  const o = await placeOrder({ userId: null, customer: { name: 'ทดสอบ', phone: '0811111111', email: '', address: 'x' }, lines: [line()], payment: 'promptpay' })
  await rejects(requestExchange(o.id, o.lines[0].key, 36))
})

await test('exchange: once per order on a delivered seed order, takes stock of the new size', async () => {
  // seed order KN-240510-0031 was delivered long ago and has two brown pairs (EU 33 and 35)
  const id = 'KN-240510-0031'
  const before = stockOf(await getStock(), 'brown', 34) // the seed pins brown 34 at 24 pairs
  const o = await requestExchange(id, `${id}-0`, 34)
  assert.equal(o.exchange?.fromSize, 33)
  assert.equal(o.exchange?.toSize, 34)
  assert.equal(stockOf(await getStock(), 'brown', 34), before - 1)
  await rejects(requestExchange(id, `${id}-1`, 36)) // the other pair cannot use a second exchange
})

await test('exchange: same size is refused', async () => {
  await rejects(requestExchange('KN-250502-0107', 'KN-250502-0107-0', 36))
})

console.log(`\n${passed} passed`)
