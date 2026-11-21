/**
 * Client-side "database" for the prototype. Everything lives in localStorage,
 * so data is per-browser. The session lives in sessionStorage so two tabs can be
 * logged in as different users (e.g. buyer + seller chatting in "realtime").
 */
import { useSyncExternalStore } from 'react'
import type {
  Bi, BuyerRequest, Currency, DB, Deal, DealDoc, FileAsset, Invoice, Listing, Loi, LoiRound, Nda, Payment, Plan, Role, SearchParams, Thread, User,
} from './types'
import { DB_VERSION, makeSeed } from './seed'
import { demoHash, startOfMonth, uid, DAY } from './utils'
import { matches } from './search'
import { MAX_DOC_BYTES } from './constants'

const KEY = 'bizm:db'
const SESSION_KEY = 'bizm:session'
const LAST_SESSION_KEY = 'bizm:lastSession'

export class AppError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

function load(): DB {
  try {
    const s = localStorage.getItem(KEY)
    if (s) {
      const parsed = JSON.parse(s) as DB
      if (parsed.version === DB_VERSION) return parsed
    }
  } catch {
    /* ignore and reseed */
  }
  const seed = makeSeed()
  try {
    localStorage.setItem(KEY, JSON.stringify(seed))
  } catch {
    /* storage unavailable: run in-memory */
  }
  return seed
}

let db: DB = load()

export interface Session {
  userId: string
  role: Role
}

function loadSession(): Session | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(LAST_SESSION_KEY)
    return s ? (JSON.parse(s) as Session) : null
  } catch {
    return null
  }
}
let session: Session | null = loadSession()

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      db = JSON.parse(e.newValue)
      emit()
    } catch {
      /* ignore */
    }
  }
})

function commit(mutate: (d: DB) => void) {
  const next = structuredClone(db)
  mutate(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    throw new AppError('storage_full')
  }
  db = next
  emit()
}

function setSession(s: Session | null) {
  session = s
  try {
    if (s) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
      localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(s))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(LAST_SESSION_KEY)
    }
  } catch {
    /* ignore */
  }
  emit()
}

// ---------- hooks ----------
export const useDB = () => useSyncExternalStore(subscribe, () => db)
export const useSession = () => useSyncExternalStore(subscribe, () => session)
export function useMe(): User | null {
  const d = useDB()
  const s = useSession()
  return s ? d.users.find((u) => u.id === s.userId) ?? null : null
}
export const getDB = () => db
export const getSession = () => session

// ---------- helpers ----------
const me = () => {
  const u = session && db.users.find((x) => x.id === session!.userId)
  if (!u) throw new AppError('login_required')
  if (u.suspended) throw new AppError('suspended')
  return u
}

/** Identity verified (KYC) — admins are trusted by default. */
export const kycVerified = (u: User | null | undefined) => !!u && (u.isAdmin || u.kyc?.status === 'verified')
const requireKyc = (u: User) => {
  if (!kycVerified(u)) throw new AppError('kyc_required')
}

/** Listings with an active paid promotion (advertising revenue). */
export function sponsoredIds(d: DB): Set<string> {
  const now = Date.now()
  return new Set(d.listings.filter((l) => (l.sponsoredUntil ?? 0) > now && ['published', 'under_offer'].includes(l.status)).map((l) => l.id))
}

export function planOf(d: DB, u: User, audience: Role): Plan {
  const id = audience === 'seller' ? u.sellerPlanId : u.buyerPlanId
  const until = audience === 'seller' ? u.sellerPlanUntil : u.buyerPlanUntil
  const fallback = d.plans.find((p) => p.id === `${audience}-free`)!
  const p = d.plans.find((x) => x.id === id)
  if (!p || (until && until < Date.now() && p.priceTHB > 0)) return fallback
  return p
}

export function canViewFull(d: DB, userId: string | undefined, l: Listing) {
  if (!userId) return false
  const u = d.users.find((x) => x.id === userId)
  if (!u) return false
  if (u.isAdmin || l.sellerId === userId) return true
  return d.ndas.some((n) => n.listingId === l.id && n.buyerId === userId && n.status === 'approved')
}

export function featuredIds(d: DB): Set<string> {
  const s = new Set<string>()
  d.listings.forEach((l) => {
    const seller = d.users.find((u) => u.id === l.sellerId)
    if (seller && planOf(d, seller, 'seller').featured) s.add(l.id)
  })
  return s
}

export function unpaidFeeInvoices(d: DB, userId: string) {
  return d.invoices.filter((i) => i.userId === userId && i.kind === 'fee' && i.status === 'unpaid')
}

const ACTIVE_STATUSES = ['pending', 'published', 'under_offer', 'hidden']
export function activeListingCount(d: DB, userId: string) {
  return d.listings.filter((l) => l.sellerId === userId && ACTIVE_STATUSES.includes(l.status)).length
}

export function ndaUsedThisMonth(d: DB, userId: string) {
  const from = startOfMonth()
  return d.ndas.filter((n) => n.buyerId === userId && n.createdAt >= from).length
}

function notify(d: DB, userId: string, text: Bi, link: string) {
  d.notifications.push({ id: uid('nt-'), userId, text, link, read: false, createdAt: Date.now() })
}

function sysMsg(d: DB, threadId: string, key: string, link?: string) {
  const at = Date.now()
  d.messages.push({ id: uid('m-'), threadId, senderId: null, text: key, link, createdAt: at })
  const t = d.threads.find((x) => x.id === threadId)
  if (t) t.lastMessageAt = at
}

function ensureThread(d: DB, listingId: string, buyerId: string): Thread {
  let t = d.threads.find((x) => x.listingId === listingId && x.buyerId === buyerId)
  if (!t) {
    const l = d.listings.find((x) => x.id === listingId)!
    t = { id: uid('t-'), listingId, buyerId, sellerId: l.sellerId, createdAt: Date.now(), lastMessageAt: Date.now(), lastRead: {} }
    d.threads.push(t)
  }
  return t
}

