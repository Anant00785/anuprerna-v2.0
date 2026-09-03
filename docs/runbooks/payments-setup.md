# Runbook: Payments setup (Stripe + Razorpay)

> **Read this before enabling payments.** The payment path was hardened on the
> `fix/flax-audit-remediation` branch (audit findings C2-C5, M6): the Stripe webhook now verifies
> its signature, Razorpay client callbacks are HMAC-verified, and nothing invents a PAID
> transaction any more. Everything **fails closed** — a missing secret does not degrade to
> "accept anyway", it rejects the payment. That means the config below is not optional polish;
> without it, payments do not complete at all.

Code touched: `apps/api/src/commerce/payment/**`, `apps/api/src/main.ts`,
`apps/api/src/commerce/domain/notifications.controller.ts`.

---

## 1. Environment variables

All of these belong to **`apps/api`** (the NestJS API). None are read by the storefront or CMS.
They are declared in `apps/api/src/common/config/env.schema.ts` and placeholdered in
`apps/api/.env.example`. The API validates them at boot and refuses to start on a bad value.

| Variable | Required | Read by | If missing | Where to get it |
|---|---|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | **Yes, for Stripe** | `payment.controller.ts` (via `ConfigService`) | Every webhook is rejected `400 "Stripe webhook secret is not configured"`. Orders paid via Stripe are **never marked PAID**. | Stripe Dashboard -> Developers -> Webhooks -> your endpoint -> *Signing secret* (`whsec_...`). Per-endpoint: test and live have different values. |
| `STRIPE_KEY_SECRET` | **Yes, for Stripe** | `stripe-payment.service.ts` | Checkout session creation gets `401` from Stripe -> `Payment session creation error`, order marked failed, **no** fake checkout URL (that fallback was deleted). | Stripe Dashboard -> Developers -> API keys -> *Secret key* (`sk_test_...` / `sk_live_...`). |
| `RAZORPAY_KEY_ID` | **Yes, for Razorpay** | `razorpay-payment.service.ts` | `createSession` throws `Payment session creation error`; no Razorpay order is created. | Razorpay Dashboard -> Account & Settings -> API Keys -> *Key Id* (`rzp_test_...` / `rzp_live_...`). |
| `RAZORPAY_KEY_SECRET` | **Yes, for Razorpay** | `razorpay-payment.service.ts` | Session creation fails **and** every success callback is rejected with `TRANSACTION_SIGNATURE_VALIDATION_ERROR` (`ActionCode.UPDATE_FAILURE`), transaction never PAID. | Same screen; shown **once** at key generation. Regenerating invalidates the old pair. |
| `RAZORPAY_WEBHOOK_SECRET` | No — **currently unused** | nothing | Nothing. Declared in the env schema but read by zero lines of code. See §3. | Razorpay Dashboard -> Webhooks, only if webhooks are added later. |
| `STOREFRONT_URL` | No (defaults to `http://localhost:3000`) | `stripe-payment.service.ts` | Stripe success/cancel redirects point at localhost — shoppers land nowhere after paying. Set it in every deployed environment. | Your storefront origin, e.g. `https://anuprerna.com`. No trailing slash. |
| `ADMIN_EMAIL_ADDRESS` | No (defaults to `admin@example.com`) | `razorpay-payment.service.ts` | Payment-failure notifications CC a placeholder address. | Your ops inbox. |
| `PAYMENTS_LIVE_MODE` | No (defaults `false`) | `env.schema.ts` | Boot-time guard: an `sk_live_*` Stripe key is **refused** unless `PAYMENTS_LIVE_MODE=true` **and** `NODE_ENV=production`. Leave it false everywhere except production. | n/a |

`.env.example` was updated in this change to include `STOREFRONT_URL` and `ADMIN_EMAIL_ADDRESS`;
the other five were already present. Placeholders only — never commit a real value.

