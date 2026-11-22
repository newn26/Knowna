# KNOWNA — Boys' School Shoes (Prototype)

A clickable e-commerce prototype for a school shoe brand built around **Trade-in** and **Pre-owned**.
One model in three colours (Black, White, Brown), sizes EU 30–45 (Thai grades ป.1–ม.6), sold new or pre-owned.

> Prototype only. There is **no backend**. Data lives in your browser's `localStorage`, payments are simulated,
> and the shoe images are SVG illustrations standing in for product photography.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # trade-in rules + mock order flow
npm run build    # type-check and build to dist/
```

## Demo walkthrough

1. **Product** → pick a colour and size → tick **Trade-in Old Pair** → *ใส่ตะกร้า แล้วประเมินคู่เก่า*.
2. **Verify purchase** with one of:
   - *Order History* — log in with the demo account (one click).
   - *Product ID* — try `KN-BR40-240623` (valid), `KN-BK33-230512` (already traded in), `KN-BK38-999999` (not from this store).
   - *QR* — simulated scan, reads `KNOWNA:KN-BR40-240623`.
3. **Condition** — rate 5 parts (upper, sole, insole, stitching, laces), optionally attach photos.
4. **Inspection** → **discount**: 90–100% → 15%, 75–89% → 10%, below 75% → refused.
5. **Apply Discount** → **Checkout** (delivery or store pickup) → order page.
6. The order page advances every ~30 s in the demo. After delivery the old pair goes
   Inspection → Cleaning & Sanitizing → Quality Check → and then **appears in the Pre-owned store**.

Order lookup sample: `KN-250502-0107` + `0812345678`. The footer has a *reset demo data* link.

## Trade-in rules (enforced in `src/lib/tradein.ts` and `src/lib/api.ts`)

- Only pairs sold by the store (checked by Product ID / serial; QR encodes the same serial).
- Condition ≥ 75%; one old pair discounts one **new** pair in the same order, best rate on the priciest pair.
- No cash, coupon, wallet or expiry: unmatched trade-ins are dropped at checkout.
- A serial can be traded in once. Pre-owned pairs keep their serial, so they can be traded in again later.

## Pages

Home · Shop · Product Detail · Size Guide / Size Finder · Pre-owned Store (+ detail with QC report) ·
Trade-in · Cart · Checkout · Order Tracking · Account / Order History. Light and dark theme, mobile-first.

## Code structure

```
src/
  lib/
    types.ts     data shapes shared by UI and API
    catalog.ts   product, colours, sizes, grade→size table, stores
    tradein.ts   pure trade-in rules: scoring, grade, rate, allocation
    pricing.ts   totals, shipping, pre-owned pricing
    status.ts    order and trade-in pipeline steps
    api.ts       async mock API — the only module the UI calls for data
    db.ts        localStorage "database" and seed data (only api.ts imports it)
    store.ts     client state: cart, applied trade-ins, session
  components/    Layout, Shoe (SVG), shared UI
  pages/         one file per page
```

### Connecting a real backend

Every function in `src/lib/api.ts` is `async`, returns plain data and has its intended REST route in a comment
(`GET /api/preowned`, `POST /api/tradein/verify`, `POST /api/orders`, ...). Replace each body with a `fetch`
call, delete `db.ts`, and the pages stay the same. The server must re-run the rules in `tradein.ts`
(they are pure functions, easy to share) rather than trust the client's numbers. To show real photos,
fill `PreownedItem.photos` with image URLs; the `Shoe` component renders them instead of the illustration.