function onPublished(d: DB, l: Listing) {
  d.savedSearches.forEach((s) => {
    const u = d.users.find((x) => x.id === s.userId)
    if (!u || u.id === l.sellerId || !planOf(d, u, 'buyer').alerts) return
    if (matches(l, s.params, d.fx.usdThb)) {
      notify(d, u.id, { th: `ประกาศใหม่ตรงกับที่คุณบันทึกไว้: ${l.displayName}`, en: `New listing matches your saved search: ${l.displayName}` }, `/listing/${l.id}`)
    }
  })
}

// ---------- auth ----------
export const auth = {
  register(p: { email: string; name: string; password: string; primaryRole: Role }) {
    const email = p.email.trim().toLowerCase()
    if (db.users.some((u) => u.email === email)) throw new AppError('email_taken')
    const u: User = {
      id: uid('u-'), email, name: p.name.trim(), passwordHash: demoHash(p.password), primaryRole: p.primaryRole,
      isAdmin: false, emailVerified: false, sellerVerified: false, suspended: false,
      sellerPlanId: 'seller-free', buyerPlanId: 'buyer-free', provider: 'password', createdAt: Date.now(),
    }
    commit((d) => {
      d.users.push(u)
    })
    return u
  },
  verifyEmail(userId: string) {
    commit((d) => {
      const u = d.users.find((x) => x.id === userId)
      if (u) u.emailVerified = true
    })
    const u = db.users.find((x) => x.id === userId)!
    setSession({ userId, role: u.primaryRole })
  },
  login(email: string, password: string) {
    const u = db.users.find((x) => x.email === email.trim().toLowerCase())
    if (!u || u.passwordHash !== demoHash(password)) throw new AppError('bad_credentials')
    if (u.suspended) throw new AppError('suspended')
    if (!u.emailVerified) throw new AppError('email_unverified')
    setSession({ userId: u.id, role: u.primaryRole })
    return u
  },
  loginGoogle() {
    const email = 'google.user@gmail.com'
    let u = db.users.find((x) => x.email === email)
    if (!u) {
      u = {
        id: uid('u-'), email, name: 'Google Demo User', passwordHash: '', primaryRole: 'buyer', isAdmin: false,
        emailVerified: true, sellerVerified: false, suspended: false, sellerPlanId: 'seller-free',
        buyerPlanId: 'buyer-free', provider: 'google', createdAt: Date.now(),
      }
      const nu = u
      commit((d) => {
        d.users.push(nu)
      })
    }
    if (u.suspended) throw new AppError('suspended')
    setSession({ userId: u.id, role: u.primaryRole })
    return u
  },
  logout() {
    setSession(null)
  },
  setRole(role: Role) {
    if (session) setSession({ ...session, role })
  },
  updateProfile(p: { name: string; phone?: string }) {
    const u = me()
    commit((d) => {
      const x = d.users.find((y) => y.id === u.id)!
      x.name = p.name
      x.phone = p.phone
    })
  },
}

// ---------- listings ----------
export type ListingInput = Omit<Listing, 'id' | 'sellerId' | 'status' | 'views' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'rejectReason'>

const viewed = new Set<string>()

export const listings = {
  save(input: ListingInput, opts: { id?: string; submit: boolean }) {
    const u = me()
    const existing = opts.id ? db.listings.find((l) => l.id === opts.id) : undefined
    if (existing && existing.sellerId !== u.id) throw new AppError('forbidden')
    if (opts.submit) {
      if (unpaidFeeInvoices(db, u.id).length) throw new AppError('unpaid_fee')
      const wasActive = existing && ACTIVE_STATUSES.includes(existing.status)
      const limit = planOf(db, u, 'seller').listingLimit
      if (!wasActive && limit != null && activeListingCount(db, u.id) >= limit) throw new AppError('listing_limit')
    }
    const id = existing?.id ?? uid('l-')
    commit((d) => {
      const now = Date.now()
      const keepPublished = existing && ['published', 'under_offer'].includes(existing.status)
      const status = opts.submit ? (keepPublished ? existing!.status : 'pending') : existing?.status === 'published' ? 'published' : 'draft'
      const base: Listing = existing
        ? { ...d.listings.find((l) => l.id === id)!, ...input, status, updatedAt: now, rejectReason: undefined }
        : { ...input, id, sellerId: u.id, status, views: 0, createdAt: now, updatedAt: now }
      if (existing) d.listings[d.listings.findIndex((l) => l.id === id)] = base
      else d.listings.push(base)
      if (status === 'pending' && existing?.status !== 'pending') {
        d.users.filter((x) => x.isAdmin).forEach((a) =>
          notify(d, a.id, { th: `ประกาศใหม่รอตรวจ: ${input.displayName}`, en: `Listing awaiting review: ${input.displayName}` }, '/admin'),
        )
      }
    })
    return id
  },
  setStatus(id: string, status: 'hidden' | 'published' | 'archived') {
    const u = me()
    commit((d) => {
      const l = d.listings.find((x) => x.id === id)
      if (!l || l.sellerId !== u.id) throw new AppError('forbidden')
      if (status === 'published' && l.status !== 'hidden') throw new AppError('forbidden')
      if (d.deals.some((x) => x.listingId === id && x.status === 'in_progress')) throw new AppError('deal_in_progress')
      l.status = status
      l.updatedAt = Date.now()
    })
  },
  remove(id: string) {
    const u = me()
    commit((d) => {
      const l = d.listings.find((x) => x.id === id)
      if (!l || l.sellerId !== u.id || l.status !== 'draft') throw new AppError('forbidden')
      d.listings = d.listings.filter((x) => x.id !== id)
    })
  },
  view(id: string) {
    if (viewed.has(id)) return
    viewed.add(id)
    try {
      commit((d) => {
        const l = d.listings.find((x) => x.id === id)
        if (l) l.views++
      })
    } catch {
      /* ignore */
    }
  },
  toggleFavorite(listingId: string) {
    const u = me()
    commit((d) => {
      const i = d.favorites.findIndex((f) => f.userId === u.id && f.listingId === listingId)
      if (i >= 0) d.favorites.splice(i, 1)
      else d.favorites.push({ userId: u.id, listingId })
    })
  },
  report(listingId: string, reason: string) {
    const u = me()
    commit((d) => {
      d.reports.push({ id: uid('r-'), kind: 'listing', targetId: listingId, reporterId: u.id, reason, status: 'open', createdAt: Date.now() })
    })
  },
}

