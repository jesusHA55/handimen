# Connecting Supabase

Phase 1 currently runs on an in-memory mock data layer (`packages/core`) so the
whole app is explorable with zero setup. This doc covers what's needed to swap
that for real Supabase Persistence.

There are two paths. They're not exclusive — most teams do **A then B**.

---

## Status

- [x] Hosted project created (`dlngsvlzitwavzqgdkco`, Paris) and schema applied
- [x] 17 tables · RLS enabled on all 17 · 44 public + 4 storage policies · 2 buckets
- [x] Extensions: postgis 3.3.7, pg_trgm 1.6, pgcrypto 1.3, pg_cron 1.6.4
- [x] Seeded: Barcelona city
- [x] Real generated DB types in `packages/db/src/database.types.ts`
- [x] `GET /api/health` proves connectivity (reads `cities` through RLS)
- [x] Supabase Auth magic link: `/sign-in`, `/auth/callback`, sign-out
- [x] Auth redirect allow-list set to `http://localhost:3000/auth/callback`
- [ ] **Custom SMTP** — the built-in emailer only delivers to org team members
      (2/hour). Magic links only reach your Supabase account email until then.
- [ ] Swap the mock repositories for Supabase-backed implementations

> Migrations were applied via the Management API (no local Postgres/CLI needed).
> The CLI is only required for `supabase db push` / `pnpm db:types` workflows.

---

## Path A — Local Supabase (no account, no cost) ← recommended first

Requires only:

| Need | Notes |
|---|---|
| Docker Desktop (running) | Supabase CLI runs the stack in containers |
| Supabase CLI | `brew install supabase/tap/supabase` |

Then:

```bash
supabase start          # boots Postgres + PostGIS + Auth + Storage + Studio
supabase db reset       # applies supabase/migrations + seed.sql
pnpm db:types           # generates real column types into packages/db
```

`supabase start` prints the local API URL, anon key, and service-role key —
paste those into `apps/web/.env.local`. Nothing leaves your machine.

**What I need from you:** just confirmation that Docker Desktop is installed and
running (or the OK to proceed without it checked).

---

## Path B — Hosted project (for the Vercel deploy)

Requires a Supabase account on the **free tier** (fits the €10/month budget:
500 MB database, 1 GB storage, 50k MAU).

### What I need from you

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Region: **`eu-west-3` (Paris)** — closest to Barcelona, lowest latency.
   - Save the database password it generates.

2. **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ server-only, never client

3. **Project Settings → Database**, copy the connection string:
   - `Connection string (URI)` → `SUPABASE_DB_URL` (used to run migrations)

4. **Account → Access Tokens**, create one → `SUPABASE_ACCESS_TOKEN`
   (lets the CLI push migrations instead of pasting SQL into the dashboard)

5. **Project ref** (in the dashboard URL) → `SUPABASE_PROJECT_REF`

### Also needed, but only when we reach those features

| Feature | Needs | When |
|---|---|---|
| Google sign-in | Google Cloud OAuth client ID + secret | Auth step |
| Phone verification (Tier 1) | Twilio Account SID + auth token + a Spanish sender/number | Trust step |
| Transactional email | Resend API key + a verified sending domain | Notifications |
| Sign in with Apple | Apple Developer account ($99/yr) | iOS, Phase 5 |
| Map tiles | MapTiler/Stadia free-tier key | Phase 2+ |

### Security rules I'll follow

- Keys go in `apps/web/.env.local` (gitignored) and Vercel env vars — never committed.
- `SUPABASE_SERVICE_ROLE_KEY` is used **only** in server code and bypasses RLS.
  It must never reach a client bundle.
- The `anon` key is safe for the browser; Row Level Security is what protects data.
- The migration in `supabase/migrations/` already enables RLS on every table.

---

## What happens once connected

The mock layer was built to be replaced, not rewritten — same pattern as
`PaymentsProvider`:

1. Implement Supabase-backed repositories in `packages/db` behind the existing
   interfaces (`ListingsRepository`, `RequestsStore`, `MessagesRepository`,
   `ReviewsRepository`, `SocialRepository`).
2. Swap the `getXStore()` singletons to return them.
3. Add Supabase Auth (email OTP + Google) and replace the hardcoded
   `CURRENT_USER_ID`.
4. Move the local PostGIS radius filter to `ST_DWithin` (already prepared in the
   schema) and full-text search to the generated `search_vector`.
5. Remove `export const dynamic = "force-dynamic"` from the layout and add
   proper revalidation/caching.

Because the interfaces already exist and are exercised by 33 unit tests, steps
1–2 are mechanical, and the UI doesn't change at all.

---

## Environment template

`apps/web/.env.example` lists the client-safe and server-only variables. Locally:

```bash
cp apps/web/.env.example apps/web/.env.local
# fill in the values from Path A or Path B
```

## Free-tier watch-outs

- Projects **pause after 7 days of inactivity** — a keep-alive job is already in
  `.github/workflows/keepalive.yml` (set `SUPABASE_URL` + `SUPABASE_ANON_KEY`
  repo secrets to enable it).
- Storage is capped at 1 GB; listing photos will need Cloudflare R2 or an upgrade
  before real launch.
