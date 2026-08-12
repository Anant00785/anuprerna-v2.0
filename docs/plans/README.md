# docs/plans

Working plans from the 2026-08-12 remediation programme, preserved here because
they were written to a session scratchpad that does not survive a restart.

| File | What it is | Status |
|---|---|---|
| `INTEGRATION-PLAN.md` | Making `apps/api` standalone: config, auth, payments, S3, outbound channels. The live roadmap. | **Phases 0-1 done** (config + auth). Payments, email crypto, WhatsApp/MSG91/Zoho outstanding. |
| `TEST-PLAN.md` | The unit-test build-out that took the repo from 12 to 586 tests. | Largely executed. The budget table is still a useful map of what is and is not covered. |
| `nverse-password-spec.md` | Research spec for the legacy bcrypt+pepper algorithm. | Implemented and verified against production hashes. Keep for the call-site inventory and the password-reset flow notes. |

Current state and open items live in `docs/KNOWN-GAPS.md`, which is the
authoritative ledger. These plans are context, not a substitute for it.
