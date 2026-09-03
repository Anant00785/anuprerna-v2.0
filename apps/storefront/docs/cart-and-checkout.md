# Cart and checkout

**Files:** `src/lib/guest-cart.ts`, `src/lib/cart/cart-helpers.ts`, `src/lib/checkout/checkout-calculations.ts`,
`src/lib/checkout-session.ts`, `src/app/api/cart/**`, `src/app/api/checkout/**`,
`src/lib/api/repositories/cart.repository.ts`, `src/stores/cart.store.ts`.

## Two carts

There is no single cart. Which one is live depends only on whether the `loom_jwt` cookie exists.

| | Guest cart | Account cart |
|---|---|---|
| Where it lives | `localStorage["anuprerna_guest_cart_v1"]`, browser only | Backend (`relational.cart_item`), reached through `/api/cart/*` |
| Shipping | Not priced — see below | Not priced — see below |
| Module | `lib/guest-cart.ts` | `app/api/cart/*` → `lib/loom/client` |
| Why | The account cart 401s an anonymous caller, so a guest would otherwise have no cart at all | — |
| Rendering | The cart page renders with **no fetch** — each stored line carries display fields (`name`, `image`, `slug`, `category`) alongside the replayable body | Fetched per request |

### Guest-cart line identity

`keyOf()` joins `productGroup | productId | orderType | unit | selectedFinishId | selectedFabricId |
selectedSizeOptionId | JSON(customSize)`. Consequences, all pinned in `src/lib/guest-cart.test.ts`:

- Re-adding an identical line **increments** its quantity; `+(a + b).toFixed(2)` keeps 0.1 + 0.1 + 0.1
  at `0.3` rather than accumulating float dust (quantities are fractional — fabric is sold by the metre).
- A customised variant (different finish, fabric, size or custom measurements) is a **separate line**.
- `IN_STOCK` and `PRE_ORDER` for the same product are separate lines.
- A re-add refreshes `price` and `makingCharge`, so a stale price cannot linger on a merged line.
- `updateQty(key, n)` with `n <= 0` removes the line. An unknown key is a no-op, not a clear.
- Corrupt or non-array `localStorage` content reads as an empty cart rather than throwing.

Every `localStorage`/`window` access is guarded by `typeof window`, so the module is SSR-safe.

### Merge on login

`AuthProvider.login()` (and the passwordless `loginWithCode`) calls `mergeGuestCartOnLogin()` after
the session cookie is set and before `refresh()`. It replays `bodies()` — the display fields
stripped, `fabricProductId` **or** `finishedProductId` set per `productGroup`, unset optional
selections omitted — one `POST /api/cart/add` per line, stamping current ad attribution onto each.

Failure behaviour: **a failed line does not abort the rest, and the merge never blocks a good login**
(the call site wraps it in its own try/catch as well). The guest cart is cleared *regardless* of the
outcome — failed lines are dropped rather than left to double-add on the next login. That is a
deliberate trade of "lost line" over "duplicate charge", and it means a merge during a backend
outage silently loses the cart. Recorded in `docs/KNOWN-GAPS.md`.

### Account cart routes

All four require the `loom_jwt` cookie **and** `isWrapperToken(token)`; a non-wrapper token gets
`401 { reauth: true }` so the UI can send the buyer back to sign-in rather than showing an empty cart.

| Route | Loom call | Notes |
|---|---|---|
| `GET /api/cart` | `getCart(token)` | No token → `{ entity: [], authenticated: false }` (200). Backend failure → `502` with empty lists. Normalises `cartItemList`/`entity` so both keys are always present. |
| `POST /api/cart/add` | `loomPost('/add/cart-item')` | Body forwarded as given. Failure → `502`. |
| `PATCH /api/cart/update` | `loomPatch('/update/cart-item')` | Rejects a non-finite `id` or a negative `quantity` with `400` before the call. |
| `POST /api/cart/remove` | `loomDelete('/delete/cart-item/<id>')` | `id` must be a positive integer — the write-guard also only permits `\d+` on that path. |

`cartRepository.getCart()` (`lib/api/repositories/cart.repository.ts`) is a *separate* read path used
by `stores/cart.store.ts`. It **swallows every failure, including a 401, and returns an empty cart**
— so an expired session looks like an empty cart to that store, not like an error. Pinned as
current behaviour in `cart.repository.test.ts` and `cart.store.test.ts`.

## Checkout

Four steps, all server-side, all under `src/app/api/checkout/`. Identity comes from one of two
httpOnly cookies and is **never** read off the request body.

| Cookie | Set by | Lifetime | Carries |
|---|---|---|---|
| `ap_guest_checkout` | `POST /api/auth/guest-checkout` | 6h | base64url `{ email, name }` |
| `ap_guest_order` | `POST /api/checkout/order` | 30d | the backend's guest order-status token |

`lib/checkout-session.ts` owns the codec. `decodeGuest()` returns `null` for a missing, corrupt or
non-JSON cookie, for a JSON array, and for an identity with no email; a non-string `name` is coerced
to `''` rather than forwarded. Pinned in `src/lib/checkout-session.test.ts`.

