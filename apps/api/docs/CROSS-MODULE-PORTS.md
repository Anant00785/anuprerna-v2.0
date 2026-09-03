# Cross-module ports

Verified against the code on `fix/flax-audit-remediation`, 2026-09-02.

## 1. The pattern

Loom's DAO controllers call each other directly — `CartItemDAOController` reaches into
`FabricProductDAOController`, `SizeProfileOptionDAOController` and so on. Porting that literally
would make every Nest module import every other one and produce circular dependencies within a
day.

Instead, a module that needs a neighbour declares a **port**: a `Symbol` token plus a narrow
interface, in its own `types/<domain>.types.ts`. It injects the interface and never learns which
class satisfies it. The *owning* module binds the token to something real in its `@Module`
`providers`, using `useFactory` / `useExisting` / `useClass`.

```ts
// cart/types/cart.types.ts — the consumer declares what it needs
export const TENANT_LOOKUP_PORT = Symbol("TENANT_LOOKUP_PORT");
export interface TenantLookupPort {
  retrieveUserByUid(uid: string): Promise<{ id: number; email: string } | null>;
}

// cart/cart.module.ts — bound to the real repository
{ provide: TENANT_LOOKUP_PORT, useFactory: (r: TenantLookupRepository) => ({ … }), inject: [TenantLookupRepository] }
```

The interface is deliberately narrow — `TenantLookupPort` has one method, not the whole tenant
DAO. That is what keeps the boundary honest.

## 2. Why the no-op `useValue` dummies were removed

During the migration most of these tokens were bound to placeholders of the form:

```ts
{ provide: FABRIC_PREVIEW_PORT, useValue: { retrieveEntity: async () => null } }
```

Nest resolved them, the app booted, the tests passed, and **the feature was silently missing.** A
cart item whose fabric preview came back `null` simply rendered without a product; a cart overview
whose tenant lookup returned `null` reported every tenant as absent. Nothing logged, nothing
threw, no test failed — the dummy was indistinguishable from a legitimately empty result.

That is the same failure mode as the fabricated fallbacks this codebase has repeatedly shipped: a
plausible-looking value standing in for an answer nobody computed. A missing dependency must be
**loud**. So:

- Every port that has a real implementation is now bound to it. `apps/api/docs/PORTS-STATUS.md`
  records what that pass covered.
- A port with no implementation yet is bound to something that **throws**
  `NotImplementedException` — `ZOHO_ADAPTER_PORT` on both product modules is the live example.
- The single accepted silent exception is `EMAIL_ENCODER_PORT` in `cart/cart.module.ts`: the legacy
  AES key derivation is not recoverable from the source available, and guessing it would garble
  data instead of failing. That exception is deliberate, documented, and allowlisted by name.

## 3. The guard test that prevents their return

`src/commerce/cross-module-ports.spec.ts` is the enforcement, in four layers:

| Layer | `describe` block | What it catches |
|---|---|---|
| Binding shape | *cross-module ports resolve to real providers* | A named port bound via `useValue` at all, or not bound. Asserts `provider.useValue` is `undefined` and one of `useFactory` / `useExisting` / `useClass` is present |
| Behaviour | *ports return real data* | The factory is actually invoked with a stub collaborator and the result checked — a port that resolves but ignores its dependency fails here |
| Loud failure | *unimplemented ports fail loudly* | `ZOHO_ADAPTER_PORT` must reject with `NotImplementedException`, so "not built" cannot decay into "returns null" |
| Repo-wide sweep | *no silent stub survives in any module* | Walks **every** `*.module.ts` under `src/` and fails on any `async () => null \| false \| []` provider, including in modules nobody thought to list. Block and line comments are stripped first so prose about past dummies does not trip it |

The sweep is the important one: the first three name specific tokens and go stale as modules are
added; the fourth catches the pattern anywhere, including in a module written next week. The
allowlist (`ALLOWED`) is two entries long and each is justified in this document — treat adding a
third as a decision, not a fix.

## 4. Adding a port

1. Declare the `Symbol` and the narrowest interface that does the job in the **consumer's**
   `types/` file.
2. Inject it with `@Inject(TOKEN)`.
3. Bind it in the **owner's** module with `useFactory`/`useExisting`.
4. If there is nothing to bind yet, bind an object whose methods `throw new NotImplementedException(…)`.
   Never `async () => null` — `cross-module-ports.spec.ts` will fail the build, which is the point.
5. Add the token to the relevant `expectRealProvider` list in `cross-module-ports.spec.ts`.

## Related

- `apps/api/docs/PORTS-STATUS.md` — the historical inventory of what was stubbed
- `docs/MODULE-MAP.md` §4 — dummy-bound port debt
- `docs/KNOWN-GAPS.md` — "Ports that now fail loudly instead of silently returning nothing"