// ---------- chat ----------
export const chat = {
  open(listingId: string) {
    const u = me()
    const l = db.listings.find((x) => x.id === listingId)
    if (!l) throw new AppError('not_found')
    if (l.sellerId === u.id) throw new AppError('own_listing')
    let id = ''
    commit((d) => {
      id = ensureThread(d, listingId, u.id).id
    })
    return id
  },
  send(threadId: string, text: string, file?: FileAsset) {
    const u = me()
    commit((d) => {
      const t = d.threads.find((x) => x.id === threadId)
      if (!t || (t.buyerId !== u.id && t.sellerId !== u.id)) throw new AppError('forbidden')
      const at = Date.now()
      d.messages.push({ id: uid('m-'), threadId, senderId: u.id, text, file, createdAt: at })
      t.lastMessageAt = at
      t.lastRead[u.id] = at
    })
  },
  markRead(threadId: string) {
    const s = session
    if (!s) return
    const t = db.threads.find((x) => x.id === threadId)
    if (!t || (t.lastRead[s.userId] ?? 0) >= t.lastMessageAt) return
    commit((d) => {
      d.threads.find((x) => x.id === threadId)!.lastRead[s.userId] = Date.now()
    })
  },
  report(threadId: string, reason: string) {
    const u = me()
    commit((d) => {
      d.reports.push({ id: uid('r-'), kind: 'thread', targetId: threadId, reporterId: u.id, reason, status: 'open', createdAt: Date.now() })
    })
  },
}

export function unreadCount(d: DB, userId: string) {
  return d.threads.filter(
    (t) => (t.buyerId === userId || t.sellerId === userId) && t.lastMessageAt > (t.lastRead[userId] ?? 0) &&
      d.messages.some((m) => m.threadId === t.id && m.senderId !== userId && m.createdAt > (t.lastRead[userId] ?? 0)),
  ).length
}

// ---------- NDA ----------
export const ndas = {
  request(listingId: string, signatureName: string) {
    const u = me()
    const l = db.listings.find((x) => x.id === listingId)
    if (!l) throw new AppError('not_found')
    if (l.sellerId === u.id) throw new AppError('own_listing')
    requireKyc(u)
    const existing = db.ndas.find((n) => n.listingId === listingId && n.buyerId === u.id && n.status !== 'rejected')
    if (existing) throw new AppError('nda_exists')
    const lim = planOf(db, u, 'buyer').ndaLimitPerMonth
    if (lim != null && ndaUsedThisMonth(db, u.id) >= lim) throw new AppError('nda_limit')
    let id = ''
    commit((d) => {
      const n: Nda = { id: uid('n-'), listingId, buyerId: u.id, sellerId: l.sellerId, status: 'pending', buyerSignature: { name: signatureName, at: Date.now() }, createdAt: Date.now() }
      id = n.id
      d.ndas.push(n)
      const t = ensureThread(d, listingId, u.id)
      sysMsg(d, t.id, 'nda_signed', `/contract/nda/${n.id}`)
      notify(d, l.sellerId, { th: `${u.name} เซ็น NDA สำหรับ "${l.displayName}" รอคุณอนุมัติ`, en: `${u.name} signed an NDA for "${l.displayName}" — awaiting your approval` }, '/dashboard?tab=ndas')
    })
    return id
  },
  decide(ndaId: string, approve: boolean, signatureName?: string) {
    const u = me()
    commit((d) => {
      const n = d.ndas.find((x) => x.id === ndaId)
      if (!n || n.sellerId !== u.id || n.status !== 'pending') throw new AppError('forbidden')
      n.status = approve ? 'approved' : 'rejected'
      n.decidedAt = Date.now()
      if (approve) n.sellerSignature = { name: signatureName || u.name, at: Date.now() }
      const l = d.listings.find((x) => x.id === n.listingId)!
      const t = ensureThread(d, n.listingId, n.buyerId)
      sysMsg(d, t.id, approve ? 'nda_approved' : 'nda_rejected', `/contract/nda/${n.id}`)
      notify(d, n.buyerId, approve
        ? { th: `NDA ได้รับอนุมัติ — ดูข้อมูลเต็มของ "${l.displayName}" ได้แล้ว`, en: `NDA approved — full details of "${l.displayName}" unlocked` }
        : { th: `NDA สำหรับ "${l.displayName}" ถูกปฏิเสธ`, en: `NDA for "${l.displayName}" was declined` }, `/listing/${l.id}`)
    })
  },
}

// ---------- LOI / offers ----------
export type RoundInput = Omit<LoiRound, 'by' | 'signature'> & { signatureName: string }