> ### Action required: rotate the Razorpay key
> `apps/api/.env` (local, untracked) currently holds a **real Razorpay key secret**. Rotate it in
> the Razorpay dashboard (Account & Settings -> API Keys -> Regenerate), then put the new pair only
> in the deployment secret store and in local `.env` files. Never let tests reach the live gateway:
> the payment specs stub `fetch` and set their own throwaway secret precisely because, as written
> before this change, they would have created **real Razorpay orders** using that key.

---

## 2. Stripe webhook

### Endpoint to register

```
POST https://<api-host>/checkout/stripe/webhook
```

No global route prefix is configured (`main.ts` has no `setGlobalPrefix`), so the path is exactly
that. The route carries **no `@RequireGate`**, i.e. it is public by design — the Stripe signature
*is* the authentication. Do not put it behind auth.

### Event types to subscribe

Exactly these four are dispatched by the handler; anything else is accepted, verified, and ignored:

- `checkout.session.completed` -> mark PAID, order to processing, clear cart
- `checkout.session.async_payment_succeeded` -> mark PAID, order to processing (cart **not** cleared)
- `checkout.session.async_payment_failed` -> mark FAILED
- `checkout.session.expired` -> mark FAILED

### Signing secret

Stripe Dashboard -> Developers -> Webhooks -> *Add endpoint* -> paste the URL, select the four
events -> copy the *Signing secret* into `STRIPE_WEBHOOK_SECRET`. Test mode and live mode issue
different secrets; each environment needs its own.

### What the API verifies

Ported from Loom's `StripeWebhookController` (`Webhook.constructEvent`), implemented with
`node:crypto` (the `stripe` npm package is not a dependency):

1. Parses the `Stripe-Signature` header into `t=<unix-seconds>` and `v1=<hex>`.
2. Computes `HMAC-SHA256(secret, "<t>.<raw request body>")`.
3. Constant-time compares against `v1`.
4. **Replay tolerance: 300 seconds.** A signature older or newer than 5 minutes is rejected — so
   the API host's clock must be in sync (NTP). Clock drift shows up as blanket 400s.

Any failure -> `400 BadRequest`, and **no** service call, therefore no DB write. The rejection path
runs before the handler's try/catch, so a verification failure can never be reported as success.

### Raw body requirement (important for infrastructure)

`main.ts` now bootstraps with `NestFactory.create(AppModule, { rawBody: true })`, and the handler
verifies against `req.rawBody` — the exact bytes Stripe sent. The HMAC covers those bytes, so:

- **Do not** put a proxy, CDN, WAF, or serverless wrapper in front of this route that re-serializes
  the body. Any middlebox that parses JSON and re-emits it (reordered keys, changed whitespace,
  stripped charset) produces a different byte string and every webhook will fail signature
  verification with a correct secret. Symptom: 100% 400s, secret verified as correct.
- Do not route Stripe through the storefront's `/api/backend/[...path]` proxy. Point Stripe at the
  API host directly.
- If a future global body-parser or interceptor is added, keep `rawBody: true` and keep this route
  out of any body-rewriting middleware.

### Testing locally with the Stripe CLI

```bash
# 1. forward events to the local API (prints a whsec_... to use as STRIPE_WEBHOOK_SECRET)
stripe listen --forward-to localhost:3000/checkout/stripe/webhook \
  --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired

# 2. put the printed secret in apps/api/.env, restart the API, then fire events
stripe trigger checkout.session.completed
stripe trigger checkout.session.async_payment_succeeded
stripe trigger checkout.session.expired
```

A `stripe trigger` event will be **verified but then rejected by the service** with
`Unauthorized payment transaction update request` unless a matching `stripe_transaction` row
exists (same `client_reference_id` order + same session id). That is correct behaviour: an unknown
session is never turned into a PAID row. For an end-to-end test, create a real checkout session
through the storefront first and pay it with card `4242 4242 4242 4242`.

---

## 3. Razorpay

**No webhook is required.** Definitively: nothing in the codebase reads `RAZORPAY_WEBHOOK_SECRET`,
and there is no Razorpay webhook route. Razorpay is **client-callback only** — the storefront's
checkout calls the API at:

