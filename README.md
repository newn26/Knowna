# RUB Job — Business-for-Sale Marketplace (Prototype)

**Live demo:** https://newn26.github.io/biz-marketplace/

A clickable, fully client-side prototype for a marketplace where people buy and sell **whole businesses**. Buyers and sellers use one switchable account; an admin moderates the platform.

> ⚠️ Prototype only. There is **no backend or database**. Data lives in your browser's `localStorage`, payments are simulated, and the NDA/LOI documents are samples, not legal advice.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Buyer | `buyer@demo.com` | `demo1234` |
| Seller | `seller@demo.com` | `demo1234` |
| Admin | `admin@demo.com` | `admin1234` |

The login page has one-click buttons for each account. **To demo realtime chat**, open two tabs and log in as the buyer in one and the seller in the other. The session is stored per tab.

## Features

- **Reverse marketplace (buyer requests):** a buyer posts what they want (purpose: buy, invest or partner; category; location; budget; minimum profit). Owners of matching businesses **Pitch** a listing and **Make Offer** with their own price and terms. The buyer compares offers, shortlists one, and a chat opens.
- **Matching:** rule-based matching on category, location, budget and profit. Sellers are notified when a new request fits one of their live listings.
- **Deal Room:** one page per listing and buyer that tracks Match → NDA → Deal Room → Negotiation → Transaction, with every shared document and contract in one place.
- **Trust and safety:**
  - **Identity verification (KYC, simulated):** buyers and sellers upload an ID photo, and an admin approves it. KYC is required before pitching, signing an NDA or making an offer.
  - Admins can mark a listing's documents and financials as **checked**.
  - Either party can **open a dispute** on a deal. Admins mediate and record a resolution.
- **Accounts:** sign up with a simulated email verification step, or use a simulated "Continue with Google". One account can switch between the **Buyer** and **Seller** roles.
- **Search:** filter by business name or keyword, category, location, price, revenue and profit, then sort. A **valuation tool** estimates a value range from profit.
- **Listings and confidentiality:**
  - The public *teaser* shows the display name (it can be anonymous), category, location, price and summary financials.
  - *Full details* (legal name, address, extra photos, documents) unlock only after the buyer signs the in-app NDA **and** the seller approves it.
  - Listing statuses: draft → pending review → live → under offer → sold. Sellers can hide or archive a listing.
- **Chat:** one thread per listing and buyer, with file and image attachments, unread badges, quick NDA/LOI actions, and a report button. Admins can read only chats that were reported.
- **Contracts:**
  - A standard platform NDA, in Thai and English.
  - An LOI (Letter of Intent) with offer price, deposit, due-diligence period, expiry and conditions. The other party can accept, reject or counter, over multiple rounds.
  - Typed-name e-signatures with timestamps. Print or save any contract as a PDF.
- **Deals and transaction:**
  - When an LOI is accepted, a deal is created.
  - The transaction is **simulated as status only**: the buyer reports payment, then the seller confirms receipt. No money moves.
  - Both parties confirm the final price. The deal then closes and the seller is invoiced the **3% success fee**. A seller with an unpaid fee cannot submit new listings.
- **Revenue (as in the business plan):**
  - Free membership.
  - **Premium at 999 THB/month** for buyers who want deeper data.
  - **3% transaction fee** charged to the seller.
  - **Advertising:** sellers pay to show a listing as *Sponsored* on the home page and at the top of search. The default is 499 THB for 7 days, and admins can change it.
- **Demo payments:** checkout supports a card or a PromptPay QR, and can simulate a failed payment. Payments go through a `PaymentProvider` interface (`src/lib/payment.ts`) so Stripe or Omise can be plugged in later.
- **Admin console:**
  - **Key metrics** from the Lean Canvas: users, buyer requests, pitches, closed deals and revenue.
  - Queues for listing review, KYC, disputes and reports.
  - Document checks, takedowns, user suspension and deal close-out.
  - Editing of plans and the ad price.
- **Language and currency:** the UI is in Thai and English. Prices show in THB or USD, converted with a daily USD→THB rate from a free API, with a built-in fallback rate.

## Tech

Vite, React 18, TypeScript, Tailwind CSS, React Router (HashRouter) and lucide-react. It deploys to GitHub Pages through GitHub Actions.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Project structure

```
src/lib/store.ts      client-side "database" + all business rules (auth, listings, NDA, LOI, deals, billing, admin)
src/lib/seed.ts       demo data (plans, users, 20+ listings)
src/lib/i18n.ts       TH/EN dictionary
src/lib/payment.ts    PaymentProvider interface + demo provider
src/pages/*           screens
```

Use **Admin → Plans → Reset all demo data** to restore the seed data.
