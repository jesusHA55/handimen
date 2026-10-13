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
