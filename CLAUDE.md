# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KNOWNA: a clickable e-commerce prototype (course project ITDS294, graded by an instructor) for a boys' canvas school shoe. There is no backend. Data lives in `localStorage`, payments are simulated, and product images are AI-generated.

**Source of truth for content is the group report, `Ecommerce Report.pdf`**, which lives outside the repo in `C:\Users\PC\Downloads\EcomGroupProject\`. Every business fact on the site must come from it. Do not add or embellish facts such as prices, policies, statistics, reviews or sizes. Where the report is still blank, render `<Pending label="…"/>` from `src/components/ui.tsx` ("รอข้อมูลจากรายงาน"), and mark the source with a `PENDING-PDF` comment. The report is still being written. `PRODUCT.md` records which facts already match it and which are still the older values (price ฿390, EU 28–40, free shipping from ฿700, store pickup).

`README.md` is outdated: it still describes the removed swappable-sole feature. Trust `PRODUCT.md` and `docs/superpowers/specs/` instead.

## Commands

```bash
npm run dev      # Vite dev server (default port 5173)
npm test         # esbuild-bundles scripts/order.test.ts and runs it under node (single file, no test runner)
npm run build    # tsc --noEmit + vite build to dist/
```

There is no lint script. `npm test` is the only automated test, and it covers `src/lib/*` (pricing, addresses, order flow, size exchange). `scripts/shim.js` provides the `localStorage` shim that `db.ts` needs under node. To run a subset of tests, comment tests out in `order.test.ts`, because there is no filter flag.

Pushing to `main` deploys to GitHub Pages (https://newn26.github.io/rub-job/) through `.github/workflows/deploy.yml`. `vite.config.ts` uses `base: './'` plus `HashRouter`, so routes are `#/size`, `#/order/:id` and so on. In-page anchors such as `/#exchange` are scrolled by `ScrollManager` in `App.tsx`.

### Visual checks (untracked helpers)

`e2e.mjs`, `personas.mjs`, `story-shot.mjs`, `tab-shot.mjs`, `shot.sh` and `_m.html` are listed in `.git/info/exclude`. They drive headless **Brave** over CDP (port 9333) against a dev server on **port 5179**, so start it with `npx vite --port 5179` first. Each script writes PNGs to the folder in env `S`. `e2e.mjs` contains the reusable harness: the `go`, `click`, `text` and `shot` helpers.

## Architecture

React 18 + TypeScript + Tailwind + react-router v6. UI text is Thai. The project spells size as **ไซส์**, never ไซซ์.

Data layering is strict:

- `src/lib/api.ts` is the only module pages call for data. Every function is `async` and has its future REST route in a comment, so a real backend replaces the bodies with `fetch`.
- `src/lib/db.ts` is the `localStorage` "database" with a deterministic seed: a demo user, three past orders and per-colour/size stock. Only `api.ts` imports it. **Bump `KEY` (`kw.db.vN`) whenever the stored shape changes**, otherwise old browsers load stale data.
- `src/lib/store.ts` holds client-only state (cart, session, toast) through `useStore` / `actions`.
- `src/lib/catalog.ts` holds product facts: `PRODUCT`, colours, `SIZES`, `GRADES`, shipping constants and `EXCHANGE`, which carries the exchange rule text plus its pending items.
- `src/lib/status.ts` derives tracking steps from timestamps rather than stored state. Orders with `timeScale: 'demo'` advance with the clock (seconds), and seed orders (`'real'`) are already delivered. `exchangeSteps` works the same way for an order's size exchange.

Free size exchange (the main feature from the report): `Order.exchange` is optional, and **one exchange is allowed per order, not per pair**. `requestExchange` in `api.ts` enforces the rules: the order must be delivered, there must be no prior exchange, the new size must differ from the old one and be in stock. The UI is `ExchangePanel` in `pages/Orders.tsx` (order detail page). To demo it, log in with the demo account and open seed order `KN-250502-0107` (tracking lookup uses phone `0812345678`).

Scroll-driven sections use the same pattern: a tall `<section>` with a `sticky` inner viewport, where progress is `-rect.top / (height - innerHeight)` and is split into chapters. Examples are `components/MeasureStory.tsx` on the size page and `ExchangeHow` on Home. Photos come from `src/lib/photos.ts`. The `*-side.webp` cut-outs have transparent padding, and the shoe's toe faces left.

`.impeccable/` and `PRODUCT.md` follow the impeccable design-skill schema. `PRODUCT.md` also sets the design constraints: desktop-first demo, honest labels on AI images, mock data and pending facts.

## Repo conventions

- The owner wants every finished change committed **and pushed to `main`** without asking. Use small commits, one per piece of work, and **no `Co-Authored-By: Claude` trailer**.
- Design specs go in `docs/superpowers/specs/`.