export const lois = {
  create(listingId: string, r: RoundInput) {
    const u = me()
    const l = db.listings.find((x) => x.id === listingId)
    if (!l || l.status !== 'published') throw new AppError('not_available')
    if (l.sellerId === u.id) throw new AppError('own_listing')
    requireKyc(u)
    if (!canViewFull(db, u.id, l)) throw new AppError('nda_required')
    if (db.lois.some((x) => x.listingId === listingId && x.buyerId === u.id && x.status === 'open')) throw new AppError('loi_exists')
    let id = ''
    commit((d) => {
      const { signatureName, ...rest } = r
      const loi: Loi = {
        id: uid('o-'), listingId, buyerId: u.id, sellerId: l.sellerId, status: 'open',
        rounds: [{ ...rest, by: 'buyer', signature: { name: signatureName, at: Date.now() } }],
        createdAt: Date.now(), updatedAt: Date.now(),
      }
      id = loi.id
      d.lois.push(loi)
      const t = ensureThread(d, listingId, u.id)
      sysMsg(d, t.id, 'loi_sent', `/contract/loi/${loi.id}`)
      notify(d, l.sellerId, { th: `ได้รับข้อเสนอซื้อ (LOI) สำหรับ "${l.displayName}"`, en: `New offer (LOI) for "${l.displayName}"` }, `/contract/loi/${loi.id}`)
    })
    return id
  },
  respond(loiId: string, action: 'accept' | 'reject' | 'counter' | 'withdraw', payload?: { signatureName: string; round?: RoundInput }) {
    const u = me()
    commit((d) => {
      const loi = d.lois.find((x) => x.id === loiId)
      if (!loi || loi.status !== 'open') throw new AppError('forbidden')
      const myRole: Role | null = loi.buyerId === u.id ? 'buyer' : loi.sellerId === u.id ? 'seller' : null
      if (!myRole) throw new AppError('forbidden')
      const last = loi.rounds[loi.rounds.length - 1]
      const other = myRole === 'buyer' ? loi.sellerId : loi.buyerId
      const l = d.listings.find((x) => x.id === loi.listingId)!
      const t = ensureThread(d, loi.listingId, loi.buyerId)
      loi.updatedAt = Date.now()
      if (action === 'withdraw') {
        if (myRole !== 'buyer') throw new AppError('forbidden')
        loi.status = 'withdrawn'
        sysMsg(d, t.id, 'loi_withdrawn', `/contract/loi/${loi.id}`)
        return
      }
      if (last.by === myRole) throw new AppError('not_your_turn')
      if (action === 'accept' && last.expiresAt < Date.now()) throw new AppError('loi_expired')
      if (action === 'accept') {
        if (l.status !== 'published' || d.deals.some((x) => x.listingId === l.id && x.status === 'in_progress')) throw new AppError('not_available')
        loi.status = 'accepted'
        loi.acceptedSignature = { name: payload?.signatureName || u.name, at: Date.now() }
        l.status = 'under_offer'
        const deal: Deal = {
          id: uid('d-'), listingId: l.id, loiId: loi.id, buyerId: loi.buyerId, sellerId: loi.sellerId,
          agreedPrice: last.price, currency: last.currency, status: 'in_progress', createdAt: Date.now(),
        }
        d.deals.push(deal)
        // other open offers on this listing are closed
        d.lois.forEach((o) => {
          if (o.listingId === l.id && o.id !== loi.id && o.status === 'open') o.status = 'rejected'
        })
        sysMsg(d, t.id, 'loi_accepted', `/contract/loi/${loi.id}`)
        notify(d, other, { th: `ข้อเสนอสำหรับ "${l.displayName}" ได้รับการยอมรับแล้ว`, en: `Offer for "${l.displayName}" accepted` }, '/dashboard?tab=deals')
      } else if (action === 'reject') {
        loi.status = 'rejected'
        sysMsg(d, t.id, 'loi_rejected', `/contract/loi/${loi.id}`)
        notify(d, other, { th: `ข้อเสนอสำหรับ "${l.displayName}" ถูกปฏิเสธ`, en: `Offer for "${l.displayName}" rejected` }, `/contract/loi/${loi.id}`)
      } else {
        const r = payload?.round
        if (!r) throw new AppError('invalid')
        const { signatureName, ...rest } = r
        loi.rounds.push({ ...rest, by: myRole, signature: { name: signatureName, at: Date.now() } })
        sysMsg(d, t.id, 'loi_countered', `/contract/loi/${loi.id}`)
        notify(d, other, { th: `มีข้อเสนอโต้กลับสำหรับ "${l.displayName}"`, en: `Counter-offer on "${l.displayName}"` }, `/contract/loi/${loi.id}`)
      }
    })
  },
}

// ---------- deals ----------
function closeDeal(d: DB, deal: Deal, price: number, by: 'parties' | 'admin') {
  deal.status = 'closed'
  deal.closedAt = Date.now()
  deal.closedBy = by
  deal.agreedPrice = price
  const l = d.listings.find((x) => x.id === deal.listingId)!
  l.status = 'sold'
  const seller = d.users.find((x) => x.id === deal.sellerId)!
  const plan = planOf(d, seller, 'seller')
  const inv: Invoice = {
    id: uid('inv-'), userId: seller.id, kind: 'fee',
    description: { th: `ค่าธรรมเนียมความสำเร็จ ${plan.feePercent}% — ${l.displayName}`, en: `Success fee ${plan.feePercent}% — ${l.displayName}` },
    amount: Math.round(price * plan.feePercent) / 100, currency: deal.currency, status: 'unpaid', refId: deal.id, createdAt: Date.now(),
  }
  d.invoices.push(inv)
  deal.invoiceId = inv.id
  const t = ensureThread(d, deal.listingId, deal.buyerId)
  sysMsg(d, t.id, 'deal_closed')
  notify(d, seller.id, { th: `ดีลปิดแล้ว! ชำระค่าธรรมเนียม ${plan.feePercent}% ได้ที่หน้าใบแจ้งหนี้`, en: `Deal closed! Please pay the ${plan.feePercent}% success fee` }, `/checkout/${inv.id}`)
  notify(d, deal.buyerId, { th: `ดีล "${l.displayName}" ปิดเรียบร้อย ยินดีด้วย!`, en: `Deal "${l.displayName}" closed — congratulations!` }, '/dashboard?tab=deals')
}

