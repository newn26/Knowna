# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Thai parents buying school shoes for their sons, from Prathom 1 (ป.1) to Mathayom 6 (ม.6). They buy again every time the child's feet grow, often several times a year. They care about price, durability, and whether the shoe meets the school's uniform rules. Most shop on a phone.

The student may have a say in the choice, but the parent decides and pays. Write for the parent.

## Product Purpose

KNOWNA is a single-model boys' school shoe brand with a built-in trade-in loop. Parents buy a new pair. When the child outgrows it, they trade the old pair in and get a discount on the next new pair in the same bill. The old pair is then cleaned, inspected and resold as pre-owned at a lower price.

This site is a course project and demo for an instructor, not a live business. Success means the demo clearly shows three flows working end to end:

- buying a new pair
- trading in an old pair for a discount
- buying a pre-owned pair

The demo must also show these flows as credible and easy for a parent.

## Positioning

One model, three colours, all sizes from ป.1 to ม.6. Every pair the brand sells comes back, with a fixed trade-in rule:

- condition 90–100% gives 15% off a new pair
- condition 75–89% gives 10% off
- the discount applies in the same transaction
- no cash, no coupon, no wallet, no expiry

The pre-owned store is supplied only by the brand's own trade-ins, each graded A or B with a condition percentage.

## Operating Context

- **Colours:** Black for normal school days; White for PE and schools that require white shoes; Brown for scout and girl-guide uniform days.
- **Sizes:** EU 30–45, sold New or Pre-owned.
- **Verifying a trade-in:** the brand checks it was bought from KNOWNA using Order History, a Product ID, or the QR code under the tongue.
- **Condition check:** a 5-point inspection (upper, sole, insole, stitching and shape, laces and eyelets) plus 3 required photos.
- **Pre-owned process:** Inspection, then Cleaning & Sanitizing, then Quality Check, then listing in the Pre-owned Store.

## Capabilities and Constraints

- **Stack:** React 18, Vite, TypeScript, Tailwind and react-router (HashRouter). It deploys to GitHub Pages at https://newn26.github.io/rub-job/ on every push to main.
- **Data:** all data is mock data kept in localStorage, behind an async API layer (`src/lib/api.ts`) so a real backend can replace it later. No real payments are taken.
- **Pages:** Home, Shop, Product, Size Finder, Pre-owned list and detail, Trade-in, Cart, Checkout, Order detail, Track, and Account/order history.
- **Language:** the UI is Thai. Buttons, navigation, steps and labels should be Thai. English stays only for brand-style display headlines (for example "STEP UP. PASS IT ON.").
- **Undecided:** real product photography does not exist yet.

## Brand Commitments

- **Name:** KNOWNA.
- **Tagline:** "STEP UP. PASS IT ON."
- **Product name:** KNOWNA Classic.
- **Fixed rules:** the trade-in discount rules above are fixed product rules and must not be changed in copy.

## Evidence on Hand

- **Product images:** AI-generated, created in Canva, in `src/assets/photos/` (black.webp, brown.webp, white.webp). They must be labelled as AI samples, never as real photos.
- **Drawings:** SVG illustrations in `src/components/Shoe.tsx`.
- **Missing, and must not be invented:** real product photos, real photos of pre-owned pairs, customer reviews or testimonials, sales numbers, press coverage, and certifications.

## Product Principles

1. **Parent first.** Every screen answers a parent's question: price, size, condition, rules.
2. **The trade-in rule is the product.** Show the exact discount maths up front, never hide it behind a coupon or points.
3. **Honest about the demo.** Label mock data, AI images and simulated payments as what they are.
4. **Pre-owned earns trust with specifics.** Show condition percentage, grade, inspection steps and photos, not vague assurances.
5. **Thai, plainly.** Use Thai words a parent already uses before any English term.

## Accessibility & Inclusion

Mobile-first: most parents shop on phones. Readable Thai type sizes, tap targets of at least 44px, and reduced-motion support (already implemented).