### Step 0 — identify (guest lane only)

`POST /api/auth/guest-checkout` creates **no account and no password**. It validates the address
against `EMAIL_RE` and requires a name — both properties of the *request* — and then answers `200`
with the same body for every syntactically valid address. It performs **no backend call at all**, so
it cannot be used as an account-existence oracle; `route.test.ts` enforces that by registering no MSW
handler (`onUnhandledRequest: "error"`). `GET` resumes an in-flight checkout from the cookie, `DELETE`
expires it.

### Step 1 — `POST /api/checkout/order`

- `401` when there is neither a session token nor a guest cookie.
- `payload.guest` from the request body is **deleted** and replaced with the cookie's identity; for a
  logged-in buyer no `guest` block is sent at all and identity comes from the bearer token. A browser
  that names a different buyer is ignored. Pinned in `route.test.ts`.
- On `data.guestToken`, sets `ap_guest_order` (httpOnly) and also returns the token once so the buyer
  gets a durable `/order-status/<token>` link.
- Backend `{ success: false }` → `400`, envelope relayed, **no cookie set**. `LoomError` → the
  backend's own status, with `exists` surfaced for the 409 "this email has an account" case. Anything
  else → `502`.

### Steps 2–3 — `payment-session` and `payment-callback`

Both authorise with the session token *or* the `X-Guest-Token` header taken from `ap_guest_order`;
`401` if neither exists. `payment-callback` forwards exactly five coerced fields
(`orderId`, `sessionId`, `providerOrderId`, `providerPaymentId`, `signature`) — the signature is
verified **server-side by the backend**, never here.

`/api/checkout/sandbox-gateway` stands in for the buyer paying on a real gateway modal; the backend
404s it whenever the active payment provider is not the sandbox one.

### Where the money is actually computed

**The backend is the authority.** `POST /checkout/order` recomputes the subtotal from line prices and
prices shipping from the chosen shipment record; a client-supplied total is discarded there. The
storefront's own money modules are for *display*.

There are **two** client-side shipping calculators, and only one is live:

| | `components/checkout/types.ts` → `shipmentCost()` | `lib/checkout/checkout-calculations.ts` → `calculateShippingCost()` |
|---|---|---|
| Used by | `CheckoutShell` (the live `/checkout`) and `OrderSummary` | `CheckoutShipToAndMethod`, `CheckoutShipmentTier`, `CheckoutPriceSummary` — **all inside `CheckoutPage.tsx`, which has zero importers** |
| Missing shipment | returns `0` | returns nothing — see below |
| Fabricates? | No. Reads `baseAmount ?? 0` etc. and never substitutes a rate | No, as of 2026-09-03 |

`calculateShippingCost` now takes a **required** `ShipmentOption`. It previously accepted `undefined`
and answered `baseAmount ?? (isDomestic ? 110 : 1500)` — inventing ₹110/₹1500 that flowed into the
order total and, through `CheckoutPage`'s Razorpay branch, into the amount actually charged. Making
the parameter required puts the guarantee in the type system: there is no way to ask for a cost you
have no quote for.

`calculateCheckoutPrices` still accepts an optional shipment, because a checkout page renders before
one is chosen. With no shipment it returns an explicit no-quote state:

```
{ hasShippingQuote: false, shippingCost: null, isShippingFree: false,
  total: null, advancePay: null, remainingBalance: null }
```

`null`, not `0` — "we have no quote" is not "free". Every figure downstream of shipping is withheld
with it, because an items-only "total" presented as the order total is the same defect in a quieter
form. `CheckoutPriceSummary` renders "No quote available" and a `—` total, and `handlePlaceOrder`
refuses to submit, sending the buyer back to the shipping step.

`calculateDeliveryTimestamp(undefined)` returns `undefined` rather than today's date — `daysOffset || 0`
rendered a missing estimate as "arriving today", a promise nobody made. `ShipmentOption.estimatedFromDay`
/ `estimatedToDay` are now optional and `checkoutRepository` leaves a missing estimate **absent**
instead of inventing 5/7 (domestic) or 7/12 (international) days, which `||` also applied to a
genuine same-day `0`.

Other display-only modules: `lib/cart/cart-helpers.ts` (stock, MOQ, quantity clamping, volume
discount — tested) and `lib/pdp/pricing-engine.ts` (**untested**, `any` throughout — see
`docs/KNOWN-GAPS.md`).

### The cart does not price shipping, and no longer pretends to

`Cart.estimatedShipping` and `Cart.total` are `number | null`. `mapLegacyCartToDomain` returns
**`null` for both on a non-empty cart** (`0`/`0` on an empty one, which genuinely costs nothing to
ship). Shipping needs a destination and a delivery method; the cart has neither.

It previously set `estimatedShipping = 150` — a flat, invented rate applied to every non-empty cart
regardless of quantity, destination or method — and folded it into `total`. The existing spec
asserted the `150`, i.e. it pinned the fabrication; it now asserts `null`.