export const deals = {
  confirm(dealId: string, price: number) {
    const u = me()
    let result: 'waiting' | 'closed' | 'mismatch' = 'waiting'
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress') throw new AppError('forbidden')
      if (!deal.handoverAt) throw new AppError('step_order') // cannot close before payment + handover are on record
      if (price !== deal.agreedPrice) throw new AppError('invalid') // the success fee is charged on the agreed price; changing it needs a new LOI round
      const c = { price, at: Date.now() }
      if (deal.buyerId === u.id) deal.buyerConfirm = c
      else if (deal.sellerId === u.id) deal.sellerConfirm = c
      else throw new AppError('forbidden')
      if (deal.buyerConfirm && deal.sellerConfirm) {
        if (deal.buyerConfirm.price === deal.sellerConfirm.price) {
          closeDeal(d, deal, price, 'parties')
          result = 'closed'
        } else result = 'mismatch'
      }
    })
    return result
  },
  /** Simulated transaction: buyer reports payment, seller confirms receipt. No real money moves. */
  markPaid(dealId: string) {
    const u = me()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress' || deal.buyerId !== u.id) throw new AppError('forbidden')
      if (!deal.contract?.buyer || !deal.contract.seller || deal.transaction?.buyerPaidAt) throw new AppError('step_order')
      deal.transaction = { ...deal.transaction, buyerPaidAt: Date.now() }
      const l = d.listings.find((x) => x.id === deal.listingId)!
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'txn_paid')
      notify(d, deal.sellerId, { th: `ผู้ซื้อแจ้งชำระเงินสำหรับ "${l.displayName}" แล้ว กรุณายืนยันการรับเงิน`, en: `The buyer reported payment for "${l.displayName}" — please confirm receipt` }, `/room/${t.id}`)
    })
  },
  markReceived(dealId: string) {
    const u = me()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress' || deal.sellerId !== u.id || !deal.transaction?.buyerPaidAt) throw new AppError('forbidden')
      deal.transaction = { ...deal.transaction, sellerReceivedAt: Date.now() }
      const l = d.listings.find((x) => x.id === deal.listingId)!
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'txn_received')
      notify(d, deal.buyerId, { th: `ผู้ขายยืนยันรับเงินสำหรับ "${l.displayName}" แล้ว`, en: `The seller confirmed receiving payment for "${l.displayName}"` }, `/room/${t.id}`)
    })
  },
  /** Stage 5: the buyer records that due diligence is finished. */
  completeDD(dealId: string, note: string) {
    const u = me()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress' || deal.buyerId !== u.id) throw new AppError('forbidden')
      if (deal.dd) throw new AppError('step_order')
      deal.dd = { by: u.id, at: Date.now(), note: note.trim().slice(0, 500) }
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'dd_done')
      notify(d, deal.sellerId, { th: 'ผู้ซื้อตรวจสอบกิจการเสร็จแล้ว พร้อมลงนามสัญญา', en: 'The buyer finished due diligence — ready to sign the contract' }, `/room/${t.id}`)
    })
  },
  /** Stage 6: each party signs once, only after due diligence. */
  signContract(dealId: string, name: string) {
    const u = me()
    if (!name.trim()) throw new AppError('invalid')
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress') throw new AppError('forbidden')
      const side = deal.buyerId === u.id ? 'buyer' : deal.sellerId === u.id ? 'seller' : null
      if (!side) throw new AppError('forbidden')
      if (!deal.dd || deal.contract?.[side]) throw new AppError('step_order')
      deal.contract = { ...deal.contract, [side]: { name: name.trim(), at: Date.now() } }
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'contract_signed')
      notify(d, side === 'buyer' ? deal.sellerId : deal.buyerId, { th: 'อีกฝ่ายลงนามสัญญาซื้อขายแล้ว', en: 'The other party signed the sale contract' }, `/room/${t.id}`)
    })
  },
  /** End of stage 7: the buyer confirms the handover, only after the seller confirmed the money. */
  confirmHandover(dealId: string) {
    const u = me()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress' || deal.buyerId !== u.id) throw new AppError('forbidden')
      if (!deal.transaction?.sellerReceivedAt || deal.handoverAt) throw new AppError('step_order')
      deal.handoverAt = Date.now()
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'handover_done')
      notify(d, deal.sellerId, { th: 'ผู้ซื้อยืนยันการส่งมอบกิจการแล้ว กรุณายืนยันปิดดีล', en: 'The buyer confirmed the handover — please confirm closing' }, `/room/${t.id}`)
    })
  },
  cancel(dealId: string) {
    const u = me()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress' || (deal.buyerId !== u.id && deal.sellerId !== u.id)) throw new AppError('forbidden')
      if (deal.transaction?.buyerPaidAt) throw new AppError('cancel_after_payment') // money already reported: use a dispute
      deal.status = 'cancelled'
      const l = d.listings.find((x) => x.id === deal.listingId)!
      if (l.status === 'under_offer') l.status = 'published'
      const t = ensureThread(d, deal.listingId, deal.buyerId)
      sysMsg(d, t.id, 'deal_cancelled')
      notify(d, u.id === deal.buyerId ? deal.sellerId : deal.buyerId, { th: `ดีล "${l.displayName}" ถูกยกเลิก`, en: `Deal "${l.displayName}" was cancelled` }, '/dashboard?tab=deals')
    })
  },
}

// ---------- deal room: documents, steps, fee status ----------
export const room = {
  upload(threadId: string, file: FileAsset, access: DealDoc['access']) {
    const u = me()
    if (file.size > MAX_DOC_BYTES) throw new AppError('file_too_big')
    commit((d) => {
      const t = d.threads.find((x) => x.id === threadId)
      if (!t || (t.buyerId !== u.id && t.sellerId !== u.id)) throw new AppError('forbidden')
      const l = d.listings.find((x) => x.id === t.listingId)!
      if (!canViewFull(d, t.buyerId, l)) throw new AppError('nda_required')
      if (access === 'deal' && !d.deals.some((x) => x.listingId === t.listingId && x.buyerId === t.buyerId && x.status !== 'cancelled')) throw new AppError('step_order')
      d.roomDocs.push({ id: uid('rd-'), threadId, file, by: u.id, access, at: Date.now() })
    })
  },
}

/** Documents of a room as this user may see them: files they may not open come back with file = null. */
export function roomDocsFor(d: DB, userId: string, threadId: string) {
  const t = d.threads.find((x) => x.id === threadId)
  const u = d.users.find((x) => x.id === userId)
  if (!t || !u || (!u.isAdmin && t.buyerId !== userId && t.sellerId !== userId)) return []
  const l = d.listings.find((x) => x.id === t.listingId)!
  const ndaOk = canViewFull(d, t.buyerId, l)
  const dealOk = d.deals.some((x) => x.listingId === t.listingId && x.buyerId === t.buyerId && x.status !== 'cancelled')
  return d.roomDocs.filter((x) => x.threadId === threadId).map((x) => {
    const open = x.by === userId || u.isAdmin || (x.access === 'nda' ? ndaOk : ndaOk && dealOk)
    return { id: x.id, by: x.by, access: x.access, at: x.at, file: open ? x.file : null }
  })
}

export type StepKey = 'nda' | 'disclose' | 'loi' | 'negotiate' | 'dd' | 'contract' | 'payment' | 'close'
export const STEP_KEYS: StepKey[] = ['nda', 'disclose', 'loi', 'negotiate', 'dd', 'contract', 'payment', 'close']