- `POST /create/payment-session` — creates the Razorpay order (auth: customer JWT, gate `CODE_CU`)
- `POST|PATCH /update/payment/success` — reports the payment (auth: customer JWT, gate `CODE_CU`)
- `POST|PATCH /update/payment/failure` — reports the failure

Because the callback is client-supplied, the signature is the only thing that makes it
trustworthy. It is now verified server-side (it previously was not — audit C3).

### Config needed

`RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` only. The key id is also returned to the browser in the
session payload (that is public and expected); the secret never leaves the server.

### Signature contract (for integrators)

On `/update/payment/success` the body must carry `razorpayOrderId`, `transactionId`,
`transactionSignature` — these are Razorpay checkout's `razorpay_order_id`, `razorpay_payment_id`
and `razorpay_signature` respectively. The API recomputes:

```
expected = HMAC_SHA256(key = RAZORPAY_KEY_SECRET,
                       message = razorpay_order_id + "|" + razorpay_payment_id)
                       -> lowercase hex
```

and constant-time compares it with `razorpay_signature`. This is byte-for-byte what Razorpay's own
`Utils.verifyPaymentSignature` does, and what Loom's `RazorpayPaymentService.isValidSignature()`
did. A mismatch means the client tampered with the ids or the secret is wrong.

Rejection behaviour (no order is ever marked processing):

| Case | Transaction row | Returned |
|---|---|---|
| Signature valid | `PAID` | `UPDATE_SUCCESS` |
| Signature invalid | stays unpaid, `failedErrorCode = 101` (`INVALID_TRANSACTION_SIGNATURE`) | `UPDATE_FAILURE` |
| Secret missing / verification errored | stays unpaid, `failedErrorCode = 102` (`TRANSACTION_SIGNATURE_VALIDATION_ERROR`) | `UPDATE_FAILURE` |
| No matching transaction row | **nothing written** | `NO_ACTION` |

---

## 4. Verification checklist (sandbox)

1. [ ] `STRIPE_KEY_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
       `STOREFRONT_URL` set; `PAYMENTS_LIVE_MODE` unset/false; API boots without config errors.
2. [ ] `cd apps/api && pnpm vitest run src/commerce/payment` — 66 tests green. This is the fastest
       proof the verification logic itself is intact.
3. [ ] **Stripe happy path:** create a checkout session from the storefront, pay with
       `4242 4242 4242 4242`. Confirm a `stripe_transaction` row goes `CREATED` -> `PAID`, with
       `webhook_received = true` and `webhook_event_type = 'checkout.session.completed'`.
4. [ ] **Stripe bad signature rejected** — the important one:
       ```bash
       curl -i -X POST http://localhost:3000/checkout/stripe/webhook \
         -H 'Content-Type: application/json' \
         -H 'Stripe-Signature: t=1700000000,v1=deadbeef' \
         -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_x","client_reference_id":"1"}}}'
       ```
       Expect **HTTP 400**. Repeat with the header removed entirely, and with the header omitted
       but `STRIPE_WEBHOOK_SECRET` unset — all three must be 400. Then confirm **no** row was
       created or modified in `stripe_transaction`. If any of these returns 200, stop and escalate.
5. [ ] **Razorpay happy path:** pay a test order end to end; confirm the `razorpay_transaction` row
       is `PAID` and carries the real `pay_...` id and signature.
6. [ ] **Razorpay bad signature rejected:** re-post the same `/update/payment/success` body with one
       character changed in `transactionSignature`. Expect a failure response, the row **not** PAID,
       and `failed_error_code = 101`.
7. [ ] Confirm no row anywhere carries a `pay_mock_` / `order_mock_` / `cs_test_<timestamp>` id
       created *after* this deploy (see §5).

---

## 5. Data-integrity investigation (production)

The deleted code wrote fabricated PAID transactions and silently attached unresolvable payments to
hardcoded order **278006**. Those rows may already exist in production.

> **These queries are READ-ONLY investigation. Do not delete, update, or "clean up" anything
> based on them without finance sign-off** — some matching rows may correspond to real money that
> genuinely moved, and deleting them destroys the audit trail.

```sql
-- 1. Fabricated Razorpay transactions (invented by the deleted C4 branch).
SELECT id, loom_order_id, razorpay_order_id, transaction_id, amount, status, created_at
FROM razorpay_transaction
WHERE razorpay_order_id LIKE 'order\_mock\_%' ESCAPE '\'
   OR transaction_id   LIKE 'pay\_mock\_%'   ESCAPE '\'
