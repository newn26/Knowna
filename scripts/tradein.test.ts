// Run with `npm test`. Checks the trade-in rules and the mock order flow end to end.
import assert from 'node:assert/strict'
import { placeOrder, verifyPurchase, inspect, findOrder } from '../src/lib/api'
import { resetDB, makeSerial } from '../src/lib/db'
import { totals } from '../src/lib/pricing'
import { allocateTradeIns, gradeFor, rateFor, scoreCondition } from '../src/lib/tradein'
import type { CartLine, TradeIn } from '../src/lib/types'

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

const line = (kind: 'new' | 'preowned', qty = 1, price = 890): CartLine => ({ key: `${kind}-${qty}-${price}`, kind, color: 'black', size: 38, qty, unitPrice: price, preownedId: kind === 'preowned' ? 'PO-1001' : undefined })
const ti = (id: string, pct: number): TradeIn => ({ id, serial: 'KW-BK38-' + id.padStart(6, '0'), color: 'black', size: 38, answers: {}, conditionPct: pct, grade: gradeFor(pct), rate: rateFor(pct), photoCount: 0, createdAt: '' })

await test('rate bands: 90–100 → 15%, 75–89 → 10%, <75 → 0', () => {
  assert.equal(rateFor(100), 0.15)
  assert.equal(rateFor(90), 0.15)
  assert.equal(rateFor(89), 0.1)
  assert.equal(rateFor(75), 0.1)
  assert.equal(rateFor(74), 0)
})

await test('any broken part caps the score below the 75% line', () => {
  assert.equal(scoreCondition({ upper: 0, sole: 0, insole: 0, stitch: 0, laces: 0 }), 100)
  assert.ok(scoreCondition({ upper: 0, sole: 0, insole: 0, stitch: 0, laces: 3 }) < 75)
})

await test('trade-in discounts only new pairs, one per pair, best rate on the priciest', () => {
  const a = allocateTradeIns([line('new', 1), line('preowned')], [ti('1', 80), ti('2', 95)])
  assert.equal(a[0].rate, 0.15)
  assert.equal(a[0].amount, 134) // 890 × 15% rounded
  assert.equal(a[1].appliedTo, null) // second trade-in has no new pair left
  assert.equal(a[1].amount, 0)
})

await test('rejected trade-in gives no discount', () => {
  assert.equal(totals([line('new')], [ti('1', 60)]).discount, 0)
})

await test('shipping is free for pickup and from ฿1,500', () => {
  assert.equal(totals([line('new')], [], 'delivery').shipping, 50)
  assert.equal(totals([line('new')], [], 'pickup').shipping, 0)
  assert.equal(totals([line('new', 2)], [], 'delivery').shipping, 0)
})

resetDB()

await test('verify: unknown, malformed and already-traded serials are refused', async () => {
  assert.equal((await verifyPurchase('KW-BK38-999999')).ok, false)
  assert.equal((await verifyPurchase('hello')).ok, false)
  assert.equal((await verifyPurchase(makeSerial('black', 33, 230512))).ok, false)
  assert.equal((await verifyPurchase('kaowna:' + makeSerial('black', 38, 240118).toLowerCase())).ok, true)
})

await test('order: trade-in applied once, then the serial cannot be reused', async () => {
  const v = await verifyPurchase(makeSerial('black', 38, 240118))
  assert.ok(v.ok)
  const t = await inspect(v.unit, { upper: 0, sole: 0, insole: 0, stitch: 1, laces: 0 }, 2)
  assert.equal(t.rate, 0.15)
  const o = await placeOrder({
    userId: 'u-demo',
    customer: { name: 'ทดสอบ', phone: '081-234-5678', email: '', address: 'x' },
    lines: [{ ...line('new'), color: 'black', size: 39 }],
    tradeIns: [t],
    fulfilment: 'delivery',
    payment: 'promptpay',
  })
  assert.equal(o.discount, 134)
  assert.equal(o.total, 890 - 134 + 50)
  assert.equal(o.serials.length, 1)
  assert.equal((await verifyPurchase(t.serial)).ok, false)
  assert.ok(await findOrder(o.id, '0812345678'))
  assert.equal(await findOrder(o.id, '0800000000'), null)
})

console.log(`\n${passed} passed`)
