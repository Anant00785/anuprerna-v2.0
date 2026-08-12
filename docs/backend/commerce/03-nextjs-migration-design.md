# Core Commerce Module — Next.js Migration Design

> **Status: partly superseded (2026-08-12).** This design was written before the backend was
> built. `apps/api` now exists with 116 controllers and a structure that differs from the proposal
> below. For the delivered structure see `docs/MODULE-MAP.md`. Kept for its reasoning and its
> flagged open questions.

Target architecture reference: `apps/api` (loom, NestJS, long-lived container) for server logic, with `packages/types` (Zod schemas + OpenAPI client) as the shared contract layer. Although the target tree comments show commerce living inside the **NestJS API app** (`apps/api/src/commerce/`), not the Next.js storefront/CMS apps — the migration below targets that NestJS location, using Next.js **only** where the target tree indicates (server actions inside `apps/storefront`/`apps/cms` that call the API). This distinction matters: **do not fuse REST-route logic into Next.js route handlers unless the team confirms commerce should move into a Next.js server** — the target repo structure you supplied places it in NestJS.

> If your team's actual intent is a full Next.js-only backend (App Router route handlers instead of NestJS controllers), the folder structure below still applies almost 1:1 — swap `*.controller.ts` (NestJS) for `route.ts` (Next.js Route Handlers) as noted inline. Flagged explicitly rather than guessed silently.

---

## 1. Folder Structure

```
apps/api/src/commerce/
├── cart/
│   ├── cart.controller.ts          # REST surface — mirrors CartController.java routes 1:1
│   ├── cart.service.ts             # business logic — mirrors CartItemDAOController.java
│   ├── cart.repository.ts          # Prisma/DB access only
│   ├── dto/
│   │   ├── create-cart-item.dto.ts
│   │   ├── update-cart-item.dto.ts
│   │   └── cart-item-response.dto.ts
│   ├── cart.validation.ts          # Zod schemas mirroring CartItemValidator rules
│   └── cart.module.ts
├── catalog/
│   ├── catalog.controller.ts
│   ├── catalog-item.controller.ts
│   ├── catalog-item-media.controller.ts
│   ├── catalog-pdf.controller.ts
│   ├── catalog.service.ts
│   ├── catalog-item.service.ts
│   ├── catalog-item-media.service.ts
│   ├── catalog-pdf.service.ts       # async generation + status polling (queue-backed)
│   ├── catalog.repository.ts
│   ├── dto/
│   │   ├── catalog.dto.ts
│   │   ├── catalog-item-upsert.dto.ts   # mirrors CatalogItemUpsertPayload
│   │   └── catalog-pdf.dto.ts
│   ├── catalog.validation.ts
│   ├── catalog.authorization.ts     # centralizes the Catalog→Artisan ownership-chain check (Risk #8)
│   └── catalog.module.ts
├── orders/
│   ├── orders.controller.ts
│   ├── order-fulfillment.controller.ts
│   ├── order-ready.controller.ts
│   ├── order-preview.controller.ts
│   ├── orders.service.ts            # mirrors OrderDAOController — addOrder, cancel, status transitions
│   ├── order-fulfillment.service.ts
│   ├── order-ready.service.ts
│   ├── order-attribution.service.ts # extracted: promoteAdAttribution logic
│   ├── orders.repository.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   ├── order-shipment-update.dto.ts
│   │   ├── order-global-note-update.dto.ts
│   │   ├── order-cancellation.dto.ts
│   │   ├── order-preparation-request.dto.ts
│   │   └── order-response.dto.ts
│   ├── orders.validation.ts
│   └── orders.module.ts
├── custom-orders/
│   ├── custom-orders.controller.ts
│   ├── custom-order-fulfillment.controller.ts
│   ├── custom-order-ready.controller.ts
│   ├── custom-order-preview.controller.ts
│   ├── custom-order-adjustment.controller.ts
│   ├── custom-orders.service.ts
│   ├── custom-order-fulfillment.service.ts
│   ├── custom-order-ready.service.ts
│   ├── custom-order-adjustment.service.ts
│   ├── custom-orders.repository.ts
│   ├── dto/
│   │   ├── create-custom-order.dto.ts
│   │   ├── custom-order-item-update.dto.ts
│   │   ├── custom-order-adjustment.dto.ts
│   │   └── custom-order-response.dto.ts
│   ├── custom-orders.validation.ts
│   └── custom-orders.module.ts
├── payments/
│   ├── razorpay/
│   │   ├── razorpay-payment.controller.ts
│   │   ├── razorpay-payment.service.ts
│   │   ├── razorpay-payment.repository.ts
│   │   ├── dto/ (session, success, failure, update)
│   │   └── razorpay.validation.ts
│   ├── stripe/
│   │   ├── stripe-payment.controller.ts
│   │   ├── stripe-webhook.controller.ts   # unauthenticated route, IP-allowlist + signature verified
│   │   ├── stripe-payment.service.ts
│   │   ├── stripe-webhook.service.ts      # mirrors StripeTransactionDAOController webhook handlers
│   │   ├── stripe-payment.repository.ts
│   │   ├── dto/stripe-payment-order.dto.ts
│   │   └── stripe.validation.ts
│   └── payments.module.ts
└── shared/
    ├── contracts/                   # types shared with packages/types (Zod schemas → OpenAPI)
    ├── auth/                        # re-exports from Identity module — CODE_SU/CU/AR/SUCU equivalents
    └── product-catalog-client.ts    # read-only interface into Product/Profile modules (Risk #1)
```

