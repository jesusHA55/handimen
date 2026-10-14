# Scalability plan

How Handimen is expected to behave as it grows, what we've already paid down, and
what to do at each step. Written to be actionable rather than theoretical: every
tier lists concrete work, and each item names the trigger that makes it worth doing.

**Rule of this document:** we don't build for scale we don't have. We build the
things that are cheap now and expensive later, and we measure before optimising.

---

## 1. Where we are

| Layer | Choice | Why it scales the way it does |
|---|---|---|
| Web | Next.js 16 App Router, **Cache Components + PPR** | Static shell streams; only request-time data is per-user |
| Data | Supabase Postgres + RLS, accessed via **PostgREST over HTTP** | No connection pool to exhaust — a real advantage on serverless |
| Auth | Supabase Auth (magic link via Resend) | One validation round trip per request, memoised per render |
| Hosting | Vercel (dev) → Cloudflare (public) | Free-tier constraint, not a scaling one |
| Mobile | Expo (Phase 4), shares the same API | No separate backend to scale |

**The shape that matters:** PostgREST-over-HTTP means an app instance is stateless
and cheap. Our scaling limits are almost entirely *database query cost* and *egress*,
not compute or connections.

---

## 2. What costs us, and why

Found by walking the reads in `packages/db/src/repositories.ts` and the pages.

| Finding | Where | Why it matters |
|---|---|---|
| `getStores()` ran in **both** layout and page | `lib/stores.ts` | 2× auth + profile round trips per request |
| `force-dynamic` on the locale layout | `layout.tsx` | Killed the static shell for every route |
| All messages shipped to the client | `layout.tsx` | Every HTML response carried both locales' full catalog |
| Feed capped at 50, no cursor | `repositories.ts` | Silent truncation; no pagination anywhere |
| Inbox loads **all threads then all their messages** | `messages.listThreads` | Unbounded as a member accumulates messages |
| Radius filter in **JavaScript** | `listings.list` | Doesn't scale; PostGIS is unused |
| Missing indexes on hot paths | migrations | Seq scans + sorts on the most frequent queries |
| `threads` unscoped for the RLS subquery | `messages` policies | Policy lookup per candidate row |
| No rate limiting on writes | `lib/actions.ts` | Board and requests are spam-open |
| No observability | — | Optimising blind |

---

## 3. Tier A — done

Delivered before Phase 2, because adopting caching gets harder with every page added.

- [x] **Cache Components + Partial Prerendering** enabled (`cacheComponents`,
      `partialPrefetching`). Blanket `force-dynamic` removed. Every route is now
      `◐ Partial Prerender` — a static shell with streamed dynamic content.
- [x] **`getStores()` and `getCurrentUser()` memoised with React `cache()`** — the
      layout and page now share one set of round trips per request.
- [x] **i18n payload trimmed** — server-only namespaces no longer ship to the client.
- [x] **9 indexes** on the hot paths (listings browse, feed, chat, reviews).
- [x] **Comments RLS fixed** — was `using (true)`, leaking comments on
      group/followers posts.
- [x] **Service-role client isolated** to the demo seeder (`lib/supabase/admin.ts`),
      because the neighbour-attributed insert legitimately can't pass RLS.

## 4. Tier B — before public launch

Do these when you're ready to invite strangers. Each is a real risk, not gold-plating.

- [ ] **Pagination** (cursor) for feed, listings, comments and messages
- [ ] **PostGIS `ST_DWithin`** + a `nearby_listings` RPC; move search to `tsvector`
- [ ] **Inbox RPC** returning last-message-per-thread instead of loading everything
- [ ] **Observability** — Sentry + PostHog, and record p50/p95 *before* optimising more
- [ ] **Rate limiting** on server actions (Upstash or Cloudflare)
- [ ] **Image pipeline** — real photos need Storage/R2 + transforms; 1 GB dies first
- [ ] **Cloudflare migration** and re-test PPR there (Workers CPU limits are the risk)

## 5. Tier C — city-wide (~10×)

- [ ] **Scope the feed by city** — `posts.city_id` is currently ignored, which is both
      a correctness bug and a cost bug once you leave Poblenou
- [ ] Materialised views for neighbourhood stats; `pg_cron` jobs for digests
- [ ] Redis/KV for hot reads if Postgres starts sweating
- [ ] Backfill/archival policy for old messages and notifications

## 6. Cost ladder

| Stage | €/month | What changes |
|---|---|---|
| Dev + private beta | **0–10** | Free tiers + domain. Where we are. |
| Public launch, small | **~25–30** | Supabase Pro + Cloudflare. Unavoidable once free limits bite. |
| Growth | usage-driven | **Egress and storage dominate, not compute.** |

