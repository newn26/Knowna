# KNOWNA — Boys' School Shoes (Prototype)

A clickable e-commerce prototype for a primary-school canvas shoe with a **swappable sole**.
One model in three colours (Black, White, Brown), sizes EU 28–40 (Thai grades ป.1–ป.6).
The sole slides into a dovetail rail under the shoe and is held by a latch at the heel, so a worn
sole is replaced on its own (฿199) instead of buying a whole new pair (฿390).

> Prototype only. There is **no backend**. Data lives in your browser's `localStorage`, payments are simulated,
> and product images are AI-generated stand-ins; the sole mechanism is shown as SVG diagrams.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pricing + mock order flow
npm run build    # type-check and build to dist/
```

## Demo walkthrough

1. **Home** → scroll the story: worn sole → press the heel latch → slide the old sole out → slide the new one in, click.
2. **พื้นรองเท้า** (`/soles`) → step through the animated rail diagram, then pick the shoe's colour and size and add a replacement sole.
3. **Product** → buy a new pair (stock-checked per colour and size).
4. **Checkout** (delivery or store pickup) → order page; demo orders advance every ~30 s.
5. **Account** (one-click demo login) lists every pair bought, each with *พื้นสึกแล้ว? สั่งพื้นใหม่*.

Order lookup sample: `KN-250502-0107` + `0812345678`. The footer has a *reset demo data* link.

## Sole rules

- ฿199 per set (left + right). Fits KNOWNA Classic of the same EU size only.
- Soles are not stock-limited in the demo; new pairs are.
- Free delivery from ฿700, otherwise ฿50; store pickup is free.

## Pages

Home · Shop · Product Detail · Soles (how it works + buy) · Size Guide / Size Finder · Cart · Checkout ·
Order Tracking · Account / Order History. Light and dark theme, mobile-first.

## Code structure

```
src/
  lib/
    types.ts     data shapes shared by UI and API
    catalog.ts   product, replacement sole, colours, sizes, grade→size table, stores
    pricing.ts   totals and shipping
    status.ts    order progress steps
    api.ts       async mock API — the only module the UI calls for data
    db.ts        localStorage "database" and seed data (only api.ts imports it)
    store.ts     client state: cart, session
  components/    Layout, Shoe (SVG), SoleRail (rail + latch diagrams), shared UI
  pages/         one file per page
```

### Connecting a real backend

Every function in `src/lib/api.ts` is `async`, returns plain data and has its intended REST route in a comment
(`GET /api/stock`, `POST /api/orders`, ...). Replace each body with a `fetch` call, delete `db.ts`, and the pages
stay the same. The server must re-check stock and re-compute totals rather than trust the client's numbers.
