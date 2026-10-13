# Portability guardrails (Vercel → Cloudflare)

We **develop on Vercel Hobby** (private testing only — its ToS forbids commercial
use) and **migrate to Cloudflare Workers via OpenNext before public launch**.

For that migration to be a config change instead of a rewrite, every contributor
must follow the rules below. If you're about to use something on the "Avoid"
list, stop and ask in the team channel first.

## Rules

1. **No Vercel-proprietary services.** Do not use Vercel Blob, KV, Edge Config,
   Postgres, or Image Optimization. Use:
   - object storage → **Supabase Storage**
   - image transforms → Supabase transforms / Cloudflare Images-compatible code
   - caching / key-value → Supabase tables, or Redis only if unavoidable
2. **No Vercel Cron.** Scheduled work lives in **Supabase `pg_cron`** (which also
   drives the anti-pause ping for the free-tier project).
3. **Web-standard request/response.** Route handlers and server code should use
   `Request` / `Response` / `fetch`. Avoid Node-only built-ins (`fs`, `child_process`,
   `net`) in request paths — they won't run on Workers.
4. **Realtime stays on Supabase.** Never on the host platform.
5. **Runtime config via env vars only.** No platform-specific config files for
   runtime behavior.
6. **Keep the Supabase client in `packages/db`.** It runs anywhere; don't scatter
   client construction.

## Free-tier traps to remember

- **Supabase free pauses after 7 days of inactivity.** A `pg_cron` (or GitHub
  Action) ping keeps it alive; add it before the first long pause.
- Supabase free caps: 500 MB database, 1 GB storage, 5 GB egress.
- Vercel Hobby: non-commercial. Migrate before you charge money or go public.

## Migration checklist (run before public launch)

- [ ] Add `@opennextjs/cloudflare` adapter + `wrangler.toml`
- [ ] Confirm no "Avoid" items above are in use (`git grep` for `@vercel/`)
- [ ] Move any cron jobs to `pg_cron`
- [ ] Verify image handling without Vercel Image Optimization
- [ ] Smoke-test auth, storage upload, realtime on a Workers preview
- [ ] Point the domain at Cloudflare