`null`, not `0`, because `0` reads as "free". The cart drawer — the only cart UI, since `/cart`
redirects to `/checkout` — shows the **subtotal** and the line "Shipping calculated at checkout".
It never read `total` or `estimatedShipping`, so this was a zero-change fix on the UI side; the
nulls exist so nobody wires a fabricated total up later.

**Free-shipping thresholds are not enforced anywhere.** `DOMESTIC_FREE_SHIPPING_THRESHOLD = 2000` and
`INTERNATIONAL_FREE_SHIPPING_THRESHOLD = 50000` sat at the top of `checkout-calculations.ts` and were
read by nothing; a third, `FREE_SHIPPING_THRESHOLD = 2000`, sat unused in `legacy-cart.adapter.ts`.
All three are deleted. The only free shipping that exists is the `isExplicitFreeShipping` flag a
caller passes in, and a quote whose `baseAmount` is genuinely `0`.

**Loom has no free-shipping rule either** — checked directly against the Java source
(`loom/src/main/java/com/bloomscorp/loom`):

- `DISCOUNT_TYPE.FREE_SHIPPING` (`discount/orm/DISCOUNT_TYPE.java:13`) is an enum constant
  **referenced by no other Java file**. It is a discount *type* a coupon could carry, never a spend
  threshold, and nothing applies it.
- There is no threshold constant anywhere. The `min_order_value` columns in
  `tenant/nativequery/CustomerNativeQuery.java` are the **loyalty/wholesale programme** minimum,
  unrelated to shipping.

So the platform simply has no free-shipping rule, in either stack. Nobody should re-add one from
memory.

> **Bigger finding, same search: live Loom does not price shipping at all.**
> `Orders.shippingCost` (`order/orm/Orders.java:136`) is a plain stored `Double` written from the
> request; `OrdersValidator.java:69` only null-checks it, and the one line that would have defaulted
> it is commented out (`OrdersNormalizer.java:23`). `getBaseAmount`/`getAdditionalAmount`/
> `getBaseQuantity` appear only in `ShipmentValidator` (is it > 0?) and `ShipmentDAOController`
> (the CMS editing the row) — **no arithmetic on them exists anywhere in Loom**.
>
> The "the backend recomputes shipping from the shipment record and discards a client total" claim
> in `/api/checkout/order` is true of the **sandbox wrapper's** `CheckoutController`, which is what
> `LOOM_BASE_URL` resolves to today. It is **not** true of live Loom, which stores what the client
> sends. That makes the three shipping fabrications removed this week materially worse than
> "display only" against a live-Loom backend: the invented number would have been the charge.
> Recorded in `docs/KNOWN-GAPS.md`.

**There is no air-vs-road shipping multiplier** in this storefront — searched for one and the only
hits are forex rates and a quantity step. Shipping modes are rows in the `shipment` table carrying
their own `baseAmount` / `additionalAmount` / `baseQuantity`; "Express - By Air" is priced by its own
row, not by a factor applied to a road rate.

### `GET /api/checkout/shipment` — fails rather than quoting a price nobody produced

The route tries the local Nest instance, then Loom (`/get/shipment-list` authenticated,
`/checkout/shipment-list` for a guest). When **neither** can quote, it answers `502` with
`{ shipmentList: [], success: false, message }`, relaying the backend's own message where there is
one — the same pattern as `/api/profile/addresses`.

An empty list from a *reachable* backend is treated the same way: "no options" is not a state the
checkout may proceed past, because there is no shipping price to add.

Both `CheckoutShell` load paths already throw on `!res.ok` and set `loadError`, so a failed quote
renders the checkout's error panel with a Retry button rather than a total. No fallback quote is
served, labelled or otherwise.

> **This route used to invent money.** Until 2026-09-02 it answered `200 { success: true }` with a
> hardcoded `DEFAULT_SHIPMENT_LIST` — ₹200 express, ₹150 regular, ₹3000 international DDP — whenever
> both upstreams failed. The caller could not distinguish it from a live quote and the figure flowed
> into a real order total, so a buyer could be quoted and charged a price no backend ever produced.
> `src/app/api/checkout/shipment/route.test.ts` now asserts that none of those amounts or ids can
> appear on any failure path.

`checkoutRepository.getShipmentList()` (`lib/api/repositories/checkout.repository.ts`) carried the
same defect — a hardcoded two-option fallback (₹110 / ₹200) plus per-field defaults like
`Number(item.baseAmount) || 110`. It now **throws** instead of fabricating, and reads the money
fields with `??` semantics so a genuine `0` (free shipping) survives instead of being overwritten by
a default charge — the falsy-zero bug class already fixed twice in the cart adapters. Its only
caller, `components/checkout/CheckoutPage.tsx`, is dead code with zero importers (`/checkout` renders
`CheckoutShell`); it uses `Promise.allSettled` and simply shows no options on a rejection.

`GET /api/checkout/discount` degrades differently — an empty `discountList` with
`authenticated: false`, and a `200`. That is safe in the sense that no discount is applied, but it is
also indistinguishable from "you have no discounts". Unlike shipping, a missing discount cannot
overcharge, so it was left as is.
