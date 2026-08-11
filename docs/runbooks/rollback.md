# Runbook: Rollback

If cutover smoke tests fail:
1. Flip DNS/route back to legacy Loom (it stayed running).
2. The api is stateless for reads regardless of whether unconverted reads were served via a
   populated `proxy/` module or via the frontend `/api/backend` proxies (see
   `docs/adr/0002-strangler-proxy-migration.md` status update for which one is actually in use at
   cutover time) — no data to unwind if writes were still frozen.
3. If native writes had started: replay/reconcile from the migration pipeline, then investigate.
4. File an incident (see `incident.md`) with the request-ids from the failing smoke tests, noting
   that request-id propagation is not wired yet as of this branch — see `incident.md`'s status note.
