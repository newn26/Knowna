// Deal flow + money/permission regressions, run against the real store: `npm test`.
import assert from 'node:assert/strict'
import { admin, auth, billing, dealSteps, deals, feeStatus, getDB, listings, lois, room, roomDocsFor } from '../src/lib/store'

const codeOf = (f: () => void) => { try { f(); return 'ok' } catch (e) { return (e as { code?: string }).code ?? String(e) } }
const as = (email: string) => auth.login(email, 'demo1234')
const file = (name: string, size = 100) => ({ name, type: 'text/plain', size, dataUrl: 'data:text/plain;base64,QQ==' })
const round = (price: number) => ({ price, currency: 'THB' as const, deposit: 1, conditions: '', ddDays: 30, expiresAt: Date.now() + 864e6, signatureName: 'B' })
const L = 'l-1', T = 't-1'

function openDeal(price: number) {
  as('buyer@demo.com'); lois.create(L, round(price))
  const id = getDB().lois.find((o) => o.listingId === L && o.status === 'open')!.id
  as('seller@demo.com'); lois.respond(id, 'accept', { signatureName: 'S' })
  return getDB().deals.find((x) => x.loiId === id)!
}
function toPaid(id: string) {
  as('buyer@demo.com'); deals.completeDD(id, 'ok'); deals.signContract(id, 'B')
  as('seller@demo.com'); deals.signContract(id, 'S')
  as('buyer@demo.com'); deals.markPaid(id)
}

// 1. happy path, order checks, documents, fee
{
  const deal = openDeal(380000)
  as('buyer@demo.com')
  for (const [name, f] of [['sign before dd', () => deals.signContract(deal.id, 'B')], ['pay before contract', () => deals.markPaid(deal.id)],
    ['handover before receipt', () => deals.confirmHandover(deal.id)], ['close before handover', () => deals.confirm(deal.id, 380000)]] as const)
    assert.equal(codeOf(f), 'step_order', name)
  as('seller@demo.com')
  assert.equal(codeOf(() => deals.completeDD(deal.id, '')), 'forbidden', 'seller cannot complete DD')
  room.upload(T, file('n.pdf'), 'nda'); room.upload(T, file('d.pdf'), 'deal')
  assert.equal(codeOf(() => room.upload(T, file('big', 9e6), 'nda')), 'file_too_big')
  as('buyer@demo.com')
  assert.equal(roomDocsFor(getDB(), 'u-buyer', T).filter((r) => r.file).length, 2)
  assert.equal(roomDocsFor(getDB(), 'u-other', T).length, 0, 'outsider sees nothing')
  toPaid(deal.id)
  as('seller@demo.com'); deals.markReceived(deal.id)
  as('buyer@demo.com'); deals.confirmHandover(deal.id)
  assert.equal(codeOf(() => deals.confirm(deal.id, 1000)), 'invalid', 'fee base cannot be lowered')
  assert.equal(deals.confirm(deal.id, 380000), 'waiting')
  as('seller@demo.com'); assert.equal(deals.confirm(deal.id, 380000), 'closed')
  let f = feeStatus(getDB(), getDB().deals.find((x) => x.id === deal.id)!)
  assert.equal(f.state, 'unpaid'); assert.equal(f.invoice!.amount, 17100, '4.5% of 380,000')
  const inv = getDB().invoices.find((i) => i.id === f.invoice!.id)!
  inv.status = 'paid'
  assert.equal(feeStatus(getDB(), getDB().deals.find((x) => x.id === deal.id)!).state, 'unverified', 'paid flag alone is not evidence')
  inv.status = 'unpaid'
  billing.recordPayment(inv.id, true, 'card', 'test', 'demo')
  f = feeStatus(getDB(), getDB().deals.find((x) => x.id === deal.id)!)
  assert.equal(f.state, 'paid'); assert.equal(f.payment!.provider, 'demo')
  assert.equal(dealSteps(getDB(), T).pct, 100)
}

// 2. a listing with a live deal cannot get a second deal
{
  admin.resetDemo()
  const deal = openDeal(2_700_000)
  assert.equal(codeOf(() => listings.setStatus(L, 'hidden')), 'deal_in_progress')
  assert.equal(codeOf(() => listings.setStatus(L, 'published')), 'forbidden')
  as('buyer@demo.com'); assert.equal(codeOf(() => lois.create(L, round(1))), 'not_available')
  assert.equal(getDB().deals.filter((x) => x.listingId === L && x.status === 'in_progress').length, 1)

  // 3. cancel is blocked once payment was reported; allowed before, and restores the listing
  toPaid(deal.id)
  as('seller@demo.com')
  assert.equal(codeOf(() => deals.cancel(deal.id)), 'cancel_after_payment')
  assert.equal(getDB().deals.find((x) => x.id === deal.id)!.status, 'in_progress')
}
{
  admin.resetDemo()
  const deal = openDeal(2_700_000)
  deals.cancel(deal.id)
  assert.equal(getDB().deals.find((x) => x.id === deal.id)!.status, 'cancelled')
  assert.equal(getDB().listings.find((l) => l.id === L)!.status, 'published')
}
// 4. only admins change the FX rate
{
  admin.resetDemo()
  as('buyer@demo.com'); assert.equal(codeOf(() => admin.setFx(1)), 'forbidden')
  auth.login('admin@demo.com', 'admin1234'); assert.equal(codeOf(() => admin.setFx(30)), 'ok')
}
console.log('ALL OK')