/** The 8 deal stages, derived only from stored records so the UI cannot show a stage the data does not support. */
export function dealSteps(d: DB, threadId: string) {
  const t = d.threads.find((x) => x.id === threadId)!
  const l = d.listings.find((x) => x.id === t.listingId)!
  const nda = d.ndas.filter((n) => n.listingId === l.id && n.buyerId === t.buyerId).sort((a, b) => b.createdAt - a.createdAt)[0]
  const loi = d.lois.filter((o) => o.listingId === l.id && o.buyerId === t.buyerId).sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const deal = d.deals.filter((x) => x.listingId === l.id && x.buyerId === t.buyerId && x.status !== 'cancelled').sort((a, b) => b.createdAt - a.createdAt)[0]
  const shared = l.confidential.documents.length > 0 || d.roomDocs.some((x) => x.threadId === threadId && x.by === l.sellerId)
  const done = [
    nda?.status === 'approved',
    nda?.status === 'approved' && shared,
    !!loi && loi.status !== 'withdrawn',
    !!deal,
    !!deal?.dd,
    !!(deal?.contract?.buyer && deal.contract.seller),
    !!deal?.handoverAt,
    deal?.status === 'closed',
  ]
  for (let i = done.length - 2; i >= 0; i--) done[i] = done[i] || done[i + 1] // a later stage implies the earlier ones
  const current = done.indexOf(false)
  return { nda, loi, deal, done, current: current === -1 ? done.length : current, pct: Math.round((done.filter(Boolean).length / done.length) * 100) }
}

/** Success-fee status, kept apart from the deal status. 'paid' needs a succeeded Payment record as evidence. */
export function feeStatus(d: DB, deal: Deal): { state: 'not_due' | 'unpaid' | 'paid' | 'unverified'; invoice?: Invoice; payment?: Payment } {
  const invoice = deal.status === 'closed' && deal.invoiceId ? d.invoices.find((i) => i.id === deal.invoiceId) : undefined
  if (!invoice) return { state: 'not_due' }
  if (invoice.status === 'unpaid') return { state: 'unpaid', invoice }
  const payment = d.payments.find((p) => p.invoiceId === invoice.id && p.status === 'succeeded')
  return payment ? { state: 'paid', invoice, payment } : { state: 'unverified', invoice }
}

// ---------- disputes ----------
export const disputes = {
  open(dealId: string, reason: string) {
    const u = me()
    if (!reason.trim()) throw new AppError('invalid')
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || (deal.buyerId !== u.id && deal.sellerId !== u.id)) throw new AppError('forbidden')
      if (d.disputes.some((x) => x.dealId === dealId && x.status === 'open')) throw new AppError('dispute_exists')
      d.disputes.push({ id: uid('dp-'), dealId, openedBy: u.id, reason: reason.trim(), status: 'open', createdAt: Date.now() })
      const l = d.listings.find((x) => x.id === deal.listingId)!
      sysMsg(d, ensureThread(d, deal.listingId, deal.buyerId).id, 'dispute_opened')
      d.users.filter((x) => x.isAdmin).forEach((a) =>
        notify(d, a.id, { th: `มีการแจ้งข้อพิพาท: ${l.displayName}`, en: `Dispute opened: ${l.displayName}` }, '/admin?tab=disputes'),
      )
      notify(d, u.id === deal.buyerId ? deal.sellerId : deal.buyerId, { th: `อีกฝ่ายแจ้งข้อพิพาทในดีล "${l.displayName}" ทีมงานจะติดต่อประสานงาน`, en: `The other party opened a dispute on "${l.displayName}" — our team will mediate` }, '/dashboard?tab=deals')
    })
  },
}

// ---------- KYC ----------
export const kyc = {
  submit(p: { fullName: string; idNumber: string; idImage: string }) {
    const u = me()
    const digits = p.idNumber.replace(/\W/g, '')
    if (!p.fullName.trim() || digits.length < 6 || !p.idImage) throw new AppError('invalid')
    // keep only the last 3 characters of the ID number — the prototype never stores the full number
    const masked = 'x'.repeat(Math.max(0, digits.length - 3)) + digits.slice(-3)
    commit((d) => {
      const x = d.users.find((y) => y.id === u.id)!
      x.kyc = { status: 'pending', fullName: p.fullName.trim(), idNumber: masked, idImage: p.idImage, submittedAt: Date.now() }
      d.users.filter((a) => a.isAdmin).forEach((a) =>
        notify(d, a.id, { th: `คำขอยืนยันตัวตนใหม่: ${x.name}`, en: `New identity verification: ${x.name}` }, '/admin?tab=kyc'),
      )
    })
  },
}

