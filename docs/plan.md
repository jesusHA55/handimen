# Handimen — Product & Technical Plan

> Reference doc. Locked decisions and roadmap as of Oct 2026.
> First market: **Poblenou, Barcelona**. Web first → Android → iOS.

---

## 1. What we're building

A **hyperlocal sharing network**: a hybrid of a social feed and a peer-to-peer
lending marketplace. Users post tools, equipment, and skills to their
community; others react/comment and request to borrow, rent, or book.

Positioning: between **Nextdoor** (neighborhood feed), **Buy Nothing** (free
sharing), and **Fat Llama / Peerby** (paid rental) — differentiated by
combining all three **plus skills/services**, not just physical goods.

### Locked decisions

| Area | Decision |
|---|---|
| Product | Hybrid social feed + P2P lending, free & paid listings |
| Communities | Public cities + private invite groups |
| First market | Poblenou (Barcelona) |
| Languages | **es + en now**, `ca` slot reserved. Default locale `es`, browser-detected |
| Payments | `PaymentsProvider` interface + **MockProvider** in MVP; Stripe Connect in Phase 3 |
| Auth | Email OTP + Google (Sign in with Apple before iOS) |
| Messaging | Async (not realtime-required) |
| Team | 4 people — workstreams: platform/backend+infra, web frontend, design/brand, community/growth |
| Budget | €10/month ceiling |
| Hosting | **Vercel Hobby for private testing → Cloudflare (OpenNext) before public launch** |
| Trust | Tiered verification pulled **into MVP** |

---

## 2. Architecture

```
        Web (Next.js 16)              Mobile (Expo SDK 57, Phase 4)
              │                               │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  packages/api  (typed client,  │
              │  Zod schemas, shared types)    │
              └───────────────┬───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Next.js server        Supabase                Supabase
   (Route Handlers /     Postgres (+PostGIS)      Realtime
   Server Actions)       Auth · Storage          (chat/notifs)
   = privileged logic    RLS policies
        │
   Stripe Connect (Phase 3)
```

**Key principle:** the backend contract lives in `packages/api`, consumed
identically by web and mobile. Simple CRUD + realtime go straight through the
Supabase client (protected by RLS). Anything with business rules (bookings,
reputation, moderation, payments) goes through the Next.js server layer so both
clients share identical logic.

**Deliberately NOT shared:** UI components. React DOM and React Native use
different primitives. We share *types, validation, business logic, design
tokens*, and Tailwind classes via NativeWind on mobile.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 16 (App Router, RSC) |
| UI | Tailwind + shadcn/ui |
| Mobile | Expo SDK 57 + expo-router (Phase 4) |
| DB | Supabase Postgres + PostGIS |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Search | Postgres full-text + PostGIS `ST_DWithin` |
| Maps | MapLibre + OSM (free tier) |
| Push | Expo Push (mobile), Web Push (web) |
| Email | Resend |
| i18n | next-intl (es, en) |
| Hosting | Vercel Hobby → Cloudflare Workers (OpenNext) |
| Monitoring | Sentry + PostHog |
| Payments | MockProvider → Stripe Connect (Phase 3) |

### €10/month budget

| Piece | Choice | Cost |
|---|---|---|
| DB / Auth / Storage | Supabase Free (500MB DB, 1GB storage, 50k MAU) | €0 |
| Web + API | Vercel Hobby (test) → Cloudflare free (commercial OK) | €0 |
| Email | Resend free (3k/mo) | €0 |
| Maps | MapLibre + OSM free tier | €0 |
| Push | Expo Push | €0 |
| Error/Analytics | Sentry + PostHog free | €0 |
| CI | GitHub Actions (2k min/mo) | €0 |
| Domain | ~€10/year amortized | ~€1 |
| Reserve | SMS, storage/bandwidth overflow, tiles | ~€9 |

**Free-tier traps:** Supabase free **pauses after 7 days inactivity** (mitigate
with a `pg_cron`/GitHub Action ping). Vercel Hobby is **non-commercial** by ToS —
fine for private testing, must migrate before public.

### Portability constraints (Vercel → Cloudflare)

Write for portability from day one; the migration should be config, not rewrite:

- No Vercel Blob / KV / Edge Config / Image Optimization → Supabase Storage +
  Cloudflare-compatible transforms.
- Route handlers on Web-standard `Request`/`Response`; minimal Node-only APIs.
- No reliance on Vercel Cron → **Supabase `pg_cron`** for scheduled jobs and the
  anti-pause ping.
- Realtime stays on Supabase, never on the host.

---

## 4. Data model

