// Run with `npm test`. Checks pricing, addresses, the mock order flow and the free size exchange end to end.
import assert from 'node:assert/strict'
import { ApiError, findOrder, getStock, placeOrder, requestExchange, stockOf } from '../src/lib/api'
import { resetDB } from '../src/lib/db'
import { totals } from '../src/lib/pricing'
import { PROVINCES, formatAddress } from '../src/lib/catalog'
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

const line = (qty = 1, size = 35): CartLine => ({ key: `new-brown-${size}`, kind: 'new', color: 'brown', size, qty, unitPrice: 390 })

await test('shipping is free for pickup and from ฿700', () => {
  assert.equal(totals([line()], 'delivery').shipping, 50)
  assert.equal(totals([line()], 'pickup').shipping, 0)
  assert.equal(totals([line(2)], 'delivery').shipping, 0)
  assert.equal(totals([line(2)], 'delivery').total, 780)
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
    fulfilment: 'delivery',
    payment: 'promptpay',
  })
  assert.equal(o.subtotal, 390)
  assert.equal(stockOf(await getStock(), 'brown', 35), before - 1)
  assert.ok(await findOrder(o.id, '0812345678'))
  assert.equal(await findOrder(o.id, '0800000000'), null)
})

const rejects = (p: Promise<unknown>) => assert.rejects(p, ApiError)

await test('exchange: not before delivery', async () => {
  const o = await placeOrder({ userId: null, customer: { name: 'ทดสอบ', phone: '0811111111', email: '', address: 'x' }, lines: [line()], fulfilment: 'delivery', payment: 'promptpay' })
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