**Next.js consumer side** (`apps/storefront`, `apps/cms`) gets a thin Server Actions layer that calls the above API, not duplicate business logic:
```
apps/storefront/app/(shop)/cart/actions.ts        # addCartItem, updateCartItem, deleteCartItem — calls commerce API via packages/types client
apps/storefront/app/(shop)/checkout/actions.ts    # createOrder, createPaymentSession
apps/cms/app/orders/actions.ts                    # superuser order/fulfillment/ready actions
```

---

## 2. Route Handlers (NestJS controller signatures, 1:1 with source)

Example — Cart (full mapping of §A in the API doc):

```ts
// cart.controller.ts
@Controller('cart-item')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('table-explorer/data')      // was GET /get/table-explorer/data/cart-item
  @Roles('SU')
  getCartItemData(@Query('page') page: number, @Query('size') size: number) { ... }

  @Get('table-explorer/data/:id')  // was GET /get/table-explorer/data/cart-item/{id}
  @Roles('SU')
  getCartItemById(@Param('id') id: number) { ... }

  @Get('list')                     // was GET /get/cart-item/list
  @Roles('CU')
  getCartItemList(@CurrentTenant() tenant: Tenant) { ... }

  @Get('tenant/:uid')              // was GET /get/tenant/cart-item/list/{uid}
  @Roles('SU')
  getCartItemListUsingUid(@Param('uid') uid: string) { ... }

  @Get('tenant/overview')          // was GET /get/tenant/cart-item/list
  @Roles('SU')
  getCartItemListForTenants() { ... }

  @Post()                          // was POST /add/cart-item
  @Roles('CU')
  addCartItem(@CurrentTenant() tenant: Tenant, @Body() dto: CreateCartItemDto) { ... }

  @Patch()                         // was PATCH /update/cart-item
  @Roles('CU')
  updateCartItem(@Body() dto: UpdateCartItemDto) { ... }

  @Delete(':cartItemId')           // was DELETE /delete/cart-item/{cartItemId}
  @Roles('CU')
  deleteCartItem(@Param('cartItemId') id: number) { ... }

  @Delete()                        // was DELETE /delete/all-cart-item
  @Roles('CU')
  deleteAllCartItem(@CurrentTenant() tenant: Tenant) { ... }
}
```