- **users** — profile, avatar, verified flags (email/phone/ID), reputation, home location
- **cities** (public) and **groups** (private, invite/link)
- **group_members** — user, group, role (owner/admin/member), join status
- **listings** — `type` (tool|equipment|skill|service), `terms` (free|rent), category, title, description, photos[], price/unit, condition, pickup location, radius, availability, status
- **posts** — feed content, optional listing link, visibility (public city / group / followers)
- **reactions**, **comments**, **follows**
- **requests** — lifecycle `pending → approved → active → returned/declined/cancelled`, dates, agreed terms
- **reviews** — two-way, post-completion, tied to a request
- **messages / threads** — requester ↔ owner
- **notifications**
- **reports / blocks** — moderation and safety
- **transactions** — payments (mock in MVP, `provider` column distinguishes)

**Seed categories:** Power tools · Garden & outdoors · Kitchen · Sports &
camping · Electronics · Home & cleaning · Automotive · Party & events ·
**Skills** (tutoring, trades advice, music) · **Help & time** (moving, assembling,
pet care).

---

## 5. Payments abstraction

`packages/core` exposes a `PaymentsProvider` interface
(`createIntent → authorize → capture → refund → payout → webhook`). MVP ships a
`MockProvider`; Phase 3 ships `StripeProvider`. Call sites never change.

**Honest caveat:** a mock payment validates the *flow* (pricing, deposits,
escrow-style `held → released → refunded` states); it creates **no real trust**
because no money moves. MVP trust comes from the trust stack below.

---

## 6. Trust stack

**Tier 0 — free, ships in MVP:**
- Verified email or Google sign-in
- **Completed-profile gate** — real name, photo, neighborhood required to list/request
- **Two-way reviews** after completed handoffs
- **Reporting + blocking** and a moderation queue (es + en)
- **Community vouching** — members vouch for newcomers; badge for vetted users
- **In-app handoff receipt** — both parties confirm pickup and return

**Tier 1 — costs money, capped in MVP:**
- **Phone verification** (Supabase Auth + Twilio, ~€0.05–0.10/SMS). Required for
  **paid listings with a deposit under €50**. Free lending never needs it, so the
  SMS budget is only spent where money is at risk.

**Tier 2 — identity, for high-value rentals:**
- **ID verification** for paid listings with a **deposit of €50 or more**
  (Stripe Identity in production; a mock toggle in the demo). Identity implies
  phone, so it satisfies Tier 1 as well.

Gate: `listingGate()` in `packages/core/src/trust/policy.ts`
(`HIGH_VALUE_DEPOSIT_CENTS = 5000`).

---

## 7. Roadmap (4 people)

- **Phase 0 — Foundations (~1–1.5 wks):** monorepo, Next.js + Supabase, schema/migrations, auth, i18n (es/en), design tokens, CI/CD, Vercel deploy, portability guardrails. ✅ *in build*
- **Phase 1 — Web MVP (~6 wks):** listings + photos, city feed, search/map/radius, follow/react/comment, requests with mock escrow, async messaging, two-way reviews, Tier 0 trust, capped phone verification, notifications, i18n.
- **Phase 2 — Trust, safety & groups (~4 wks):** private groups, moderation admin, reputation surfacing, report/block hardening.
- **Phase 3 — Real payments (~4 wks):** Stripe Connect behind existing interface; Tier 2 verification.
- **Phase 4 — Android (~4–5 wks):** Expo app reusing `packages/api`, native push, camera, location.
- **Phase 5 — iOS (~3–4 wks):** same Expo codebase, Sign in with Apple, App Store review.
- **Phase 6 — Monetization:** transaction fees / promoted listings / premium tiers.

---

## 8. Repo layout

```
handimen/
├─ apps/
│  ├─ web/            # Next.js 16      (Phase 0)
│  └─ mobile/         # Expo            (Phase 4)
├─ packages/
│  ├─ api/            # typed client, Zod schemas, contracts
│  ├─ db/             # schema, migrations, generated types
│  ├─ core/           # shared business logic (payments, trust, listings)
│  └─ config/         # eslint, tsconfig, tailwind preset, design tokens
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ docs/
└─ turbo.json, pnpm-workspace.yaml
```

---

## 9. Cross-cutting concerns

- **Legal (EU/Spain):** GDPR (erasure, DPA with Supabase), LSSI-CE legal notice,
  **Digital Services Act** platform duties (notice-and-action, transparency).
- **Liability:** ToS, liability/indemnity disclaimer, privacy policy, borrowing
  agreement accepted before pickup.
- **Liquidity (top risk):** recruit **30–50 tool owners in Poblenou before public
  launch**; lean on private groups so clusters feel alive while the city is thin.
- **Moderation:** bilingual (es + en) report queue; keep it manual at MVP scale.

## 10. Risks

1. Marketplace liquidity / cold start — hardest problem.
2. Liability of lending physical goods; off-platform harm.
3. Scope creep across payments + chat + maps + groups — phasing mitigates.
4. Building past validation — Phases 3–5 gated on Phase 1 traction.
5. Free-tier limits (Supabase pause, storage, bandwidth) and Hobby ToS.
