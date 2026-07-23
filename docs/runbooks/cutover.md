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
4. proxy still serves any unconverted read. 5. Smoke test health + a login + an order read.

## Verify
- [ ] `/health` ok, request-id propagates. [ ] One user logs in. [ ] Order + catalog read correct.
