# Runbook: Cutover (legacy Loom -> anuprerna api)

> Full pre-cutover findings from the DB clone: `../../loom-local-db/ANUPRERNA-DB-CLONE-MASTER-REPORT.md`.

## Blockers to clear first
- [ ] **Auth:** passwords are NOT exportable from Loom (column never exposed). Decide: dual-accept
      legacy tokens (bridge) + native login going forward, or bulk password-reset. BASIC users
      (~3.7k) can't password-login against a fresh DB until then; GOOGLE users need OAuth config.
- [ ] **Email decrypt key** available to the api (decrypt at boundary).
- [ ] **JWT secret** set (or accept forced re-login).

## Safety before any real traffic
- [ ] Outbound email / SMS / WhatsApp disabled or sandboxed (real customer contacts in DB).
- [ ] Razorpay / Stripe in test mode (real historical orders present).
- [ ] Media: same S3 bucket, or upload the mirror.

## Steps
1. Freeze legacy writes. 2. Final data sync (migration pipeline). 3. Flip DNS/route to api.
4. Any read not yet migrated needs a real fallback path at cutover time: today that's the
   frontends' `/api/backend/[...path]` proxy routes calling legacy directly, since
   `apps/api/src/proxy` itself is currently an empty, unpopulated module (see root `CLAUDE.md` and
   `docs/adr/0002-strangler-proxy-migration.md` status update) — either populate `proxy/` for real
   before cutover, or plan to keep routing unconverted reads through the frontend proxies.
5. Smoke test health + a login + an order read.

## Verify
- [ ] `/health` ok.
  > **Status:** request-id does **not** currently propagate — `request-id.middleware.ts` exists but
  > is never registered in `apps/api/src/app.module.ts`. Wire it before relying on this check; see
  > `docs/KNOWN-GAPS.md`.
- [ ] One user logs in. [ ] Order + catalog read correct.
