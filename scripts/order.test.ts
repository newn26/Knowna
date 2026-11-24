// Run with `npm test`. Checks pricing, addresses and the mock order flow end to end.
import assert from 'node:assert/strict'
import { findOrder, getStock, placeOrder, stockOf } from '../src/lib/api'
import { resetDB } from '../src/lib/db'
import { totals } from '../src/lib/pricing'
import { PROVINCES, SOLE, formatAddress } from '../src/lib/catalog'
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

const line = (kind: 'new' | 'sole', qty = 1): CartLine => ({ key: `${kind}-brown-35`, kind, color: 'brown', size: 35, qty, unitPrice: kind === 'new' ? 390 : SOLE.price })

await test('sole price is ฿199', () => {
  assert.equal(SOLE.price, 199)
})

await test('shipping is free for pickup and from ฿700', () => {
  assert.equal(totals([line('new')], 'delivery').shipping, 50)
  assert.equal(totals([line('new')], 'pickup').shipping, 0)
  assert.equal(totals([line('new', 2)], 'delivery').shipping, 0)
  assert.equal(totals([line('sole', 3)], 'delivery').shipping, 50) // 597 < 700
  assert.equal(totals([line('sole', 4)], 'delivery').total, 796)
})

await test('address: 77 provinces, Bangkok uses แขวง/เขต, others ต./อ./จ.', () => {
  assert.equal(new Set(PROVINCES).size, 77)
  assert.equal(formatAddress({ line: '1 ถ.พระราม 1', subdistrict: 'วังใหม่', district: 'ปทุมวัน', province: 'กรุงเทพมหานคร', zip: '10330' }), '1 ถ.พระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร 10330')
  assert.equal(formatAddress({ line: '5', subdistrict: 'สุเทพ', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่', zip: '50200' }), '5 ต.สุเทพ อ.เมืองเชียงใหม่ จ.เชียงใหม่ 50200')
})

resetDB()

await test('order: new pair takes stock, sole does not, order is findable by phone', async () => {
  const before = stockOf(await getStock(), 'brown', 35)
  const o = await placeOrder({
    userId: 'u-demo',
    customer: { name: 'ทดสอบ', phone: '081-234-5678', email: '', address: 'x' },
    lines: [line('new'), line('sole', 2)],
    fulfilment: 'delivery',
    payment: 'promptpay',
  })
  assert.equal(o.subtotal, 390 + 2 * 199)
  assert.equal(o.shipping, 0)
  assert.equal(stockOf(await getStock(), 'brown', 35), before - 1)
  assert.ok(await findOrder(o.id, '0812345678'))
  assert.equal(await findOrder(o.id, '0800000000'), null)
})

console.log(`\n${passed} passed`)
