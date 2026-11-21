export type Lang = 'th' | 'en'
export type Currency = 'THB' | 'USD'
export type Role = 'buyer' | 'seller'
export type Bi = { th: string; en: string }

export interface Kyc {
  status: 'pending' | 'verified' | 'rejected'
  fullName: string
  idNumber: string // stored masked, e.g. 1-xxxx-xxxxx-12-3
  idImage: string // data URL (demo only)
  submittedAt: number
  reviewedAt?: number
  note?: string
}

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  phone?: string
  primaryRole: Role
  isAdmin: boolean
  emailVerified: boolean
  sellerVerified: boolean // admin-granted badge
  suspended: boolean
  sellerPlanId: string
  sellerPlanUntil?: number
  buyerPlanId: string
  buyerPlanUntil?: number
  provider: 'password' | 'google'
  createdAt: number
  /** Identity verification (KYC) — required before pitching, NDA or offers. */
  kyc?: Kyc
}

export interface Plan {
  id: string
  audience: Role
  name: Bi
  priceTHB: number
  priceUSD: number
  listingLimit: number | null // seller: null = unlimited
  feePercent: number // seller success fee
  ndaLimitPerMonth: number | null // buyer: null = unlimited
  featured: boolean // seller listings highlighted
  alerts: boolean // buyer saved-search alerts
  active: boolean
}

export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'published'
  | 'rejected'
  | 'under_offer'
  | 'sold'
  | 'hidden'
  | 'archived'

export interface FileAsset {
  name: string
  type: string
  size: number
  dataUrl: string
}

export interface Listing {
  id: string
  sellerId: string
  status: ListingStatus
  rejectReason?: string
  displayName: string
  category: string
  province: string
  currency: Currency
  askingPrice: number
  annualRevenue: number
  netProfit: number
  yearEstablished: number
  employees: number
  reasonForSale: string
  description: string
  coverImages: string[]
  confidential: {
    legalName: string
    address: string
    images: string[]
    documents: FileAsset[]
  }
  views: number
  /** Admin checked the business documents / financials. */
  docsVerified?: boolean
  /** Paid promotion (advertising revenue) — shown as Sponsored until this time. */
  sponsoredUntil?: number
  createdAt: number
  updatedAt: number
  publishedAt?: number
}

export interface Signature {
  name: string
  at: number
}

export interface Nda {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  status: 'pending' | 'approved' | 'rejected'
  buyerSignature: Signature
  sellerSignature?: Signature
  createdAt: number
  decidedAt?: number
}

export interface LoiRound {
  by: Role
  price: number
  currency: Currency
  deposit: number
  conditions: string
  ddDays: number
  expiresAt: number
  signature: Signature
}

export interface Loi {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  rounds: LoiRound[]
  status: 'open' | 'accepted' | 'rejected' | 'withdrawn'
  acceptedSignature?: Signature
  createdAt: number
  updatedAt: number
}

export interface Deal {
  id: string
  listingId: string
  loiId: string
  buyerId: string
  sellerId: string
  agreedPrice: number
  currency: Currency
  buyerConfirm?: { price: number; at: number }
  sellerConfirm?: { price: number; at: number }
  status: 'in_progress' | 'closed' | 'cancelled'
  closedBy?: 'parties' | 'admin'
  closedAt?: number
  invoiceId?: string
  /** Simulated transaction status (no real money moves through the prototype). */
  transaction?: { buyerPaidAt?: number; sellerReceivedAt?: number }
  /** Due diligence completed by the buyer (stage 5). */
  dd?: { by: string; at: number; note: string }
  /** Sale contract signed by each party (stage 6) — name + time are the evidence. */
  contract?: { buyer?: Signature; seller?: Signature }
  /** Buyer confirms the business was handed over (end of stage 7). */
  handoverAt?: number
  createdAt: number
}

/** A file shared inside a Deal Room. `access` decides who may open it, checked in store.roomDocsFor. */
export interface DealDoc {
  id: string
  threadId: string
  file: FileAsset
  by: string
  /** nda = visible once the buyer's NDA is approved; deal = only after an LOI is accepted. */
  access: 'nda' | 'deal'
  at: number
}

export interface Invoice {
  id: string
  userId: string
  kind: 'subscription' | 'fee' | 'ad'
  description: Bi
  amount: number
  currency: Currency
  status: 'unpaid' | 'paid'
  refId: string // planId, dealId or listingId (ad)
  createdAt: number
  paidAt?: number
  paymentId?: string
}

export interface Payment {
  id: string
  invoiceId: string
  method: 'card' | 'promptpay'
  status: 'succeeded' | 'failed'
  detail: string
  /** Which payment provider reported this charge ('demo' = simulated, no real money). */
  provider?: string
  createdAt: number
}

export interface Thread {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  createdAt: number
  lastMessageAt: number
  lastRead: Record<string, number>
}

export interface Message {
  id: string
  threadId: string
  senderId: string | null // null = system
  text: string
  file?: FileAsset
  link?: string
  createdAt: number
}

export interface Report {
  id: string
  kind: 'listing' | 'thread'
  targetId: string
  reporterId: string
  reason: string
  status: 'open' | 'resolved'
  createdAt: number
}

export interface Notification {
  id: string
  userId: string
  text: Bi
  link: string
  read: boolean
  createdAt: number
}

export interface SearchParams {
  q?: string
  category?: string
  province?: string
  minPrice?: number
  maxPrice?: number
  minRevenue?: number
  maxRevenue?: number
  minProfit?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'revenue_desc' | 'profit_desc'
}

/** Reverse marketplace: a buyer posts what they want, sellers pitch matching listings. */
export interface BuyerRequest {
  id: string
  buyerId: string
  title: string
  category: string // '' = any
  province: string // '' = any
  maxBudget: number // THB
  minProfit: number // THB per year, 0 = no minimum
  description: string
  /** What the buyer wants to do with the business (SCAMPER: put to another use). */
  purpose?: 'buy' | 'invest' | 'partner'
  status: 'open' | 'closed'
  createdAt: number
}

export interface Pitch {
  id: string
  requestId: string
  listingId: string
  sellerId: string
  buyerId: string
  message: string
  /** Make Offer: the seller's price for this buyer (listing currency). */
  offerPrice?: number
  offerTerms?: string
  status: 'pending' | 'shortlisted' | 'declined'
  createdAt: number
  decidedAt?: number
}

export interface SavedSearch {
  id: string
  userId: string
  params: SearchParams
  createdAt: number
}

export interface DB {
  version: number
  users: User[]
  plans: Plan[]
  listings: Listing[]
  ndas: Nda[]
  lois: Loi[]
  deals: Deal[]
  roomDocs: DealDoc[]
  invoices: Invoice[]
  payments: Payment[]
  threads: Thread[]
  messages: Message[]
  reports: Report[]
  notifications: Notification[]
  savedSearches: SavedSearch[]
  buyerRequests: BuyerRequest[]
  pitches: Pitch[]
  disputes: Dispute[]
  settings: { adPriceTHB: number; adPriceUSD: number; adDays: number }
  favorites: { userId: string; listingId: string }[]
  fx: { usdThb: number; updatedAt: number }
}

export interface Dispute {
  id: string
  dealId: string
  openedBy: string
  reason: string
  status: 'open' | 'resolved'
  resolution?: string
  createdAt: number
  resolvedAt?: number
}
