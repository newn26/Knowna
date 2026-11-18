# BizMarket — Business-for-Sale Marketplace (Prototype)

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

- **Accounts:** sign up with a simulated email verification step, or use a simulated "Continue with Google". One account can switch between the **Buyer** and **Seller** roles.
- **Search:** filter by business name or keyword, category, location, price range and revenue range, then sort by newest, price or revenue.
- **Listings and confidentiality:**
  - The public *teaser* shows the display name (it can be anonymous), category, location, price and summary financials.
  - *Full details* (legal name, address, extra photos, documents) unlock only after the buyer signs the in-app NDA **and** the seller approves it.
  - Listing statuses: draft → pending review → live → under offer → sold. Sellers can hide or archive a listing.
- **Chat:** one thread per listing and buyer, with file and image attachments, unread badges, quick NDA/LOI actions, and a report button. Admins can read only chats that were reported.
- **Contracts:**
  - A standard platform NDA, in Thai and English.
  - An LOI (Letter of Intent) with offer price, deposit, due-diligence period, expiry and conditions. The other party can accept, reject or counter, over multiple rounds.
  - Typed-name e-signatures with timestamps.
  - Print or save any contract as a PDF.
- **Deals and revenue:**
  - When an LOI is accepted, a deal is created.
  - Both parties confirm the final price. The deal then closes and the seller is invoiced a **1–3% success fee**, depending on their plan.
  - A seller with an unpaid fee cannot submit new listings.
- **Subscriptions:** Seller plans are Free, Pro and Business; buyer plans are Free and Pro. Plans set listing limits, fee %, featured placement, monthly NDA quota and saved-search alerts. **Admins can edit every plan.**
- **Demo payments:** checkout supports a card or a PromptPay QR, and can simulate a failed payment. Payments go through a `PaymentProvider` interface (`src/lib/payment.ts`) so Stripe or Omise can be plugged in later.
- **Admin console:** listing review queue (approve, or reject with a reason), takedowns, seller verification badges, user suspension, contract list, deal close-out, reports, invoices and plan editing.
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
