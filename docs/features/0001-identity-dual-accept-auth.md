# Feature: Identity — dual-accept auth (EXAMPLE, unbuilt)

> Example spec showing the shape. Status: **NOT STARTED** — the dev/agent implements it.

## Context
During migration the API must accept BOTH the legacy Loom JWT (AES-ECB subject, key the business
doesn't hold — proxied verify) AND the new native session token. This is the seam that lets us cut
over auth without a flag day. Replaces Loom's `/authenticate/*`. See `apps/api/CLAUDE.md`, `adr/0002`, `adr/0003`.

## Scope
- In: verify both token types on incoming requests; issue native tokens on new logins; delegated resolver that maps a token to a user.
- Out: password reset UX (worker/email), OAuth provider setup (infra).

## Acceptance criteria
1. A request bearing a valid legacy Loom token resolves to the correct user.
2. A request bearing a valid native token resolves to the correct user.
3. An invalid/expired token is rejected with 401 and a request-id in the log.
4. New login issues a native token; legacy tokens are never minted.

## Data contracts
`SessionSchema`, `AuthClaimsSchema` in `@anuprerna/types`.

## Files to touch
- `apps/api/src/identity/{identity.module,identity.service,identity.controller}.ts`
- `apps/api/src/identity/guards/dual-accept.guard.ts`
- `packages/types/src/schemas/session.schema.ts`
- tests: `apps/api/src/identity/**/*.spec.ts`

## Test plan
- Unit: guard accepts legacy token, accepts native token, rejects garbage, attaches user.
- Contract: storefront login flow returns a native token that the guard accepts.

## Done when
- [ ] All 4 criteria tested and green
- [ ] `@anuprerna/types` has session/claims schemas
- [ ] a legacy `/authenticate` read is removed from `proxy/`

## Handoff log
- (none yet)
