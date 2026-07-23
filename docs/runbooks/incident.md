# Runbook: Incident

1. Grab the `x-request-id` from the report; trace it across storefront -> api -> worker (pino logs).
2. Check Sentry (errors/traces) and uptime/health alerts.
3. Mitigate (rollback route if user-facing). 4. Write a short post-mortem as an ADR if it changes design.
