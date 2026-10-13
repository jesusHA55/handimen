# Handimen

Hyperlocal sharing network — a hybrid social feed + peer-to-peer lending
marketplace for tools, equipment, and skills. First market: **Poblenou,
Barcelona**.

See [`docs/plan.md`](./docs/plan.md) for the full product & technical plan.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **Web:** Next.js 16 (App Router) + Tailwind v4 + next-intl (es/en)
- **Backend:** Supabase (Postgres + PostGIS, Auth, Storage, Realtime, RLS)
- **Shared:** `packages/api` (Zod contracts), `packages/core` (business logic,
  payments), `packages/db` (types + clients)
- **Mobile (Phase 4):** Expo SDK 57 + expo-router

## What's in the app (Phase 1)

The app runs on a **mock data layer** (`packages/core`) so every screen works
without a Supabase connection yet — by design, the stores are drop-in replaceable.

| Route | What it does |
|---|---|
| `/` | Neighbourhood feed: posts with working likes + featured listings |
| `/explore` | Listings with search, category / price / type filters |
| `/map` | Stylized, keyless mock map of Poblenou with clickable pins |
| `/listings/[id]` | Listing detail + request form |
| `/listings/new` | Publish a listing (exercises the Tier-1 phone gate) |
| `/requests` | Outgoing + incoming requests with the mock escrow lifecycle; leave a review once returned |
| `/messages` | Conversation inbox with unread counts |
| `/messages/[id]` | Thread view + composer (async) |
| `/profile` | Trust tier, verification state, mock phone verification, reviews received |

`es` is the default locale (`/`); English lives under `/en`.

To publish a **paid** listing while unverified, the form blocks and offers a
mock "verify phone" step — the tiered trust policy in action.

Reviews are two-way and only unlock after a borrow is marked returned; a
completed handoff bumps both members' stats.

To **connect Supabase**, see [`docs/supabase.md`](./docs/supabase.md).

## Layout

```
apps/web            Next.js 16 web app
packages/config     tsconfig / design tokens / shared config
packages/core       business logic: payments, trust, listings
packages/db         Supabase clients + generated DB types
packages/api        Zod schemas + typed API contract
supabase            migrations + seed
docs                plan + portability guardrails
```

## Getting started

```bash
corepack enable pnpm
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase keys
pnpm dev
```

## Common commands

```bash
pnpm dev          # run all dev servers (web)
pnpm build        # build everything
pnpm typecheck    # type-check all workspaces
pnpm lint         # lint all workspaces
pnpm test         # run all tests
```

## Database

Local Supabase (requires the [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase start
supabase db reset     # apply migrations + seed
pnpm db:types         # regenerate packages/db/src/database.types.ts
```

> **Portability:** we develop on Vercel Hobby but must migrate to Cloudflare
> before public launch. See [`docs/portability.md`](./docs/portability.md) for the
> constraints every contributor must follow.