ORDER BY created_at DESC;

-- 2. The C4 signature: PAID at the hardcoded default amount of 1000.
SELECT id, loom_order_id, razorpay_order_id, transaction_id, amount, status, created_at
FROM razorpay_transaction
WHERE status = 'PAID' AND amount = 1000
ORDER BY created_at DESC;

-- 3. Everything that landed on the hardcoded fallback order (C5).
SELECT 'razorpay' AS src, id, loom_order_id, status, amount, created_at
  FROM razorpay_transaction WHERE loom_order_id = 278006
UNION ALL
SELECT 'stripe', id, loom_order_id, status, amount, created_at
  FROM stripe_transaction   WHERE loom_order_id = 278006
ORDER BY created_at DESC;

-- 4. Simulated Stripe sessions (the deleted local-fallback session ids / "simulated" redirect).
SELECT id, loom_order_id, stripe_session_id, stripe_payment_intent_id, status, checkout_url, created_at
FROM stripe_transaction
WHERE checkout_url LIKE '%stripe_simulated%'
   OR stripe_payment_intent_id LIKE 'pi\_test\_1%' ESCAPE '\'
ORDER BY created_at DESC;
```

**If rows come back:**
1. Export them (CSV) before anyone touches the tables.
2. Reconcile each against the gateway: search the `razorpay_order_id` / `stripe_session_id` in the
   Razorpay or Stripe dashboard. A row with no counterpart at the gateway is a payment that never
   happened.
3. For unmatched rows, check the linked order's fulfilment state — the risk is goods dispatched
   against a payment that does not exist.
4. Only then decide on correction, with finance, as a separate written change.

Order 278006 specifically: verify whether it is a real customer order that has been receiving other
customers' payment records attributed to it.

> Some `278006` occurrences remain in the repo as **Swagger examples only**
> (`notifications.controller.ts` `@ApiProperty` / `@ApiParam`) plus one fabricated read-only
> WhatsApp-history fallback row at `notifications.controller.ts:369`. Those write nothing. The
> fallback *behaviour* (`body.orderId || 278006`) is gone — a missing order id is now a `400`.

---

## 6. Deliberate divergences from Loom

Do not "fix" these back:

- **Invalid Razorpay signature returns `UPDATE_FAILURE`, not Loom's `UPDATE_SUCCESS`.** Loom
  returned UPDATE_SUCCESS to mean "we successfully recorded the failure"; this API's controller maps
  any positive action code to the message *"Transaction updated successfully."*, which would tell a
  customer their forged payment went through. Failure codes (101/102) are still persisted exactly as
  Loom did.
- **Order failure reason codes are renumbered** (`OrderFailureCode` in `payment/types/payment.types.ts`):
  session-log failure `1`, transaction-success-update failure `2`, payment failure `3` — Loom used
  2/3/6. The values are pinned by the existing specs; only their distinctness matters.
- **No `PRE_ORDER` filter on pre-order confirmation emails.** Loom filtered order items to
  `ORDER_TYPE.PRE_ORDER`; this port sends all order items, per the existing spec.
- **Stripe signature verification is hand-rolled** on `node:crypto` rather than the `stripe` SDK.
  The SDK is not a dependency and this was the only thing it would have been used for. The scheme
  (`v1`, `t.payload`, 300s tolerance) is Stripe's documented one.
- **Order status is written to `order_item`**, not `orders` — this schema has no `orders.status`
  column. The previous port wrote `orders.deleted = false` as a stand-in, which did nothing.

## See also
- `docs/runbooks/cutover.md` — keep both gateways in test mode until cutover is signed off.
- `FLAX-TEST-PR10-AUDIT.md` — findings C2-C5, M6, which this change closes.
