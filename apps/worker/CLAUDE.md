# CLAUDE.md — apps/worker

Container, off the request path. Intended to own email, Zoho sync, payment webhooks.

> **Status:** `apps/worker/src` is currently a 1-file placeholder (`index.ts`, 3 lines, no queue, no
> jobs registered — see `docs/ARCHITECTURE.md` §2). The rules below apply to what gets built here.

## Rules
- Nothing user-facing runs here; the API never blocks on worker jobs.
- Idempotent handlers (webhooks retry). Structured logs with the request-id from the triggering call.
- ⚠️ Guard outbound email/SMS/WhatsApp behind an env flag — real customer contacts are in the DB (see cutover runbook).