> **Route path decision required from the team**: the source uses flat, verb-prefixed paths (`/add/cart-item`, `/get/cart-item/list`) rather than REST-conventional paths. Two options: (a) preserve exact legacy paths behind a compatibility layer so existing mobile/web clients keep working during cutover, or (b) introduce clean REST paths (`POST /cart-items`, `GET /cart-items/me`) and version the API. **This is a technical/business decision, not inferred here — flagged for the team to decide per the Migration Checklist.** The example above shows option (b); Task-by-task checklist items call this out explicitly.

Every other controller (Catalog, Order, CustomOrder, Payment) follows the identical pattern: each row in `02-api-documentation.md` becomes one handler method with the same auth role, same request/response shape, same delegation to a service method of matching name.

---

## 3. Server Actions (Next.js consumer side, storefront/CMS only)

Server Actions are used **only** for customer-facing mutations initiated from the storefront (not for admin/superuser CRUD, which stays behind CMS forms calling the API directly via typed client). Example:

```ts
// apps/storefront/app/(shop)/cart/actions.ts
'use server';

import { commerceClient } from '@/lib/commerce-client'; // generated from packages/types OpenAPI client
import { CreateCartItemSchema } from '@loom/types/cart';

export async function addCartItem(formData: FormData) {
  const parsed = CreateCartItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten() };

  const result = await commerceClient.cart.addCartItem(parsed.data);
  revalidatePath('/cart');
  return result;
}
```

Server Actions needed (customer-facing only, matching `CODE_CU` endpoints):
- Cart: `addCartItem`, `updateCartItem`, `deleteCartItem`, `deleteAllCartItem`, `getMyCart` (read via RSC, not action)
- Checkout/Order: `createOrder` (C3), `cancelOrder` (C7, also usable by CU), `getMyOrders`, `getMyOrder`
- Payment: `createStripePaymentSession` (E8), `createRazorpayPaymentSession` (E1), `reportRazorpaySuccess`/`reportRazorpayFailure` (E2/E3) — **flag E2/E3 for the security review noted in Risk #4 before wiring them as trusted actions**

Superuser/artisan operations (Catalog CRUD, Order/CustomOrder fulfillment & ready, adjustments, table-explorer) are **not** Server Actions — they belong in the CMS app as typed API-client calls from admin forms/tables, preserving the existing superuser-only trust boundary.

---

## 4. Service Layer (business logic — mirrors `*DAOController.java` methods that are NOT pure persistence)