// ---------- billing ----------
export const billing = {
  subscribe(planId: string, currency: Currency) {
    const u = me()
    const plan = db.plans.find((p) => p.id === planId)
    if (!plan || !plan.active) throw new AppError('not_found')
    if (plan.priceTHB === 0) {
      commit((d) => {
        const x = d.users.find((y) => y.id === u.id)!
        if (plan.audience === 'seller') { x.sellerPlanId = plan.id; x.sellerPlanUntil = undefined }
        else { x.buyerPlanId = plan.id; x.buyerPlanUntil = undefined }
      })
      return null
    }
    const inv: Invoice = {
      id: uid('inv-'), userId: u.id, kind: 'subscription',
      description: { th: `แพ็กเกจ ${plan.name.th} (${plan.audience === 'seller' ? 'ผู้ขาย' : 'ผู้ซื้อ'}) — 30 วัน`, en: `${plan.name.en} plan (${plan.audience}) — 30 days` },
      amount: currency === 'THB' ? plan.priceTHB : plan.priceUSD, currency, status: 'unpaid', refId: plan.id, createdAt: Date.now(),
    }
    commit((d) => {
      d.invoices.push(inv)
    })
    return inv.id
  },
  /** Advertising: pay to show a listing as Sponsored for a few days. */
  promote(listingId: string, currency: Currency) {
    const u = me()
    const l = db.listings.find((x) => x.id === listingId)
    if (!l || l.sellerId !== u.id || l.status !== 'published') throw new AppError('forbidden')
    const s = db.settings
    const inv: Invoice = {
      id: uid('inv-'), userId: u.id, kind: 'ad',
      description: { th: `โปรโมตประกาศ (Sponsored) ${s.adDays} วัน — ${l.displayName}`, en: `Sponsored listing, ${s.adDays} days — ${l.displayName}` },
      amount: currency === 'THB' ? s.adPriceTHB : s.adPriceUSD, currency, status: 'unpaid', refId: l.id, createdAt: Date.now(),
    }
    commit((d) => {
      d.invoices.push(inv)
    })
    return inv.id
  },
  // shortcut: the browser reports the charge result, so a succeeded payment is only as trustworthy as the provider. Real gateway: set it from a server webhook.
  recordPayment(invoiceId: string, ok: boolean, method: 'card' | 'promptpay', detail: string, provider: string) {
    const u = me()
    commit((d) => {
      const inv = d.invoices.find((x) => x.id === invoiceId)
      if (!inv || inv.userId !== u.id || inv.status === 'paid') throw new AppError('forbidden')
      const pay = { id: uid('pay-'), invoiceId, method, status: ok ? 'succeeded' : 'failed', detail, provider, createdAt: Date.now() } as const
      d.payments.push({ ...pay })
      if (!ok) return
      inv.status = 'paid'
      inv.paidAt = Date.now()
      inv.paymentId = pay.id
      if (inv.kind === 'subscription') {
        const plan = d.plans.find((p) => p.id === inv.refId)!
        const x = d.users.find((y) => y.id === u.id)!
        if (plan.audience === 'seller') { x.sellerPlanId = plan.id; x.sellerPlanUntil = Date.now() + 30 * DAY }
        else { x.buyerPlanId = plan.id; x.buyerPlanUntil = Date.now() + 30 * DAY }
      }
      if (inv.kind === 'ad') {
        const l = d.listings.find((x) => x.id === inv.refId)
        if (l) l.sponsoredUntil = Math.max(Date.now(), l.sponsoredUntil ?? 0) + d.settings.adDays * DAY
      }
    })
  },
}

// ---------- saved searches / notifications ----------
export const alerts = {
  save(params: SearchParams) {
    const u = me()
    if (!planOf(db, u, 'buyer').alerts) throw new AppError('pro_required')
    commit((d) => {
      d.savedSearches.push({ id: uid('s-'), userId: u.id, params, createdAt: Date.now() })
    })
  },
  remove(id: string) {
    const u = me()
    commit((d) => {
      d.savedSearches = d.savedSearches.filter((s) => !(s.id === id && s.userId === u.id))
    })
  },
  markAllRead() {
    const u = me()
    commit((d) => {
      d.notifications.forEach((n) => {
        if (n.userId === u.id) n.read = true
      })
    })
  },
}

// ---------- buyer requests & pitches (reverse marketplace) ----------
export type RequestInput = Pick<BuyerRequest, 'title' | 'category' | 'province' | 'maxBudget' | 'minProfit' | 'description' | 'purpose'>

/** Does a listing satisfy a buyer request? Money is compared in THB. */
export function requestMatches(l: Listing, r: BuyerRequest, usdThb: number) {
  const k = l.currency === 'USD' ? usdThb : 1
  return (!r.category || l.category === r.category) &&
    (!r.province || l.province === r.province) &&
    l.askingPrice * k <= r.maxBudget &&
    l.netProfit * k >= r.minProfit
}

export const requests = {
  create(input: RequestInput) {
    const u = me()
    if (!input.title.trim() || !(input.maxBudget > 0) || input.minProfit < 0) throw new AppError('invalid')
    const id = uid('r-')
    commit((d) => {
      const r: BuyerRequest = { ...input, title: input.title.trim(), id, buyerId: u.id, status: 'open', createdAt: Date.now() }
      d.buyerRequests.push(r)
      // tell sellers who already have a matching live listing
      const sellers = new Set(d.listings.filter((l) => l.status === 'published' && l.sellerId !== u.id && requestMatches(l, r, d.fx.usdThb)).map((l) => l.sellerId))
      sellers.forEach((s) => notify(d, s, { th: `มีผู้ซื้อกำลังหาธุรกิจที่ตรงกับประกาศของคุณ: ${r.title}`, en: `A buyer is looking for a business like yours: ${r.title}` }, `/requests/${id}`))
    })
    return id
  },
  close(id: string) {
    const u = me()
    commit((d) => {
      const r = d.buyerRequests.find((x) => x.id === id)
      if (!r || r.buyerId !== u.id) throw new AppError('forbidden')
      r.status = 'closed'
    })
  },
}

export const pitches = {
  send(requestId: string, listingId: string, message: string, offer?: { price?: number; terms?: string }) {
    const u = me()
    requireKyc(u)
    const r = db.buyerRequests.find((x) => x.id === requestId)
    const l = db.listings.find((x) => x.id === listingId)
    if (!r || !l) throw new AppError('not_found')
    if (r.status !== 'open') throw new AppError('request_closed')
    if (r.buyerId === u.id) throw new AppError('own_request')
    if (l.sellerId !== u.id || l.status !== 'published') throw new AppError('forbidden')
    if (db.pitches.some((p) => p.requestId === requestId && p.listingId === listingId)) throw new AppError('pitch_exists')
    commit((d) => {
      d.pitches.push({ id: uid('p-'), requestId, listingId, sellerId: u.id, buyerId: r.buyerId, message: message.trim(), offerPrice: offer?.price && offer.price > 0 ? offer.price : undefined, offerTerms: offer?.terms?.trim() || undefined, status: 'pending', createdAt: Date.now() })
      notify(d, r.buyerId, { th: `มีธุรกิจเสนอตัวเข้ามา: "${l.displayName}" สำหรับ "${r.title}"`, en: `New pitch: "${l.displayName}" for "${r.title}"` }, `/requests/${requestId}`)
    })
  },
  decide(pitchId: string, status: 'shortlisted' | 'declined') {
    const u = me()
    commit((d) => {
      const p = d.pitches.find((x) => x.id === pitchId)
      if (!p || p.buyerId !== u.id || p.status !== 'pending') throw new AppError('forbidden')
      p.status = status
      p.decidedAt = Date.now()
      const l = d.listings.find((x) => x.id === p.listingId)!
      if (status === 'shortlisted') {
        // shortlisting opens a chat so both sides can move on to NDA → LOI
        const t = ensureThread(d, p.listingId, p.buyerId)
        sysMsg(d, t.id, 'pitch_shortlisted', `/requests/${p.requestId}`)
      }
      notify(d, p.sellerId, status === 'shortlisted'
        ? { th: `ผู้ซื้อสนใจ "${l.displayName}" ที่คุณเสนอ — เริ่มแชทได้แล้ว`, en: `The buyer shortlisted "${l.displayName}" — chat is open` }
        : { th: `ผู้ซื้อไม่เลือก "${l.displayName}" ในครั้งนี้`, en: `The buyer passed on "${l.displayName}"` }, '/dashboard?tab=pitches')
    })
  },
}

