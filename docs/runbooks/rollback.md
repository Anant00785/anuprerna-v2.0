# Runbook: Rollback

If cutover smoke tests fail:
1. Flip DNS/route back to legacy Loom (it stayed running).
2. The proxy-based api is stateless for reads; no data to unwind if writes were still frozen.
3. If native writes had started: replay/reconcile from the migration pipeline, then investigate.
4. File an incident (see `incident.md`) with the request-ids from the failing smoke tests.
