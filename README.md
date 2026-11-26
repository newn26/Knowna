# KNOWNA — Boys' School Shoes (Prototype)

A clickable e-commerce prototype for **KNOWNA Classic**, a canvas school shoe for boys from ป.1 to ม.6
(course project ITDS294). One model in three colours (black, white, brown), sizes EU 28–45,
**฿259 per pair with shipping included**.

The selling point: parents cannot try shoes on when they buy online, so KNOWNA helps pick the size
before buying, and **if the size is wrong, exchanges it free once per order** (the brand pays shipping for the new pair).

Live demo: https://newn26.github.io/Knowna/

> Prototype only. There is **no backend**. Data lives in your browser's `localStorage`, payments are simulated,
> no SMS is sent, and product images are AI-generated.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pricing, sizes, size chat, reminders, order flow, size exchange
npm run build    # type-check and build to dist/
```

## Demo walkthrough

1. **Home** → price, the free size exchange, and the grade-to-size teaser.
2. **หาไซส์** (`/size`) → three ways to pick a size: by grade, by measuring the foot, or by the brand the child wears now.
3. **ถามไซส์** (button on every page) → a mock chat that answers with a size from foot length, brand + size, or grade.
4. **Product** → choose colour and size, buy (stock-checked).
5. **Checkout** → home delivery (included in the price), PromptPay → order page; demo orders advance every ~30 s.
6. **Account** (one-click demo login) → every pair bought, the free size exchange on a delivered order,
   each child's saved foot size and the pre-term reminder.

Order lookup sample: `KN-250502-0107` + `0812345678`. The footer has a *reset demo data* link.

## Code structure

```
src/
  lib/
    types.ts     data shapes shared by UI and API
    catalog.ts   product, colours, sizes, grade→size table, brand comparison, reminder dates
    pricing.ts   totals (shipping is included in the price)
    status.ts    order and exchange progress steps
    api.ts       async mock API — the only module the UI calls for data
    db.ts        localStorage "database" and seed data (only api.ts imports it)
    store.ts     client state: cart, session, children's foot sizes
  components/    Layout, SizeChat, MeasureStory, Shoe (SVG), shared UI
  pages/         one file per page
```

### Connecting a real backend

Every function in `src/lib/api.ts` is `async`, returns plain data and has its intended REST route in a comment
(`GET /api/stock`, `POST /api/orders`, ...). Replace each body with a `fetch` call, delete `db.ts`, and the pages
stay the same. The server must re-check stock and re-compute totals rather than trust the client's numbers.