| Service | Key methods (verified source method → target) |
|---|---|
| `CartService` | `retrieveCartItems(tenant)` (enriches via `ProductCatalogClient`), `addCartItem`, `updateCartItem`, `deleteCartItem`, `deleteAllCartItem`, `retrieveTenantWiseCartOverview` |
| `OrdersService` | `addOrder` — **must reproduce the exact 8-step sequence verified in §"addOrder business logic" of the API doc**: tenant/timestamps → per-item status/customization/delivery-date prep → JSON-serialize `shippingMode`/`address` → forex snapshot → `promoteAdAttribution` (extracted to `OrderAttributionService`) → persist → fire impact-refresh event → return id. `updateOrderStatusToCancelled`, `updateOrderShipment`/`updateOrderShipmentMetadata`, `updateOrderGlobalNote`, `sendEmailForPreparedOrder`, `sendOrderConfirmationEmail`, `getProcessingOrderStatus`, `retrieveOrderListByTenant`/`retrieveAllOrderListByTenant` |
| `OrderAttributionService` | `promoteAdAttribution(tenant, order)` — last-click-wins over cart items, click-id preferred over UTM-only, extracted as its own service for testability (source has it private inside `OrderDAOController`; no behavior change, pure code organization) |
| `CustomOrdersService` | `addOrder`, `updateOrder`, `updateCustomOrderGlobalNote`, `updateOrderShipment`, `updateCustomOrderInfo`, `updateOrderStatusToCancelled`, `updateCustomOrderItem`, `deleteCustomOrderItem`, `addNewOrderItems` |
| `CustomOrderAdjustmentService` | `addAdjustment`, `updateAdjustment`, `deleteAdjustment` |
| `CatalogService` | `retrieveCatalog(By)Id`, `retrieveCatalogList(ForArtisan)`, `createCatalog`/`createArtisanCatalog` (force-assign artisan id), `updateCatalog`/`updateArtisanCatalog` (ownership re-check), `deleteCatalog`/`deleteArtisanCatalog` |
| `CatalogItemService` | mirrors Catalog with the dual-ownership-check update path (Risk in module analysis) |
| `CatalogPdfService` | `enqueueGeneration`, `getStatus`, `waitForCompletion` (replace Java `DeferredResult` long-poll with either (a) a literal long-poll HTTP handler with a timeout, or (b) SSE/WebSocket push — **recommend (b)** for the Next.js target, flagged as a technical adaptation, not a behavior change to the underlying async-generation contract) |
| `RazorpayPaymentService` | `createSession`, `updateTransactionSuccess`, `updateTransactionFailure`, `updateTransaction` — **verify and preserve whatever server-side signature/amount check currently guards `updateTransactionSuccess`** before porting (Risk #4) |
| `StripePaymentService` | `createPaymentSession` |
| `StripeWebhookService` | `handlePaymentSuccess`, `handlePaymentFailure`, `handlePaymentIntentCreated`, `handlePaymentIntentFailed`, `handlePaymentIntentCancelled` — **preserve the exact "malformed event still returns 200" behavior noted in the API doc unless the team signs off on fixing it** |

---

## 5. Repository Layer (pure persistence — mirrors the CRUD half of `*DAOController.java`)

One repository per aggregate root, matching Prisma models 1:1 with the verified entity field lists in `02-api-documentation.md`:
`CartItemRepository`, `CatalogRepository`, `CatalogItemRepository`, `CatalogItemMediaRepository`, `CatalogPdfDownloadHistoryRepository`, `OrdersRepository`, `OrderItemRepository`, `OrderFulfillmentRepository`, `OrderReadyRepository`, `OrdersPreviewRepository` (read-only projection — consider a DB view instead of a materialized table if not already one; **verify against source before changing**, defaulting to "keep as a table" if unconfirmed), `CustomOrderRepository` (+ item/fulfillment/ready/adjustment/preview siblings), `RazorpayTransactionRepository`, `StripeTransactionRepository`.

Each repository exposes only data-access methods (`findById`, `findByTenant`, `create`, `update`, `softDelete`, `paginate`) — no business rules, mirroring the target architecture's stated separation (which the source codebase does not currently have — this is a genuine improvement introduced by the migration, not a reflection of existing code).

---

## 6. Validation Layer (Zod, mirrors verified validator rules exactly)

```ts
// cart.validation.ts
export const CreateCartItemSchema = z.object({
  productGroup: z.string(),
  fabricProductId: z.number().nullable().optional(),
  finishedProductId: z.number().nullable().optional(),
  selectedFabricId: z.number().optional(),
  selectedSizeOptionId: z.number().optional(),
  selectedFinishId: z.string().optional(),
  customSize: z.any().optional(),
  unit: z.nativeEnum(UnitEnum),
  orderType: z.nativeEnum(OrderType),
  quantity: z.number().min(0.5),
  makingCharge: z.number().default(0.0),
}).superRefine((data, ctx) => {
  if ((data.productGroup === 'fabric' || data.productGroup === 'swatch') && !data.fabricProductId) {
    ctx.addIssue({ code: 'custom', message: 'fabricProductId required for fabric/swatch', path: ['fabricProductId'] });
  }
  if (data.productGroup === 'finished' && !data.finishedProductId) {
    ctx.addIssue({ code: 'custom', message: 'finishedProductId required for finished', path: ['finishedProductId'] });
  }
});
```

```ts
// orders.validation.ts
export const CreateOrderSchema = z.object({
  shippingCost: z.number(),
  total: z.number(),
  advancePay: z.number(),
  remainingPay: z.number(),
  autoDiscount: z.number(),
  couponDiscount: z.number(),
  subTotal: z.number(),
  currency: z.string().length(3),
  address: OrderAddressSchema,      // validated by shared Address module schema — do not duplicate
  orderItems: z.array(OrderItemSchema).nonempty(),
});
```

```ts
// razorpay.validation.ts
// Source validator is a stub (`return true`) — preserve exactly:
export const RazorpayPaymentRequestSchema = z.object({ /* fields typed but unconstrained */ }).passthrough();
```

```ts
// stripe.validation.ts
export const StripePaymentOrderSchema = z.object({
  customerEmail: z.string().min(5).max(255),
  currency: z.nativeEnum(CurrencyEnum),
  totalAmount: z.number().positive(),
  loomOrderId: z.number().positive(),
  paymentType: z.enum(['advance', 'remaining']),
});
```

```ts
// custom-orders.validation.ts
// Source validator only checks order items, no order-level fields — preserve exactly:
export const CreateCustomOrderSchema = z.object({
  orderItems: z.array(CustomOrderItemSchema).nonempty(),
}).passthrough();
```

**Do not add stricter validation than what's documented above** — every schema must match verified source behavior exactly (including the intentionally weak Razorpay and CustomOrder validators), per your explicit instruction to preserve existing business logic.

---

## 7. Database Models (Prisma schema sketch, field-verified)

```prisma
model CartItem {
  id                   BigInt    @id @default(autoincrement())
  tenantId             BigInt
  fabricProductId      BigInt?
  finishedProductId    BigInt?
  selectedFabricId     BigInt?
  selectedSizeOptionId BigInt?
  selectedFinishId     String?
  customSize           Json?
  productGroup         String?
  orderType            OrderType
  quantity             Float
  unit                 UnitEnum  @default(METER)
  makingCharge         Float     @default(0.00)
  lastUpdatedAt        BigInt?
  clickId              String?
  clickIdType          String?
  clickCapturedAt       BigInt?
  utmSource            String?
  utmMedium            String?
  utmCampaign          String?
  tenant               LoomTenant @relation(fields: [tenantId], references: [id])
  @@map("cart_item")
}

model Orders {
  id                  BigInt   @id @default(autoincrement())
  tenantId            BigInt
  subTotal            Float
  shippingMode        Json
  shippingCost        Float
  total               Float
  currency            String
  advancePay          Float
  remainingPay        Float
  autoDiscount        Float
  couponApplied       Boolean  @default(false)
  couponCode          String   @default("")
  couponDiscount      Float
  couponDiscountAmount Float   @default(0)
  address             Json
  note                String   @default("")
  globalNote          String   @default("")
  gift                Boolean  @default(false)
  createdAt           BigInt
  failedErrorCode     Int      @default(-1)
  failedErrorMessage  String   @default("")
  cancelledAt         BigInt?
  cancellationReason  String?
  deleted             Boolean  @default(false)
  zohoOrderId         String   @default("")
  loyaltyOrder        Boolean  @default(false)
  loyaltyDiscount     Float    @default(0)
  loyaltyDiscountAmount Float  @default(0)
  exchangeRate        Decimal?
  paymentMode         PaymentMode @default(RAZORPAY)
  stripeCheckoutUrl   String   @default("")
  clickId             String?
  clickIdType         String?
  clickCapturedAt     BigInt?
  utmSource           String?
  utmMedium           String?
  utmCampaign         String?
  tenant              LoomTenant       @relation(fields: [tenantId], references: [id])
  orderItems          OrderItem[]
  razorpayTransactions RazorpayTransaction[]
  @@map("orders")
}

enum OrderStatus { INITIATED PROCESSING CANCELLED IN_TRANSIT PARTIALLY_DISPATCHED DISPATCHED DELIVERED FAILED }
enum PaymentStatus { PENDING PREPAID PAID FAILED }
enum PaymentMode { RAZORPAY STRIPE BANK COD }
enum TransactionStatus { CREATED PAID FAILED }
enum OrderType { IN_STOCK MADE_TO_ORDER PRE_ORDER }
```

*(Remaining models — `Catalog`, `CatalogItem`, `CatalogItemMedia`, `CatalogPdfDownloadHistory`, `OrderItem`, `OrderFulfillment`/`OrderItemFulfillment`, `OrderReady`/`OrderItemReady`, `CustomOrder` family, `RazorpayTransaction`, `StripeTransaction` — follow the same field-for-field mapping from the verified lists in `02-api-documentation.md` §A–E; omitted here for brevity but must be completed with the same rigor before implementation, using the field lists already captured rather than re-deriving them.)*

---

## 8. Shared Types (`packages/types`)

- Zod schemas above double as the runtime validators and (via `zod-to-openapi` or equivalent) the source for the generated OpenAPI client consumed by storefront/CMS Server Actions and admin API calls — closing exactly the "364 untyped reads" problem your target architecture note calls out.
- Enums (`OrderStatus`, `PaymentStatus`, `PaymentMode`, `TransactionStatus`, `OrderType`, `UnitEnum` — the last one is defined in the Product module, imported not redefined) exported once from `packages/types/enums.ts`, consumed by both the Prisma schema (`prisma-zod` or manual sync) and the frontend.

---

## 9. Error Handling

- Map the source's implicit "empty entity" / "`NO_ACTION`" responses (used throughout Catalog's ownership checks, e.g. B7, B9, B11, B19, B21, B25) to **explicit typed results**, not thrown exceptions — the source treats "not found" and "not owned" as soft, message-carrying non-errors, not 404s. Preserve this: return `{ success: false, message: "Catalog not found" }` with **200** or **404** consistently (pick one per team convention, but apply it uniformly — the source is inconsistent about status codes since everything rides inside the `RainTreeResponse` envelope; recommend standardizing on real HTTP status codes as a deliberate, called-out improvement).
- Catalog PDF domain exceptions → preserve the exact 4-way mapping documented in §B.4 of the API doc (`unauthorized` / `forbidden` / `not found` / `invalid` / `not found` / `internal error`) as a NestJS exception filter.
- Stripe webhook → preserve exact behavior: signature failure → `400` + message; unhandled event type → `200` + `"Unhandled event type: {type}"`; malformed payload for a handled event type → **the source's `200 "Success"` fallthrough** (flagged in the API doc as looking like a bug — carry it forward unless the team explicitly approves a fix, tracked as its own checklist item).

## 10. Authentication Integration

- Reuse the already-migrated Identity module's session/token verification middleware; map `CODE_SU`/`CODE_CU`/`CODE_AR`/`CODE_SUCU` to NestJS route guards/decorators (`@Roles('SUPERUSER')`, `@Roles('CUSTOMER')`, `@Roles('ARTISAN')`, `@Roles('SUPERUSER','CUSTOMER')`).
- Tenant resolution: source resolves the acting tenant from the bearer token on nearly every customer-scoped call (`getAuthorityResolver().resolveUserInformationFromAuthorizationToken(...)`) — replace with a `@CurrentTenant()` param decorator backed by the Identity module's session, not re-implemented here.
- Artisan ownership-chain checks (Catalog family) → implement as a single reusable guard/interceptor (`CatalogOwnershipGuard`) rather than repeating the walk in every handler, per Risk #8 in the module analysis — this centralizes but does not change the check's outcome.
- Stripe webhook stays outside the standard auth guard entirely — its own IP-allowlist + HMAC-signature middleware, as documented.
