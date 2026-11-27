# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KNOWNA: a clickable e-commerce prototype (course project ITDS294, shown to and graded by an instructor) for a boys' canvas school shoe, ป.1–ม.6. There is no backend. Data lives in `localStorage`, payments and SMS are simulated, and product images are AI-generated (the foot photo is public domain, see `src/lib/photos.ts`).

**Source of truth for content is the group report, `Ecommerce_Report.pdf`** (draft-final), outside the repo in `C:\Users\PC\Downloads\EcomGroupProject\`. Every business fact on the site must come from it or from the owner: ฿259 per pair with shipping included, website only (no stores), PromptPay via Omise only, EU 28–45, free size exchange once per order within 3 days of delivery. Do not add or embellish facts (prices, policies, statistics, reviews, delivery times). Where the report is still blank, render `<Pending label="…"/>` from `src/components/ui.tsx` and mark the source with a `PENDING-PDF` comment (today: who pays to return the old pair, whether it must come back first). Business numbers such as break-even belong in the report, not on the site. `PRODUCT.md` records which facts match the report and which are demo estimates (M.1–M.6 size ranges, brand-comparison offsets).

## Commands

```bash
npm run dev      # Vite dev server (default port 5173)
npm test         # esbuild-bundles scripts/order.test.ts and runs it under node (single file, no test runner)
npm run build    # tsc --noEmit + vite build to dist/
npx tsc --noEmit -p .   # type-check only
```

There is no lint script. `npm test` (11 tests) covers `src/lib/*` plus the pure `replyTo` from `SizeChat.tsx`: pricing, sizes, chat replies, reminder dates, address formatting, the order flow and the exchange rules. `scripts/shim.js` is injected by esbuild to provide `localStorage`/`window` under node. There is no filter flag; comment tests out in `order.test.ts` to run a subset. Tests that need a delivered order use the seed's recent order (id ends in `-0218`), because orders placed in a test are `timeScale: 'demo'` and only arrive after ~2 minutes.

Pushing to `main` deploys to GitHub Pages (https://newn26.github.io/Knowna/) through `.github/workflows/deploy.yml`; watch it with `gh run watch -R newn26/Knowna`. `vite.config.ts` uses `base: './'` plus `HashRouter`, so routes are `#/size`, `#/order/:id`, `#/help` and so on. In-page anchors such as `/#exchange` are scrolled by `ScrollManager` in `App.tsx`.

### Browser checks (untracked helpers)

Helpers in the repo root are listed in `.git/info/exclude` and drive headless **Brave** over CDP; each writes PNGs to the folder in env `S`.

- `e2e-full.mjs` is the current full click-through (57 checks: every page, cart, checkout + PromptPay QR, track, account, kids/reminder, exchange inside and outside the 3-day window, size tools, chat, FAQ, footer links, reset). It targets the live site by default; `BASE=http://localhost:5179/` targets a dev server, `W=1440` changes the width. Run: `S=<dir> node e2e-full.mjs`.
- `e2e.mjs`, `personas.mjs`, `story-shot.mjs`, `tab-shot.mjs`, `shot.sh`, `_m.html` are older and still script the removed trade-in/sole flows. They expect `npx vite --port 5179`.

## Architecture

React 18 + TypeScript + Tailwind + react-router v6. UI text is Thai; size is spelled **ไซส์**, never ไซซ์. Desktop is the target (owner's choice); keep the existing responsive classes but don't spend work on phone layouts.

Data layering is strict:

- `src/lib/api.ts` is the only module pages call for data. Every function is `async` and has its future REST route in a comment. Business rules are enforced here, not in the UI (stock re-check in `placeOrder`, all exchange rules in `requestExchange`).
- `src/lib/db.ts` is the `localStorage` "database" with a seed: the demo user (คุณนภา, phone `0812345678`), one **recent** order created 5 days before seeding (still inside the exchange window, id `KN-<yymmdd>-0218`), two old delivered orders, a guest order, and per-colour/size stock. Only `api.ts` imports it. **Bump `KEY` (`kw.db.vN`) whenever the stored shape or seed changes**, otherwise old browsers keep stale data. The footer's "รีเซ็ตข้อมูลเดโม" reseeds.
- `src/lib/store.ts` holds client-only state through `useStore` / `actions`: cart, session, toast, cart-drawer flag, and the children's saved foot lengths + reminder toggle (`kids`, `remind`).
- `src/lib/catalog.ts` holds product facts and pure rules: `PRODUCT`, colours, `SIZES` (EU 28–45), `GRADES`, `BRANDS` + `sizeFromBrand`, `sizeForFoot`, `EXCHANGE` (rule text, `days: 3`, return steps) + `exchangeDeadline`, `nextReminder`, `needsRemeasure`. `pricing.ts` has no shipping line (price includes it).
- `src/lib/status.ts` derives tracking steps from timestamps rather than stored state. `'demo'` orders advance in seconds, seed orders (`'real'`) are spread over days. The exchange deadline is the last step's time + 3 days.

Feature map: the size exchange UI is `ExchangePanel` in `pages/Orders.tsx` (also `Track`, `Account` with `KidsPanel`). Checkout (`pages/Checkout.tsx`) validates, then opens `PromptPayDialog` (fake QR); the order is created only on "ชำระเงินแล้ว". It also has a one-click demo autofill. `components/SizeChat.tsx` is the floating auto-reply chat; `replyTo(text)` is pure and matches the menu chip labels (`T`) exactly, so tapping and typing share one path. `pages/Help.tsx` is the FAQ, built on the shared `Accordion` in `ui.tsx`.

Gotchas that already caused bugs:

- **Never return a value from a `useEffect` arrow.** `useEffect(() => el.scrollIntoView())` crashed the whole app in current Chrome/Brave because `scrollIntoView` returns a promise and React calls it as the cleanup. Use a block body.
- **Overlays rendered inside a page must use `createPortal(…, document.body)`.** `PageFade` in `App.tsx` gives `<main>` a transform, which traps `position: fixed` and `z-index` (see `SizeGuideDialog`, `PromptPayDialog`). Layers: header `z-40`, dialogs/drawer `z-50`, toast `z-60`, size chat `z-30` so overlays cover it. The footer has extra bottom padding so its last row clears the chat button.

Scroll-driven section: `components/MeasureStory.tsx` on the size page is a tall `<section>` with a `sticky` viewport; progress is `-rect.top / (height - innerHeight)` split into chapters. Its `TOE`/`HEEL` constants are the foot's position inside `foot-side.webp` (toes left), and the ruler is scaled to `EXAMPLE_CM`. Shoe `*-side.webp` cut-outs also face toe-left. There are no drawn (SVG) shoes; use photos from `src/lib/photos.ts`.

`.impeccable/` and `PRODUCT.md` follow the impeccable design-skill schema. User-facing docs: `README.md` (Thai) and `docs/FLOW.md` (page map, flows, demo script, limits); keep them in step with feature changes.

## Repo conventions

- The owner wants every finished change committed **and pushed to `main`** without asking. Use small commits, one per piece of work, and **no `Co-Authored-By: Claude` trailer**.
- After a push, confirm the deploy finished before saying it is live.
- Design specs go in `docs/superpowers/specs/`.
