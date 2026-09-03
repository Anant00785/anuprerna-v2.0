# Handoff — v2 deployment / backend unreachable-database incident

**Date:** 2026-09-03 · **Author:** Jeel (with Claude) · **Status:** frontends done, backend broken

Read this top-to-bottom before touching anything. Several plausible-sounding theories about
this incident are **wrong** and are recorded below as disproven so they are not re-investigated.

---

## 1. What is deployed right now

| Thing | Where | State |
|---|---|---|
| Storefront (`apps/storefront`) | `https://anuprerna-v2-0-storefront-zeta.vercel.app` | ✅ Deployed, env correct, builds clean |
| CMS (`apps/cms`) | `https://anuprerna-v2-0-cms-green.vercel.app` | ✅ Deployed, HTTP Basic gate active (all routes 401) |
| API (`apps/api`) | `https://8inhrqt6pe.ap-south-1.awsapprunner.com` (AWS App Runner, ap-south-1) | ❌ **Up but cannot reliably reach Postgres** |
| Database | Neon `ep-small-cell-ayxce8q9-pooler.c-5.us-east-2.aws.neon.tech` | ✅ Healthy, populated (6 categories, 4,839 products) |

Vercel account: **saqlain-marslab, Hobby plan**. Two separate Vercel projects, same repo,
root dirs `apps/storefront` and `apps/cms`. Repo: `github.com/saqlain-marslab/anuprerna-v2.0`
(private). Saqlain deployed the API from `main`.

### Other live URLs (from the WhatsApp log) — status checked 2026-09-03

| URL | Status | What it is |
|---|---|---|
| `https://anuprerna.com` | 200 | **Live production site** (old stack) |
| `https://gilded-mochi-ef021a.netlify.app` | 200 | Netlify deploy — matches `netlify.toml` at repo root (`base = apps/storefront`) |
| `https://loom-v2.anuprerna.com` | **404** | Legacy Loom backend — **DOWN**, and hardcoded in ~15 places (see §3a) |
| `https://anuprerna-cms.vercel.app` | 401 | Another CMS deploy (auth-gated) |
| `https://anuprerna-v2-0-c7coxlca3-anant00785s-projects.vercel.app` | — | CMS under **Anant's** Vercel account |
| `https://weave.bloomscorp.com/dashboard` | — | Vendor Weave CMS (login `support@anuprerna.com`) |
| `https://anuprerna-api.onrender.com` | — | Old Render API — still the **default** in `apps/storefront/src/env.ts` |