Free-tier ceilings to watch: 500 MB database, 1 GB storage, 5 GB egress/month.
The database will hold a city-sized text dataset for a while; **photos are what push
you to paid**, so budget for storage before you budget for compute.

---

## 7. What we measure

Without these, every optimisation is a guess.

| Metric | Target |
|---|---|
| p95 page latency | < 500 ms |
| Database queries per page render | < 8 |
| Supabase egress per day | tracked, with a budget alarm |
| Error rate | < 0.5% |
| Static-shell hit ratio | > 80% of requests |
| Cost per active member per month | **the business metric** |

---

## 8. Tier D and beyond — what it means for the business

This section is written for the business side. It describes what changes *organisationally*
once Handimen is beyond a single city, and what decisions need to be made **before** that point.

### What "Tier D" looks like

Roughly: **multi-city, tens of thousands of active members, real money moving through
the platform, and staff whose job is moderation.** Nothing here is a rewrite — it's
the point where operational work stops fitting in a side-of-desk and infrastructure
stops being a rounding error.

### 1. The cost model changes shape

Today our costs are **fixed and tiny** (a domain, maybe €25/month). At Tier D they
become **variable and usage-driven**: storage and egress per photo, database size,
emails, SMS for verification, payment fees, and moderation hours.

**The decision this forces:** we need a **cost-per-active-member** figure early, so we
can tell whether growth is profitable or just expensive. That single number determines
whether the product can stay free, needs a fee, or needs a premium tier — and it's
cheap to start measuring now and expensive to retrofit.

### 2. Trust & safety becomes a function, not a feature

Moderation works while you can read every report yourself. It stops working at a few
hundred reports a week, in three languages (es/ca/en).

- **Before Tier D:** a report queue with an audit trail, a clear policy, and a named
  owner. RLS already supports the tooling; the policy is the hard part.
- **At Tier D:** dedicated moderation capacity, escalation paths, and decisions about
  automated detection (spam, prohibited items, repeat offenders).

**Decision needed:** who owns trust & safety, and what's the escalation path for
something serious — a stolen tool, a threatening message? This needs an answer
*before* launch, not after an incident.

### 3. Money brings regulation

In-app payments (Phase 3) mean more than Stripe integration: peer payouts, refunds
and disputes, and — in the EU — consumer-protection and payment rules that Stripe
handles technically but we own commercially.

**Decision needed:** when do we move from "settle in person" to on-platform money, and
who owns disputes when a tool comes back damaged?

### 4. Regulatory surface grows with us

GDPR applies from day one, but at scale it becomes an *operational* obligation, not a
checkbox: **data-subject requests** (export/erasure) must be answerable routinely, and
the **Digital Services Act** imposes notice-and-action and transparency duties on
platforms above certain sizes. Both are design problems we can prepare for cheaply now
— a report queue, a retention policy, and an erasure path — and expensive surprises later.

**Decision needed:** a data-retention policy (how long do we keep messages and photos
after a member leaves?) and whether the DSA's transparency obligations apply to us.

### 5. Multi-city is a product decision, not just a technical one

The schema already models cities and private groups. Going multi-city means deciding:
do we launch city-by-city with real density (our current advantage), or open everywhere
and accept empty neighbourhoods? **Liquidity is per-neighbourhood**, so this is a growth
strategy question that constrains the engineering.

### 6. Engineering shape stays boring on purpose

Even at Tier D we should avoid a rewrite: no microservices, no Kubernetes, no separate
backend, no custom search engine until Postgres provably can't cope. The work is
**partitioning large tables, caching hot reads, and background jobs** — incremental,
not architectural.

**Decision needed:** when to hire a dedicated platform engineer. The honest trigger is
"when incident response and cost management no longer fit inside the existing team's
week", not a headcount plan.

### Trigger points rather than dates

| Signal | Action |
|---|---|
| Reports > ~20/week | Written moderation policy + owner |
| Storage > 50 GB | Move photos to R2; revisit free tier |
| p95 > 500 ms | Tier B/C items for the specific slow query |
| Second city launching | Tier C city scoping + per-city liquidity plan |
| Payments live | Dispute process + cost-per-member model |

---

## 9. Non-goals

Deliberately **not** doing, and why:

- **Microservices / Kubernetes** — a modular monolith with caching and indexes carries
  this product much further than the operational complexity justifies.
- **A separate backend service** — the Next.js server layer plus PostgREST is sufficient.
- **WebSockets/Realtime for chat** — async messaging is a plan decision, not a limit.
- **A dedicated search engine** — Postgres full-text and pg_trgm handle a city.
- **Mobile-specific backend** — Expo reuses the same API by design.

If we ever revisit these, it should be because a measurement says so.