// ---------- admin ----------
const adminOnly = () => {
  const u = me()
  if (!u.isAdmin) throw new AppError('forbidden')
  return u
}

function setFxRate(rate: number) {
  commit((d) => {
    d.fx = { usdThb: rate, updatedAt: Date.now() }
  })
}

export const admin = {
  review(listingId: string, approve: boolean, reason?: string) {
    adminOnly()
    commit((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (!l) throw new AppError('not_found')
      if (approve) {
        l.status = 'published'
        l.publishedAt = Date.now()
        l.rejectReason = undefined
        notify(d, l.sellerId, { th: `ประกาศ "${l.displayName}" เผยแพร่แล้ว`, en: `Listing "${l.displayName}" is now live` }, `/listing/${l.id}`)
        onPublished(d, l)
      } else {
        l.status = 'rejected'
        l.rejectReason = reason
        notify(d, l.sellerId, { th: `ประกาศ "${l.displayName}" ถูกตีกลับ: ${reason}`, en: `Listing "${l.displayName}" was rejected: ${reason}` }, `/listing/${l.id}/edit`)
      }
    })
  },
  takeDown(listingId: string) {
    adminOnly()
    commit((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (l) {
        l.status = 'rejected'
        l.rejectReason = 'Removed by admin'
      }
    })
  },
  reviewKyc(userId: string, approve: boolean, note?: string) {
    adminOnly()
    commit((d) => {
      const u = d.users.find((x) => x.id === userId)
      if (!u?.kyc) throw new AppError('not_found')
      u.kyc.status = approve ? 'verified' : 'rejected'
      u.kyc.reviewedAt = Date.now()
      u.kyc.note = note
      if (approve) u.sellerVerified = true
      notify(d, u.id, approve
        ? { th: 'ยืนยันตัวตนสำเร็จ — เริ่มเจรจาซื้อขายได้แล้ว', en: 'Identity verified — you can now start deals' }
        : { th: `การยืนยันตัวตนไม่ผ่าน: ${note ?? ''}`, en: `Identity verification rejected: ${note ?? ''}` }, '/verify')
    })
  },
  setDocsVerified(listingId: string, v: boolean) {
    adminOnly()
    commit((d) => {
      const l = d.listings.find((x) => x.id === listingId)
      if (!l) throw new AppError('not_found')
      l.docsVerified = v
      if (v) notify(d, l.sellerId, { th: `เอกสารของ "${l.displayName}" ผ่านการตรวจสอบแล้ว`, en: `Documents for "${l.displayName}" were verified` }, `/listing/${l.id}`)
    })
  },
  resolveDispute(id: string, resolution: string) {
    adminOnly()
    commit((d) => {
      const x = d.disputes.find((y) => y.id === id)
      if (!x || x.status !== 'open') throw new AppError('forbidden')
      x.status = 'resolved'
      x.resolution = resolution.trim()
      x.resolvedAt = Date.now()
      const deal = d.deals.find((y) => y.id === x.dealId)!
      const l = d.listings.find((y) => y.id === deal.listingId)!
      for (const party of [deal.buyerId, deal.sellerId]) {
        notify(d, party, { th: `ทีมงานปิดข้อพิพาท "${l.displayName}": ${x.resolution}`, en: `Dispute on "${l.displayName}" resolved: ${x.resolution}` }, '/dashboard?tab=deals')
      }
    })
  },
  updateSettings(s: DB['settings']) {
    adminOnly()
    commit((d) => {
      d.settings = s
    })
  },
  setVerified(userId: string, v: boolean) {
    adminOnly()
    commit((d) => {
      d.users.find((x) => x.id === userId)!.sellerVerified = v
    })
  },
  setSuspended(userId: string, v: boolean) {
    const a = adminOnly()
    if (a.id === userId) throw new AppError('forbidden')
    commit((d) => {
      d.users.find((x) => x.id === userId)!.suspended = v
      if (v) d.listings.forEach((l) => {
        if (l.sellerId === userId && ['published', 'pending'].includes(l.status)) l.status = 'hidden'
      })
    })
  },
  updatePlan(plan: Plan) {
    adminOnly()
    commit((d) => {
      const i = d.plans.findIndex((p) => p.id === plan.id)
      d.plans[i] = plan
    })
  },
  resolveReport(id: string) {
    adminOnly()
    commit((d) => {
      d.reports.find((r) => r.id === id)!.status = 'resolved'
    })
  },
  closeDeal(dealId: string, price: number) {
    adminOnly()
    commit((d) => {
      const deal = d.deals.find((x) => x.id === dealId)
      if (!deal || deal.status !== 'in_progress') throw new AppError('forbidden')
      closeDeal(d, deal, price, 'admin')
    })
  },
  setFx(rate: number) {
    adminOnly()
    setFxRate(rate)
  },
  resetDemo() {
    localStorage.removeItem(KEY)
    db = load()
    setSession(null)
  },
}

/** Refresh USD→THB once a day from a free public API; keeps the old rate on failure. */
export async function refreshFx() {
  if (Date.now() - db.fx.updatedAt < DAY) return
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD')
    const j = await r.json()
    const rate = Number(j?.rates?.THB)
    if (rate > 0) setFxRate(Math.round(rate * 100) / 100)
  } catch {
    /* offline: keep fallback rate */
  }
}