⚠️ **There are at least three CMS deployments across three different accounts** (saqlain-marslab,
Anant's, and `anuprerna-cms.vercel.app`), plus a Netlify storefront and the live anuprerna.com.
**Nobody has stated which is canonical.** Establish this before debugging further — you may be
testing a deployment nobody uses. Also decide whether `netlify.toml` should stay in the repo now
that the storefront is on Vercel.

CloudWatch log group for the API:
`/aws/apprunner/anuprerna-api/418194b6356744de8c6e5bba972cae13/application`

---

## 2. THE BUG — where the whole investigation lands

**Every database-backed API route hangs. Routes that need no database are instant.**

Measured repeatedly over ~40 minutes:

```
/health                                200   0.24s   ← no DB
/docs-json                             200   0.47s   ← no DB (734 routes registered)
/get/category/list                     000  15-25s   ← DB, hangs
/get/product-preview-list/accessories  000  15-25s   ← DB, hangs
/get/navigation/fabric/craft           000  15-25s   ← DB, hangs
```

`000` = curl got no response at all.

**This one fault explains every symptom reported:** storefront 500s on catalogue pages,
sign-in stuck forever on "Signing in…", checkout failing, add-to-cart failing (Saqlain hit
this too). They are not separate bugs. Do not debug them separately.

### Intermittency (important, newly observed)

At one point `/get/category/list` returned **200 in 0.33s**, then went straight back to
hanging on the next request. So it is not a hard network block — it looks like a connection
pool that occasionally serves one request and then stalls. Factor this into diagnosis; a
single successful curl does **not** mean it is fixed.

---

## 3. Disproven theories — do NOT re-investigate

These were each checked and ruled out with evidence. Re-testing them wastes time.

| Theory | Verdict | Evidence |
|---|---|---|
| **"We're hitting Loom instead of our own BE"** | ⚠️ **PARTLY TRUE — see §3a.** The env-var routing is fine, but there are ~15 **hardcoded** `loom-v2.anuprerna.com` URLs that ignore env entirely. | The env path is clean: `NEXT_PUBLIC_NEST_API_URL` and `NEXT_PUBLIC_SPRINGBOOT_API_URL` are both the App Runner URL, and `NEXT_PUBLIC_API_MODE` only selects between them (`apps/storefront/src/env.ts:5`, `lib/api/client.ts:8`). **But** several routes bypass env with literal Loom URLs. **This is a second, independent bug.** |
| Database is down / unreachable | ❌ FALSE | Connects from a laptop in **1.7s**, both pooler and direct endpoints. |
| Neon connection pool exhausted | ❌ FALSE | `pg_stat_activity`: **2 connections**, `max_connections` = 901. Nearly idle. |
| Wrong DB credentials sent to Saqlain | ❌ FALSE | Used his exact `DATABASE_URL` verbatim — connects fine, 124 tables, 4,839 products. |
| API not deployed / routes missing | ❌ FALSE | `/docs-json` lists **734 routes**. Fully deployed. |
| Our code calls wrong paths | ❌ FALSE | Early probes of `/get/craft/list` and `GET /authenticate/email` 404'd — **those probes were wrong**, not the code. Real paths are `/get/navigation/fabric/craft` and `POST /authenticate/email`. A 400 on `/get/product/list` is the ValidationPipe correctly rejecting missing params. |

**Note on two databases.** Jeel's local `.env.local` uses `ep-morning-band-ay7cmm8m`; the config
sent to Saqlain uses `ep-small-cell-ayxce8q9`. Different Neon projects. **Both are healthy and
both connect fine** — this is a tidiness issue, not the cause. But confirm which one is
canonical for production before anyone writes data. (From the WhatsApp log: `small-cell` is the
**backend API** DB; `morning-band` is the **feedback widget / Neon S3** DB. Verify this holds.)

---

## 3a. SECOND BUG — hardcoded `loom-v2.anuprerna.com` URLs that bypass env

**`https://loom-v2.anuprerna.com` currently returns 404.** Any code path hardcoded to it is dead,
regardless of what the App Runner backend does. `grep -rn 'loom-v2\.anuprerna\.com' apps/*/src`
finds ~15 call sites. The important ones:

| File | What it breaks |
|---|---|
| `apps/cms/src/lib/auth-service.ts:145` | **CMS login** — `POST .../authenticate/email` hardcoded |
| `apps/cms/src/lib/auth-service.ts:211` | CMS `GET /get/authority/token` hardcoded |
| `apps/cms/src/app/api/auth/login/route.ts:29` | CMS login route, hardcoded |
| `apps/storefront/src/app/api/plp/route.ts:50-51` | **Product listing filters** — hardcoded, **no env override at all** |
| `apps/cms/src/lib/api.ts:1053`, `app/api/listings/route.ts:160` | CMS product preview list, hardcoded |
| `apps/cms/src/lib/config.ts:1,10,14,24` | CMS defaults + `IMAGE_RESOURCE_API` fall back to Loom |
| `apps/storefront/src/app/api/blogs/route.ts:5`, `api/navigation/category/[type]/route.ts:5` | Fall back to Loom when `NEXT_PUBLIC_SPRINGBOOT_API_URL` is empty (env is set in Vercel, so these are currently OK — but they are landmines) |

**Consequence:** even after the App Runner DB issue is fixed, **CMS login will still fail** and
storefront PLP filters will still fail, because they never call our backend. Jeel's WhatsApp
message at 13:04 ("Storefront is running against some wrapper of sandbox loom") was a correct
observation that got prematurely dismissed at 13:18 as "confusion, everything working".

**Fix:** route every one of these through `BACKEND_URL` / `NEXT_PUBLIC_SERVER_ENDPOINT`, no
literals. Per root `CLAUDE.md`, the strangler boundary must only shrink toward `apps/api` —
these hardcoded URLs widen it.

Also note `apps/storefront/src/env.ts` defaults all three API URLs to
`https://anuprerna-api.onrender.com` (an old Render deploy). Vercel env overrides them, but a
missing var silently falls back to a stale backend instead of failing.

---

## 4. Leading hypothesis (unproven — verify first)

**App Runner has no internet egress, most likely a VPC connector with no NAT gateway.**

Fits every observation: Neon is public internet (no VPC peering needed); a VPC connector routes
*all* App Runner outbound traffic through the VPC; without a NAT gateway there is no route to
the internet; `/health` works because it needs no network.

Check, in order:

1. **Does the App Runner service have a VPC connector attached?** If yes → either remove it, or
   add a NAT gateway to those subnets. Most likely fix.
2. Is `DATABASE_URL` actually set in the App Runner service config (not just in the repo)?
3. Try the URL **without** `&channel_binding=require` — long shot, but it could stall a TLS
   handshake depending on the runtime's TLS stack.
4. The intermittent success above may also point at DNS/NAT flakiness rather than a hard block.

### The log line that settles it

The running code logs the real reason at startup. In CloudWatch, filter the log group on:

```
[Database] Connection warning:
```

**That line names the actual error** (timeout / ENOTFOUND / auth / TLS). It has not been read yet
— nobody has pasted it. **Do this first; it may end the investigation immediately.**
Also check whether `Database connected successfully` ever appears.

---

## 5. Fix already pushed (commit `540f8fd` on `main`) — NOT yet deployed

Two real bugs in `apps/api/src/database/database.module.ts`, both ours:

1. **Boot failure was swallowed.** The catch block logged
   `"[Database] Connection warning: … Running in standalone mode."` and let the API start anyway.
   There is no standalone mode — every commerce route needs the DB. So App Runner booted a
   service that could only answer `/health`, with the real cause buried in one log line. It now
   **throws**, naming `DATABASE_URL` and egress/VPC/security-groups as what to check.
2. **No connect timeout.** `postgres(url, { max: 10 })` waits forever. Now
   `{ max: 10, connect_timeout: 10 }` — verified to fail in ~10s instead of hanging.

**What this does and does not do:** it makes the failure *visible*, it does **not** restore the
connection. After Saqlain redeploys, a still-broken config will **fail the deploy at boot with
the reason printed** instead of silently half-working. Uptime was 2686s at handoff — **the fix
is not deployed yet.** Typecheck passes.

---

## 6. Environment variables that matter

**Storefront** (Vercel) — these five must all be the App Runner URL, no trailing slash:
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_NEST_API_URL`, `NEXT_PUBLIC_SPRINGBOOT_API_URL`,
`LOOM_BASE_URL`, `BACKEND_URL`. Plus `NEXT_PUBLIC_API_MODE=nest`.

⚠️ `NEXT_PUBLIC_API_MODE` is a **zod enum** (`"legacy" | "nest"`). A URL pasted there throws at
module load and breaks the build. This mistake was made once already.

**CMS** (Vercel): `BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SERVER_ENDPOINT`,
`NEXT_PUBLIC_LFS_SERVER_ENDPOINT` → App Runner URL. `AUTH_COOKIE_NAME` safely defaults to
`weave_token`. `CMS_ACCESS_USER`/`CMS_ACCESS_PASS` are set and the gate is confirmed working
(all routes 401) — `middleware.ts:49` says these are specifically for the public Vercel
deployment; **never unset them**, or the admin panel is world-readable.

Vercel does **not** import `.env.local`. It auto-detects `.env.example`, which is full of
`127.0.0.1:3000` placeholders. Those must be replaced or the deploy silently points at nothing.

---

## 7. Security — needs action

- **Live production secrets were sent over WhatsApp in both directions and pasted into an AI chat
  session.** The full set, from the 2026-09-03 log: AWS IAM keys (`AKIAUKKCRS63VP6PCBNZ` + secret),
  **Neon S3 live keys** (`nak_live_…` / `nsk_live_…`), **two Neon `DATABASE_URL`s with passwords**,
  Gmail SMTP app password, Razorpay key secret + webhook secret, Stripe secret key, Zoho client
  secret + refresh token, MSG91 auth key, WhatsApp/Freshchat API token, `AUTH_JWT_SECRET`,
  `AUTH_PASSWORD_PEPPER`, `EMAIL_ENCRYPTION_KEY`.
  **Rotate all of them.** Priority order: AWS IAM keys → Neon S3 live keys → Neon DB passwords →
  `EMAIL_ENCRYPTION_KEY` + `AUTH_PASSWORD_PEPPER` → payment secrets → the rest.
  ⚠️ Rotating `AUTH_PASSWORD_PEPPER` invalidates every stored password hash
  (`bcrypt(pepper + password)`, 7,254 accounts per `apps/api/CLAUDE.md`) — **plan that one**, do
  not just swap it.
  Root `CLAUDE.md` forbids persisting decrypted email, which makes `EMAIL_ENCRYPTION_KEY`
  exposure especially serious.
- Commit `4bc682c` "ignore vercel artifacts and local env files" suggests env files may have been
  tracked. **Audit git history for committed secrets.**
- `apps/api/.env` was detected by Vercel as **55 env vars** during an import — i.e. it is in the
  repo. Confirm and remove.
- Two `.env` files were written to `~/Desktop` (`storefront.env`, `cms.env`) with real secrets.
  **Delete them:** `rm ~/Desktop/storefront.env ~/Desktop/cms.env`

---

## 8. Open questions for Saqlain

1. **Who owns the backend — App Runner or Vercel?** Commit `eaa212d` ("ESM output + explicit
   express dep for Vercel serverless") prepares `apps/api` for Vercel serverless while it runs on
   App Runner. **Two competing backends is a real risk.** Decide before more work goes in.
   (Note: `apps/api` is a long-lived NestJS container with a DB pool — a poor fit for serverless.)
2. Which Neon project is canonical: `small-cell` or `morning-band`?
3. Is `NEXT_PUBLIC_API_MODE` meant to be `nest` or `legacy` in production?
4. **Hobby plan is personal/non-commercial use only** under Vercel's ToS. A production storefront
   needs Pro or a team account.
5. CORS: `apps/api/src/main.ts` allowlists only `localhost:3000/3001`. Once the DB is fixed,
   browser-direct calls from the Vercel domains will fail. Server-side proxy calls currently work
   because the storefront proxy spoofs `origin: https://anuprerna.com`
   (`apps/storefront/src/app/api/backend/[...path]/route.ts:41`). **Add both Vercel domains.**

---

## 9. Suggested order of work

**Track A — deployed backend cannot reach its database (§2, §4)**

1. **Read the CloudWatch `[Database] Connection warning:` line.** Cheapest, highest-value step.
2. Check the App Runner VPC connector / NAT gateway.
3. Redeploy the API with `540f8fd` — it will now fail loudly with the cause if still broken.
4. Re-test: `curl .../get/category/list` several times (intermittency — one success proves nothing).

**Track B — hardcoded Loom URLs (§3a). Independent of Track A; can be done in parallel.**

5. Replace every hardcoded `loom-v2.anuprerna.com` with the configured backend URL. **CMS login
   and storefront PLP filters stay broken until this is done, even if Track A succeeds.**
6. Remove the `anuprerna-api.onrender.com` defaults in `apps/storefront/src/env.ts` — a missing
   env var should fail, not silently use a stale backend.

**Then**

7. Re-test storefront catalogue, sign-in, add-to-cart, checkout, and CMS login.
8. Add the Vercel domains to the API CORS allowlist.
9. Rotate the leaked secrets; audit git history.
10. Decide which deployments are canonical and retire the rest.

**Nothing needs redeploying on the frontends.** Their env is correct; they start working the
moment the backend can reach its database.

---

## 10. Observability — the real lesson from this incident

**This incident took hours because nothing was observable.** The symptom was "everything hangs";
the cause was one swallowed log line nobody could see. Fixing this is a first-class task, not a
nice-to-have.

### Why it was so hard to debug

- The API **swallowed its own boot failure** and started anyway (fixed in `540f8fd`, but that fix
  only helps at boot — see below).
- **No request IDs.** `apps/api/src/common/middleware/request-id.middleware.ts` exists, has a
  passing spec, and is **never registered in `app.module.ts`** (verified: 0 references). No real
  request carries an ID, so a storefront 500 cannot be tied to an API log line.
- **No error tracking.** No Sentry, no PostHog anywhere in the repo (verified: 0 files).
  `apps/api/src/common/logger/` contains **only a README** — no pino logger.
- **No DB health signal.** `/health` returns `{status:"ok"}` **without touching the database** —
  which is exactly why it stayed green for 40 minutes while every real route hung. A health check
  that cannot fail is worse than none: it actively misled us.
- **Frontend errors are opaque.** The storefront showed only
  `Application error: a server-side exception has occurred … Digest: 3977777226`. The digest maps
  to a real stack trace only in Vercel's runtime logs, and nothing linked the two.
- **Hangs, not errors.** With no `connect_timeout`, failures never surfaced as errors — requests
  just never returned. Nothing to log, nothing to alert on.

### Do these, roughly in this order

1. **Make `/health` actually check the database.** Highest value, smallest change. Add a
   `/health/deep` (or a `db` field on `/health`) that runs `select 1` with a short timeout and
   returns 503 when it fails. Today's incident would have been visible in one curl.
   Keep the shallow `/health` for App Runner's own liveness probe so a DB blip doesn't
   restart-loop the container — point uptime alerting at the deep one.
2. **Register the request-id middleware** in `app.module.ts` (the file already exists) and log the
   ID on every request. Then propagate it from both frontends' `/api/backend/[...path]` proxies so
   one ID spans storefront → API → DB.
3. **Structured logs (pino) in `apps/api/src/common/logger/`** — currently a README. JSON lines
   with request id, route, status, duration. `main.ts` already logs
   `method / url / status / duration`; make it structured and keep it.
4. **Sentry in all three apps** (`apps/api`, `apps/storefront`, `apps/cms`). This is what turns
   `Digest: 3977777226` into a stack trace with a request ID attached.
5. **Log every outbound backend call from the frontends.** The storefront proxy
   (`apps/storefront/src/app/api/backend/[...path]/route.ts`) already `console.log`s target URLs —
   extend it to log status and duration, and do the same in the CMS. This alone would have shown
   "backend never responds" immediately.
6. **Timeouts everywhere, never unbounded.** `connect_timeout` is now set on the DB client; also
   set explicit timeouts on `fetch` calls to the backend in both frontends, so a dead backend
   surfaces as a fast, logged error instead of a spinner.
7. **Alerting.** CloudWatch alarm on the App Runner log group for `[Database]` / `ERROR`, plus an
   uptime check against the deep health endpoint. Root `CLAUDE.md` lists this as target state;
   `docs/KNOWN-GAPS.md` is the ledger.

### Where to look for logs today

| Surface | Where |
|---|---|
| API (App Runner) | CloudWatch log group `/aws/apprunner/anuprerna-api/418194b6356744de8c6e5bba972cae13/application` — filter on `[Database]`, `ERROR` |
| Storefront / CMS runtime | Vercel dashboard → project → Deployments → Runtime Logs (this is where a `Digest:` resolves) |
| Vercel build failures | Same page, Build Logs |
| Database | Neon console → Monitoring (connection counts, query stats) |
| Local repro | see commands below |

**Running locally** (confirmed working per WhatsApp — everything worked locally, only the
deployed backend fails):

```
pnpm install
pnpm --filter @anuprerna/api dev         # NestJS API, watch mode, :3000
pnpm --filter @anuprerna/storefront dev  # :4200
pnpm --filter @anuprerna/cms dev         # :3004
```

Local `.env` files use `127.0.0.1:3000` / `localhost:3000` for all backend URLs. **Working
locally proves nothing about the deployed stack** — the API reaches Neon fine from a laptop; it
is App Runner specifically that cannot.

Useful one-liner for checking whether the DB path is alive, given the intermittency — run it
several times, not once:

```
B=https://8inhrqt6pe.ap-south-1.awsapprunner.com
for i in 1 2 3; do curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" --max-time 15 "$B/get/category/list"; done
```

`000` means no response at all (hang/timeout), not an HTTP status.

Per root `CLAUDE.md`, observability is documented as target state but is **not** current reality —
that document is honest about this, and any work here should update `docs/KNOWN-GAPS.md` rather
than claiming the gap is closed.

---

## 11. Repo context worth knowing

- Local working tree had **57 modified CMS files from a parallel session**; the database fix was
  swept into commit `890145b` ("Refactor authentication token retrieval…") by that session. The
  message does not mention the DB fix, but the code is on `main` and verified present on `origin`.
- Per root `CLAUDE.md`: `apps/api/src/proxy` is an **empty shell** — 0% of traffic transits it.
  The real strangler boundary is the two frontends' `/api/backend/[...path]` route handlers.
  Do not add scaffolding to `proxy/` to satisfy the invariant on paper.
- Old vendor folders (`anuprerna-cms-main`, `anuprerna-storefront-main`, `loom-master`) still sit
  in the repo root. Not involved in any deployment — but worth a decision on removing them.
