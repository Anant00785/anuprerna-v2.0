# CLAUDE.md — apps/worker

Container, off the request path. Email, Zoho sync, payment webhooks.

## Rules
- Nothing user-facing runs here; the API never blocks on worker jobs.
- Idempotent handlers (webhooks retry). Structured logs with the request-id from the triggering call.
- ⚠️ Guard outbound email/SMS/WhatsApp behind an env flag — real customer contacts are in the DB (see cutover runbook).
