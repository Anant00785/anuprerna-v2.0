# Authorization — gates, roles, and how to gate a route

Verified against the code on `fix/flax-audit-remediation`, 2026-09-02. Every claim below traces to
a file named in it. Where something is unverified it says so.

> **Read this first.** Until the gate pass that produced the `*.controller.gates.spec.ts` files,
> **every gate returned `true`.** The `@RequireGate` decorators were present on the controllers and
> the guard was wired, but the authority check did not distinguish roles — an authenticated
> customer satisfied a super-user gate. The decorators looked like enforcement and were not. That
> is the reason this document exists and the reason the gate specs assert the expected gate
> *literally* rather than reading it back off the metadata.

## 1. The pieces

| Piece | File | What it does |
|---|---|---|
| `GateCode` | `src/auth/types/auth.types.ts` (enum, values 1–7) | The seven authority codes ported 1:1 from Loom's `LoomGatekeeper` |
| `@RequireGate(code)` | `src/common/auth/roles.guard.ts` | `SetMetadata(GATE_CODE_KEY, code)`. Nothing more — it is a marker |
| `RolesGuard` | `src/common/auth/roles.guard.ts` | Reads the metadata, verifies the bearer token, calls the gatekeeper, throws 401/403 |
| `GatekeeperService.userHasAppropriateAuthority` | `src/auth/service/gatekeeper.service.ts` | The switch that decides. This is where the authority actually lives |
| `describeGates` | `src/common/testing/gate-spec.ts` | The shared harness every `*.controller.gates.spec.ts` uses |

## 2. The `GateCode` → role mapping

`GatekeeperService.userHasAppropriateAuthority(user, code)` is a 1:1 port of
`LoomGatekeeper#userHasAppropriateAuthority(LoomTenant, int)`, including its `default -> false`.

| `GateCode` | Value | Accepts | Method |
|---|---|---|---|
| `CODE_SU` | 1 | `ROLE_GOD_MODE`, `ROLE_SUPER_USER` | `roleSU` |
| `CODE_CU` | 2 | `ROLE_GOD_MODE`, `ROLE_CUSTOMER` | `roleCU` |
| `CODE_AR` | 3 | `ROLE_GOD_MODE`, `ROLE_ARTISAN` | `roleAR` |
| `CODE_SUCU` | 4 | the union of `CODE_SU` and `CODE_CU` | `roleSUCU` |
| `CODE_SUAR` | 5 | the union of `CODE_SU` and `CODE_AR` | `roleSUAR` |
| `CODE_CUAR` | 6 | the union of `CODE_CU` and `CODE_AR` | `roleCUAR` |
| `CODE_SUCUAR` | 7 | the union of all three | `roleSUCUAR` |
| anything else | — | **nobody** — `default: return false` | — |

Two invariants worth stating plainly:

- **`ROLE_GOD_MODE` satisfies every gate.** Every `role*()` predicate begins `this.roleGOD(user) || …`.
  `roleGOD` and `roleSU` are inherited from `com.bloomscorp.nverse.NVerseGatekeeper`, which is not
  in this repository; the port reconstructs them from call-site symmetry and says so in its own
  javadoc. Treat those two as **reconstructed, not source-verified** — the other five are
  source-verified.
- **An unknown or absent role matches nothing.** `hasRole` fails closed: no `roles` claim, a
  non-array claim, or an unrecognised value all return `false`.

### `ROLE_ARTISAN` is inert

`roleAR` is ported faithfully but `ROLE_ARTISAN` **has no member in this repo's `user_role_enum`**
(see the ROLE DISCREPANCY note in `auth.types.ts`). No real token can carry it today, so
`CODE_AR` currently admits only `ROLE_GOD_MODE`, and `CODE_SUAR` / `CODE_CUAR` currently behave as
`CODE_SU` / `CODE_CU`. The gate specs exercise `ROLE_ARTISAN` as a *token claim*, which works
because the guard reads the claim as a string — that is a test of the port's logic, not evidence
that an artisan can log in.

## 3. How `@RequireGate` and `RolesGuard` fit together

`RolesGuard.canActivate`, in order:

1. `reflector.getAllAndOverride(GATE_CODE_KEY, [handler, class])` — a handler-level gate overrides
   a class-level one.
2. **No gate metadata → the route is public** and returns `true` immediately. This mirrors Loom's
   `NON_AUTHENTICATED_URLS`. It also means *forgetting* `@RequireGate` silently publishes an
   endpoint; there is no default-deny.
3. Missing `Authorization` header → `UnauthorizedException` (401).
4. Strips any number of leading `Bearer ` prefixes; an empty remainder → 401.
5. `gatekeeper.verifyToken(token)` — a signature/expiry failure throws and **must** propagate. The
   guard never falls back to decoding an unverified payload. When dual-accept of legacy Loom tokens
   lands (`docs/features/0001-identity-dual-accept-auth.md`, NOT STARTED) it means verifying
   against a second secret here, never skipping verification.
6. `request.tenant = tenant` — this is what `@CurrentTenant()`
   (`src/common/auth/current-tenant.decorator.ts`) reads.
7. `userHasAppropriateAuthority(tenant, gate)` false → `ForbiddenException` (403).

**The guard authorizes by role only. It does not scope by tenant.** Passing `CODE_CU` proves the
caller is *a* customer, never that they own the row they asked for. Row ownership is each
repository's job, and it has been got wrong more than once — see `docs/KNOWN-GAPS.md` on the cart
read path and `cancelCustomOrder`.

## 4. Gating a new route

```ts
@Get("/get/customer/thing")
@UseGuards(RolesGuard)
@RequireGate(GateCode.CODE_CU)
async getThing(@CurrentTenant() tenant: AuthenticatedTenant) { … }
```

Then, in the controller's `*.controller.gates.spec.ts`, add the handler name to the `gated` map —
or to `publicRoutes` if it is deliberately open. Pick the gate by asking who Loom let in: find the
corresponding `@Gate(...)`/`GateCode` on the Java controller under
`loom/src/main/java/com/bloomscorp/loom/**/controller/`. Do not widen a gate to make a test pass.

Coverage as of this pass: **804 route decorators across 98 controllers, 678 carrying
`@RequireGate`** — so ~126 route handlers are public, some deliberately (health, IP location,
currency lookup, misc), some not audited. `RolesGuard` must also be applied with `@UseGuards`;
`@RequireGate` alone does nothing.

## 5. The gate-spec harness

`src/common/testing/gate-spec.ts` drives the **real** `RolesGuard` with the **real**
`GatekeeperService` against the **real** `@RequireGate` metadata — nothing about the gate is
mocked, and the tokens are genuinely signed and verified. For each gated handler it asserts:

- a token holding a role the gate accepts passes;
- a token holding a role the gate rejects raises `ForbiddenException`;
- no `Authorization` header raises `UnauthorizedException`.

`ROLES_FOR` in that file is the accept/reject role pair per gate. The expected gate is spelled out
in each spec rather than read back off the metadata **on purpose**: deleting or weakening a
`@RequireGate` then fails the spec instead of quietly opening the endpoint.

`ROLE_NONE` is `ROLE_ADMIN` — a real, verifiable role that no `LoomGatekeeper` gate accepts. It is
the negative case for `CODE_SUCUAR`, which every other role satisfies.

## Related

- `apps/api/docs/CROSS-MODULE-PORTS.md`
- `apps/api/docs/MODULES.md`
- `docs/TESTING.md` §6
- `docs/KNOWN-GAPS.md`
