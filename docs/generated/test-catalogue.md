# Test catalogue

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. Every test in the repository and the behaviour it protects.

**1770 tests across 305 files.**

- `apps/api` — 249 files, 1161 tests
- `apps/cms` — 17 files, 212 tests
- `apps/storefront` — 38 files, 395 tests
- `packages/types` — 1 files, 2 tests

## apps/api

### `apps/api/src/auth/controller/auth.controller.gates.spec.ts` — 0

### `apps/api/src/auth/controller/loom-legacy-auth.controller.gates.spec.ts` — 0

### `apps/api/src/auth/service/auth0-validation.service.spec.ts` — 4
- THROWS rather than answering false when Auth0 is not configured
- rejects a malformed token without reaching the network
- rejects an empty token/email pair before any JWKS fetch
- getUserFromToken returns the 

### `apps/api/src/auth/service/gatekeeper.pepper.int.spec.ts` — 1
- stored password hashes on real accounts are bcrypt cost-11, and verifyPassword runs against one without throwing

### `apps/api/src/auth/service/gatekeeper.service.spec.ts` — 18
- hashes then verifies the same password round-trip
- produces a bcrypt hash at cost factor 11
- rejects the wrong password
- rejects a correct password hashed under a different pepper
- verifies a known-good bcrypt(pepper + password) vector — the exact composition production hashes use
- returns false, not throws, for an empty stored hash
- signs then verifies a token round-trip, preserving the claim shape RolesGuard depends on
- verifyToken is synchronous — RolesGuard assigns its result directly, no await
- rejects an expired token
- rejects a token with a tampered signature
- rejects a token with a tampered payload (signature no longer matches)
- rejects a token signed with a different secret
- rejects a malformed token
- allows [${roles.join(
- denies [${roles.join(
- DENIES a plain ROLE_CUSTOMER token at a super-user gate
- fails closed on an unknown gate code
- fails closed when the roles claim is missing or not an array

### `apps/api/src/auth/service/password-reset.service.spec.ts` — 14
- answers identically for an unknown email — no membership oracle
- writes the token HASHED, never in plaintext
- stamps an expiry ~30 minutes out
- issues no token at all for an unknown email
- rejects an empty email
- hashes the new password with the gatekeeper (bcrypt(pepper+password))
- consumes the token — a replayed link cannot reset twice
- refuses when the token was already consumed by a concurrent request
- refuses an expired token and changes nothing
- refuses an unknown token
- gives one message for unknown, used and expired — no oracle
- enforces a minimum password length before touching anything
- requires both a token and a password
- looks the token up by its HASH, not the raw value

### `apps/api/src/commerce/address/address.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/artisanpayment/controller/artisanpayment.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/cart/controller/cart.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/cart/mapper/cart.mapper.spec.ts` — 6
- maps a fully-populated input onto insert values, stringifying quantity/makingCharge
- defaults customSize to {} when absent
- defaults makingCharge to \
- defaults click/utm attribution fields to null when undefined
- does not set fabricProductId/finishedProductId/selectedFabricId/selectedSizeOptionId — those are attached separately by CartService after preview lookups
- writes only quantity and lastUpdatedAt (source quirk #1: every other field is intentionally left untouched on update)

### `apps/api/src/commerce/cart/repository/cart-insert-integrity.spec.ts` — 7
- REJECTS an unknown tenant instead of inventing a guest account
- REJECTS tenantId 0 rather than treating it as a new guest
- REJECTS a finished product id that resolves to nothing — the INR 0.00 row
- REJECTS a fabric product id that resolves to nothing
- REJECTS an item referencing no product at all
- INSERTS normally when the tenant and product both resolve
- resolves a product id given as the underlying product_id (second lookup)

### `apps/api/src/commerce/cart/repository/cart.repository.spec.ts` — 12
- reads only the given tenant
- NEVER creates a tenant as a side effect of a read
- issues exactly one query — no tenant-existence lookup first
- returns [] for a tenant with an empty cart
- propagates a DB error rather than answering with someone else
- returns 1 when the version-checked delete removed the row
- returns 0 for a row that does not exist, without attempting a delete
- throws OptimisticLockError when the row changed between select and delete
- names the entity and id in the lock error
- deletes every row of the tenant and counts them
- returns 0 for a tenant with an empty cart
- aborts the whole transaction if any row lost its version race

### `apps/api/src/commerce/cart/service/cart.enrichment-batching.spec.ts` — 10
- does not issue more queries as the cart grows
- falls back to the bare product row when no product_fabric row exists
- falls through to the port only when neither table has the id
- resolves a missing size option to null instead of throwing
- keeps finish CSV token order and last-one-wins finishDisplayName
- skips non-numeric finish tokens rather than throwing on BigInt()
- asks the fabric-preview port once for all distinct selectedFabricIds
- leaves selectedFabric null when the batch has no row for that id
- does not touch the fabric-preview port when no line selects a fabric
- returns an empty list for an empty cart without querying

### `apps/api/src/commerce/cart/validators/cart-item.sanitizer.spec.ts` — 11
- strips null bytes (stage 1: canonicalization)
- strips <script> tags (stage 2: XSS stripping)
- strips <iframe> tags
- strips src= attributes, leaving the (now-empty) attribute slot
- strips eval(...) and expression(...) calls
- strips javascript: and vbscript: pseudo-protocols
- strips onload= handlers; the resulting bare <body> tag is then dropped entirely since body is outside the stage-3 allowlist
- keeps allowlisted formatting tags but strips tags outside the allowlist (stage 3 substitute)
- sanitizes each declared string field (selectedFinishId, productGroup, click/utm fields)
- does not touch orderType/unit (enums, not strings) or customSize (JSONB, undefined shape) — matches reflection targeting only String fields
- leaves non-string values on declared fields untouched (e.g. clickId absent/null)

### `apps/api/src/commerce/cart/validators/cart-item.validator.spec.ts` — 16
- accepts a fully valid fabric item
- accepts a fully valid finished item with finishedProductId set
- rejects productGroup=fabric with no fabricProductId
- rejects productGroup=fabric with fabricProductId=0
- rejects productGroup=swatch with fabricProductId null
- accepts productGroup=swatch with a non-zero fabricProductId
- rejects productGroup=finished with no finishedProductId
- rejects productGroup=finished with finishedProductId=0
- does not require fabric/finished id for any other productGroup value (source has no else/default rejection branch)
- rejects an invalid unit
- accepts the other valid unit (UNIT)
- rejects an invalid orderType
- accepts every valid orderType (MADE_TO_ORDER, PRE_ORDER)
- boundary: quantity = 0.5 passes
- boundary: quantity = 0.49 fails
- rejects a negative quantity

### `apps/api/src/commerce/catalog/controller/catalog-item-media.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/catalog/controller/catalog-item.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/catalog/controller/catalog-pdf.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/catalog/controller/catalog.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/catalog/repository/catalog-item-media.repository.spec.ts` — 3
- null for a missing row, the row otherwise
- a query failure propagates instead of a 404-shaped null
- empty table is still [], a failure propagates

### `apps/api/src/commerce/catalog/repository/catalog-item.repository.spec.ts` — 3
- null for a missing row, the row otherwise
- a query failure propagates instead of a 404-shaped null
- empty table is still [], a failure propagates

### `apps/api/src/commerce/catalog/repository/catalog-pdf.repository.spec.ts` — 6
- scopes the query to the given artisanId
- an artisan with no PDFs gets [] — NOT another artisan
- a query failure propagates instead of an empty (or borrowed) PDF list
- formats rows through formatCatalogPdf (ids as strings, booleans coerced)
- findById: null for a missing row
- findAll: caps at 50 and returns [] when empty, a failure propagates

### `apps/api/src/commerce/checkout/checkout.e2e.spec.ts` — 27
- guest order: subtotal from verified line prices, shipping from the shipment record, client totals discarded
- rejects a line priced below the catalogue price
- accepts a legitimately volume-discounted price at qualifying quantity, rejects it below the tier
- rejects a line naming a product that does not exist
- rejects an unknown shipping method rather than inventing a rate
- prices a non-INR order with the day
- refuses a non-INR order when no exchange rate is on file
- a body-supplied guest cannot override the token identity
- no token and no guest identity -> 401
- a guest email that belongs to a registered account is refused with exists:true
- an invalid bearer token is rejected, never downgraded to guest
- reusing the same guest email reuses the same guest tenant
- is unguessable (32 random bytes) and stored only as a SHA-256 hash
- order -> payment session -> signed callback marks the order paid; replay is idempotent
- an invalid signature does not mark the order paid
- a callback naming a provider order this API never created is refused
- a missing signature is refused before any verification
- order -> session -> signed callback marks the order paid, all on the bearer token
- another customer
- cannot open a session, post a callback, or read status for another order
- a guest with no token at all gets 401 on the payment steps
- projects the order without leaking internals, and flips to PAID after the callback
- verifies the session against Stripe itself before handing it to the success handler
- refuses an unpaid session, a session for a different order, and a non-cs id
- payment-mode answers from the configured providers, honestly when unconfigured
- shipment-list is guest-readable and keyed like the Loom envelope
- the sandbox gateway is a genuine 404 — no sandbox provider exists in this API

### `apps/api/src/commerce/checkout/controller/checkout.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/checkout/repository/checkout.repository.spec.ts` — 11
- returns [] without querying when given no ids
- maps rows into the checkout pricing projection
- a query failure propagates instead of pricing the cart at 0 (silent checkout bug)
- returns [] without querying when given no profile ids
- a query failure propagates rather than silently applying no volume discount
- returns null for an unknown email (createGuestTenant path taken)
- returns the tenant id/userType for a matching email
- propagates a lookup failure instead of treating every email as guest
- findSidecarByTokenHash: an empty hash returns null WITHOUT issuing the lookup query — never matches every non-guest row
- findSidecarByTokenHash: maps a found row
- findSidecarByOrderId: no row is null, a DB failure propagates

### `apps/api/src/commerce/commerce.module.spec.ts` — 10
- wires TagController, which serves /get/tag/list for the CMS
- keeps the generic table-explorer wildcard last, behind the per-entity routes
- imports NverseModule
- imports ZohoModule
- NVerseService issues tokens through GatekeeperService, never a literal string
- NVerseService has no hardcoded OTP and no plaintext password compare
- the MSG91 service is gated on OUTBOUND_SMS_ENABLED and never returns an OTP value
- no FakeOTPController-shaped handler was ported
- every anonymous NVerse failure path returns the same non-enumerable message
- every Zoho webhook handler is behind ZohoWebhookGuard

### `apps/api/src/commerce/compatibility/compatibility.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/content/blog/controller/blog.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/content/story/controller/story.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/content/story/service/story.service.spec.ts` — 5
- returns the six same-category stories without topping up
- tops up from the same content type, excluding what is already selected and the source
- returns an empty list for a missing source story — Java returns new ArrayList<>()
- returns an empty list when the source story
- returns only the same-category matches when nothing else shares the content type

### `apps/api/src/commerce/cross-module-ports.spec.ts` — 12
- AuthModule: AUTH0_VALIDATION_PORT is the real validator, not 
- CartModule: preview / finish / size / tenant ports are all real
- ReviewModule: ORDER_ITEM_PORT writes to order_item for real
- FabricProductModule: every port but the Zoho adapter is real
- FinishedProductModule: every port but the Zoho adapter is real
- SubCategoryModule: segment + all seven profile lookups are real
- ProductSizeProfileModule / ProductPreviewModule lookups are real
- CartModule TENANT_LOOKUP_PORT reads through TenantLookupRepository
- ReviewModule ORDER_ITEM_PORT returns the real order id
- FabricProductModule MAIN_PRODUCT_PREVIEW_PORT returns the real related list
- ZOHO_ADAPTER_PORT throws NotImplementedException on both product modules
- no *.module.ts registers an 

### `apps/api/src/commerce/custom-product/controller/custom-product.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/custom-product/controller/custom-product.controller.spec.ts` — 12
- returns the list under 
- returns an empty list rather than an error when there are none
- returns the row under 
- 404s for an id that does not exist, rather than a 200 carrying null
- rejects a non-numeric id instead of querying with NaN
- creates and reports success
- derives unit UNIT for the finished group, as Loom
- reports failure rather than a silent success when the insert returns nothing
- rejects a missing name before touching the service
- updates by the body id and reports success
- reports failure when the id matches no row (Loom
- rejects a missing id before touching the service

### `apps/api/src/commerce/custom-product/controller/custom-size-profile.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/custom-product/controller/custom-size-profile.controller.spec.ts` — 14
- returns profiles under 
- returns an empty list when there are no profiles
- returns the profile under 
- returns null for a profile that does not exist
- rejects a non-numeric id
- creates and reports Loom
- rejects a profile with no measurement fields
- rejects a non-positive price, as Loom
- updates and reports success
- reports a missing profile as a failure envelope
- requires an id on update
- returns the deletion result under 
- passes through Loom
- reports a profile that does not exist

### `apps/api/src/commerce/custom-workflow/controller/custom-workflow.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/custom-workflow/controller/custom-workflow.controller.spec.ts` — 23
- returns the detail under Loom
- renders a missing / non-custom workflow as a null payload, as Loom
- rejects a non-numeric workflowId instead of querying with NaN
- rejects a non-positive workflowId
- returns previews under Loom
- returns an empty workflowList when no workflow matches the status
- passes the status through to the service
- returns the artisan
- is empty when the artisan has no assigned custom workflows
- refuses to run without a resolvable tenant rather than reading everything
- returns summaries under 
- returns an empty list for an order with no workflows
- rejects a non-numeric orderId instead of querying with NaN
- returns the tree under Loom
- returns a null workflow when there is none in the caller
- returns Loom
- rejects a body with no steps before reaching the service
- rejects a step tree with more than one primary step
- returns Loom
- reports a missing workflow as a failure envelope, matching Loom
- reports a base-pay conflict as a failure envelope
- rejects an unknown status rather than ignoring the field
- rejects a body with no status at all — Loom

### `apps/api/src/commerce/custom-workflow/dto/workflow-status.machine.spec.ts` — 4
- ${from} -> ${to} is accepted and persists ${to}
- CREATED -> CREATED is the no-op the CMS sends when renaming a new job
- flags entersCompleted only when the workflow was NOT already COMPLETED
- ${from} -> CREATED is rejected, not silently ignored

### `apps/api/src/commerce/custom-workflow/service/custom-workflow.service.spec.ts` — 27
- upper-cases the status, as Loom
- does not blow up on a missing status
- resolves the artisan from the tenant and queries with that id
- returns an empty list when the tenant is not an artisan, as Loom does
- folds the flat step x sub-process rows back into one tree
- renders a step with no sub-processes as an empty list, not a row of nulls
- is null for an order outside the caller
- is null when the order has no workflow rows
- runs the whole cascade in one transaction and refreshes the order
- commits NOTHING when the cascade fails part-way
- rejects an unknown workflow template before writing anything
- rejects an order item that does not belong to the referenced order
- does not fail the write when the impact refresh fails afterwards
- applies the update and refreshes impact
- reports NOT_FOUND for an absent workflow, Loom
- reports NOT_FOUND for a STANDARD-order workflow — this route is custom-only
- rejects an illegal transition back to CREATED before touching the row
- refuses the transition into COMPLETED, naming the unported payment engine
- allows re-saving an ALREADY COMPLETED workflow — no new payment run is due
- rejects a base-pay conflict and commits nothing
- synchronizes assignments and updates the row in ONE transaction
- leaves assignments alone when the body omits them, as Loom
- maps the row onto the CMS CustomWorkflowDetail contract
- omits the absent quantity key rather than emitting a null that reads as zero
- returns an EMPTY assignment list, not a fabricated one, for an unassigned workflow
- is null for a workflow with no custom-order mapping (a standard-order id)
- propagates a query failure instead of returning null — absent and broken must differ

### `apps/api/src/commerce/discount/discount.apply-coupon.spec.ts` — 13
- approves a real row and returns ITS percentage under 
- returns the row
- checks the minimum order value when a cartTotal IS supplied
- rejects an unknown code with no payload, never a zero-discount success
- rejects an inactive coupon
- rejects an expired coupon
- rejects a SINGLE-use coupon the tenant already redeemed
- rejects a coupon with a minimum order value when no cart total was sent, and SAYS SO
- reports a genuine below-minimum cart as below-minimum, not as an unknown cart
- treats a non-numeric cartTotal as UNKNOWN, not as 0
- refuses without an authenticated tenant rather than checking a global usage history
- rejects a code shorter than Loom
- propagates a database failure instead of returning a rejection that reads as a real verdict

### `apps/api/src/commerce/discount/discount.apply-voucher.spec.ts` — 15
- returns 1 for a coupon that does not exist — no invented approval
- returns 2 when the cart is below the minimum order value
- returns 2 for a genuine 0 cart value below the minimum — 0 is never replaced by a fallback total
- returns 3 for an inactive coupon
- returns 4 for an expired coupon
- returns 5 when a SINGLE-use coupon was already applied to one of the tenant
- returns 0 only when every database check passes
- propagates a database error instead of approving anyway
- rejects a missing cartTotal — it must never default to 2500
- rejects a 0 cartTotal (Loom validator: cartValue > 0)
- rejects a missing or too-short voucher code
- accepts a well-formed request
- rejects when no authenticated tenant is attached
- maps a database-backed approval to success with NO fabricated amounts in the payload
- maps an invalid code to a failure — never 

### `apps/api/src/commerce/discount/discount.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/discount/discount.service.spec.ts` — 6
- maps the discount table onto the response shape the clients read
- carries an inactive coupon through as active:false rather than hiding it
- treats a null 
- returns [] for an empty discount table — it does NOT invent a coupon
- returns [] when the discount table read throws, instead of a seed coupon
- falls through to the generic commerce_discount table on a read failure

### `apps/api/src/commerce/domain/artisan-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/catalog-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/category-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/content-ai-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/currency-location.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/custom-order-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/custom-order-migrated.controller.spec.ts` — 2
- ${route} returns the owner
- ${route} — IDOR: tenant B cannot read tenant A

### `apps/api/src/commerce/domain/customer.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/customer.controller.spec.ts` — 6
- returns ONE row for the calling tenant, keyed 
- IDOR: tenant B can never see tenant A
- a tenant with no membership gets null, not somebody else
- returns the paginated projection keyed 
- an empty table reads as an empty list, not fabricated rows
- missing or non-integer page/size is a 400, as Loom

### `apps/api/src/commerce/domain/diagnostics.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/discount-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/fabric-product-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/finished-product-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/image-optimization.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/loyalty-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/misc-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/notifications.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/notifications.controller.poll.spec.ts` — 4
- triggers the recent-window poll and wraps the summary under 
- triggers the stale-backlog poll and wraps the summary under 
- polls the single row and returns the all-zero summary when the row does not exist
- rejects a non-numeric id with 400 rather than polling

### `apps/api/src/commerce/domain/order-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/order-migrated.controller.spec.ts` — 7
- answers for the REQUESTED order id, keyed 
- IDOR: a customer is scoped to their OWN tenant id, never the path id
- a super user reads across tenants — Loom
- answers for the REQUESTED order id, keyed 
- returns the real aggregation keyed 
- POST /trigger/impact/order/:orderId throws instead of returning a product dump
- GET /get/order/:orderId/workflow/:orderItemId throws (was CODE_CU and unscoped)

### `apps/api/src/commerce/domain/path-parameter.spec.ts` — 5
- passes the csv through and answers keyed 
- answers keyed 
- DELETE /delete/finished-product/:productId
- GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId
- GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId/assigned-element-details

### `apps/api/src/commerce/domain/payment-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/product-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/profiles.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/reports.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/sub-category-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/super-user.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/table-explorer.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/wishlist.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/domain/wishlist.controller.spec.ts` — 7
- actually persists the list and reads it back
- is a whole-list replace, as Loom
- normalises separator whitespace before storing
- IDOR: tenant A cannot modify tenant B
- reports FAILURE, not success, when the tenant has no customer row
- rejects an empty list — Loom
- rejects a list longer than Loom

### `apps/api/src/commerce/domain/workflow-migrated.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/dto-id-params.strict.spec.ts` — 3
- accepts a well-formed id unchanged
- rejects an id above 2^53 rather than querying a rounded one
- preserves ids exactly past 2^53

### `apps/api/src/commerce/faq/controller/faq.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/faq/mapper/faq.mapper.spec.ts` — 3
- maps every field straight through
- maps the row and nests mapped questions
- defaults faqQuestionList to [] when no questions are passed

### `apps/api/src/commerce/faq/validators/faq.sanitizer.spec.ts` — 3
- trims and HTML-escapes question and answer
- trims heading and sanitizes every nested question
- defaults faqQuestionList to [] when it is not an array

### `apps/api/src/commerce/faq/validators/faq.validator.spec.ts` — 9
- accepts a valid question/answer pair
- rejects a question shorter than 5 chars
- rejects a question longer than 3000 chars
- rejects an answer shorter than 2 chars
- accepts boundary lengths (5-char question, 2-char answer)
- accepts a valid FAQ
- rejects a heading shorter than 3 chars
- rejects an empty question list
- propagates a question-level validation error

### `apps/api/src/commerce/filter/controller/filter.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/filter/mapper/filter.mapper.spec.ts` — 4
- maps a fully-populated snake_case row
- defaults every field on an empty row
- maps a fully-populated snake_case row
- defaults nullable list fields to null and numerics to 0 on an empty row

### `apps/api/src/commerce/forex/controller/forex.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/forex/controller/forex.controller.spec.ts` — 7
- returns the Loom envelope keyed 
- returns an empty forexList (not an error) when the table is empty
- returns the Loom envelope keyed 
- returns forexExchangeRate: null when no rate row exists
- returns the Loom envelope keyed 
- returns an empty list when there is no history
- dumps the forex table keyed 

### `apps/api/src/commerce/forex/repository/forex.repository.spec.ts` — 16
- returns null when no snapshot exists — it does not invent one
- parses the numeric columns to numbers, as Loom
- breaks a same-record-date tie on createdAt, as Loom
- preserves version 0 instead of reporting it as null
- reports a genuine zero rate as 0
- is case-insensitive on the currency code
- returns null when there is no snapshot at all
- DIVERGENCE FROM LOOM: an unknown code returns the whole snapshot instead of throwing
- carries the two untouched currencies over from the previous snapshot
- stamps recordDate at UTC midnight, the key Loom
- writes createdAt as a number, matching the bigint({mode:
- REFUSES to seed invented rates when no snapshot exists
- does not fail the write when the secondary forex-table update throws
- returns [] for an empty forex table
- reports a genuine zero rate as 0, not null
- reports a null rate as null

### `apps/api/src/commerce/image/controller/image.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/image/service/image.service.spec.ts` — 8
- is not configured when the environment is empty
- treats a whitespace-only credential as absent
- throws rather than attempting an upload when unconfigured
- throws rather than attempting a PDF upload when unconfigured
- reports a delete failure rather than throwing out of the fire-and-forget path
- treats an empty url as nothing to delete, without touching S3
- is configured once every value is present
- accepts the legacy AWS_* names as well

### `apps/api/src/commerce/image/validators/image.validator.spec.ts` — 9
- accepts an allowed mime type within the size limit
- rejects a missing mimetype
- rejects a disallowed mime type
- rejects a file over the 10 MB limit
- accepts exactly the 10 MB boundary
- does not size-check when size is undefined
- accepts a non-empty url
- rejects an undefined url
- rejects a whitespace-only url

### `apps/api/src/commerce/impact/controller/custom-order-impact.controller.spec.ts` — 8
- returns the summary under Loom
- gives a SUPER_USER an unscoped read (null tenant scope), as Loom does
- gives GOD_MODE the same unscoped read
- scopes a CUSTOMER to their OWN tenant id, never the path id
- uses a scope that matches nothing when a non-SU caller has no resolvable tenant
- returns a zeroed summary (Loom
- rejects a non-numeric id instead of querying with NaN
- returns totals under Loom

### `apps/api/src/commerce/impact/controller/impact.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/impact/dto/impact-assumptions.spec.ts` — 6
- accepts a complete configuration
- accepts the same configuration stored as a JSON string
- rejects a missing or non-positive version
- rejects negative or non-finite formula values
- rejects percentages outside [0, 1] — they are decimal fractions, not 0-100
- rejects anything that is not an object

### `apps/api/src/commerce/impact/dto/impact-summary.spec.ts` — 7
- sums every metric across the rows
- counts COMPLETE items separately from everything else
- treats null metrics as zero (Loom
- maps customOrderItemId onto the item
- is the empty summary when there are no rows
- maps the snake_case SQL row, coercing pg
- is all zeroes when the query returned no row (Loom

### `apps/api/src/commerce/impact/impact.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/impact/repository/impact.repository.spec.ts` — 7
- returns [] for an empty table — never the fabricated FABRIC/FINISHED rows
- propagates a DB error instead of substituting plausible figures
- returns the persisted rows untouched when they exist
- returns null for a missing row — no 2.50 kg CO2 default
- propagates a DB error
- rejects a 0 tenantId — it must never resolve to tenant 1
- writes the REAL ids it was given

### `apps/api/src/commerce/impact/service/custom-impact-calculation.service.spec.ts` — 11
- maps only 
- refuses every other group, including 
- is true only for a fabric item whose name contains 
- is false for a finished item, or a fabric item with no marker
- computes the Java formulas exactly
- keeps the environmental metrics but goes PARTIAL with no workflow
- names the missing per-meter hours rather than assuming a rate
- computes the Java formulas exactly, and writes NO environmental metrics
- goes PARTIAL with no workflow
- names the missing per-product hours rather than assuming a rate
- throws rather than inventing a product type

### `apps/api/src/commerce/impact/service/custom-order-impact.service.spec.ts` — 11
- returns a zeroed result and writes nothing for an absent order
- passes the tenant scope through to the order lookup
- skips EVERY item and writes nothing, rather than substituting constants
- counts created vs updated, and COMPLETE vs PARTIAL
- skips an unsupported product group without writing
- skips a fabric swatch AND deletes its stale impact row
- resolves a 
- resolves a 
- skips a 
- runs the whole recalculation inside ONE transaction
- commits NOTHING when a write fails part-way through the order

### `apps/api/src/commerce/inventory/controller/inventory-adjustment-reason.controller.spec.ts` — 4
- updates and returns the Loom simple envelope
- reports failure (never a silent success) when the id matches no row
- rejects an empty reason before touching the service
- rejects a missing id before touching the service

### `apps/api/src/commerce/inventory/controller/inventory.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/inventory/dto/inventory.dto.spec.ts` — 10
- a missing warehouseId fails validation instead of becoming 306145
- a missing reasonId fails validation instead of becoming 306167
- an item missing productId fails validation instead of becoming 94504
- no items means rejection — an adjustment for product 94504 is never invented
- real ids pass through unchanged and validate
- a missing productId fails validation instead of becoming 94504
- a missing tenantId fails validation instead of becoming 1
- a missing requestedQuantity fails validation instead of becoming 100
- a missing productGroup fails validation instead of becoming FABRIC
- real values pass through unchanged

### `apps/api/src/commerce/inventory/service/inventory.service.spec.ts` — 6
- rejects when the warehouse does not exist — never substitutes another warehouse
- rejects when the reason does not exist
- writes exactly the ids and items it was given — no 306145/306167/94504 anywhere
- propagates a database error instead of hiding it
- writes exactly the tenant/product/quantity it was given
- propagates a database error instead of hiding it

### `apps/api/src/commerce/inventory/validators/inventory.sanitizer.spec.ts` — 4
- trims and HTML-escapes name and description
- trims and HTML-escapes reason and description
- trims and HTML-escapes referenceNo and description, leaving other fields untouched
- trims and HTML-escapes productGroup, leaving numeric fields untouched

### `apps/api/src/commerce/inventory/validators/inventory.validator.spec.ts` — 20
- passes with a non-empty name
- rejects an empty/whitespace-only name
- passes with a non-empty reason
- rejects an empty reason
- passes with warehouseId, reasonId, and at least one item
- rejects a missing warehouseId
- rejects a missing reasonId
- rejects an empty items array
- passes with tenantId, productId, productGroup, and quantity > 0
- rejects a missing tenantId
- rejects a missing productId
- rejects a missing productGroup
- boundary: requestedQuantity = 0 is rejected
- boundary: requestedQuantity just above 0 passes
- passes with a requestId and positive quantity
- rejects a missing requestId
- rejects quantity <= 0
- passes with a requestId and status
- rejects a missing requestId
- rejects a missing status

### `apps/api/src/commerce/loyaltyprogram/controller/loyaltyprogram.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/loyaltyprogram/repository/loyaltyprogram.repository.spec.ts` — 7
- writes epoch and id columns as plain numbers, never BigInt
- writes the config and its ONBOARDING audit row in one transaction
- leaves no partial state when the audit write fails
- serialises a genuine zero discount as 
- writes no audit row when the program is deactivated
- returns null when the version-pinned update matches nothing
- writes updatedAt as a number

### `apps/api/src/commerce/loyaltyprogram/service/loyaltyprogram.service.spec.ts` — 20
- onboards a new program with the caller
- derives endDate as startDate + tenure * 30 days, as Java does
- rejects an unknown customer instead of fabricating one
- never falls back to 
- persists a genuine 0% discount rather than substituting a default
- persists a genuine 0 minimum order value
- persists a 100% discount at the upper boundary
- updates an existing config in place, pinned to the version it read
- deactivates rather than deleting when active is false
- refuses to repoint an existing config at a different customer
- fails loudly instead of replaying when the version moved under it
- propagates a failed write rather than reporting success
- returns the caller
- tenant A cannot read tenant B
- rejects a tenant with no customer record instead of returning someone else
- 404s rather than fabricating a Gold tier when the customer has no program
- loyalty order lists are queried by the caller
- 404s on a missing config instead of returning an empty object
- 404s on a missing audit log instead of returning an empty object
- passes page and size straight through to the paginated query

### `apps/api/src/commerce/material/controller/material.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/material/mapper/material.mapper.spec.ts` — 2
- stringifies the numeric id and passes through name/timeOfCreation
- stringifies a bigint id via toString()

### `apps/api/src/commerce/material/validators/material.sanitizer.spec.ts` — 2
- trims surrounding whitespace
- escapes < and > (only, not other HTML-significant characters like & or \

### `apps/api/src/commerce/material/validators/material.validator.spec.ts` — 5
- accepts a valid 1-255 char name
- rejects a missing name
- rejects an empty-string name
- boundary: a 255-char name passes
- boundary: a 256-char name is rejected

### `apps/api/src/commerce/misc/misc.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/navigation/mapper/navigation.mapper.spec.ts` — 4
- coerces ids to Number and names to String
- maps fields and defaults subCategoryFeaturedImage to empty string when absent
- passes through a provided image url
- maps every field, defaulting bannerImage to empty string when absent

### `apps/api/src/commerce/navigation/repository/navigation.repository.spec.ts` — 5
- uses the primary fabric-scoped rows when present
- falls back to the plain join when the fabric-scoped query returns no rows
- a query failure propagates instead of silently falling back to the plain join
- empty is still [], a query failure propagates
- returns [] without querying for an unrecognised story type

### `apps/api/src/commerce/notification/controller/notification.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/notification/mapper/notification.mapper.spec.ts` — 2
- picks only id/tenantId/entityId/entityType/triggerType/status, dropping every other row field
- passes a null tenantId/entityId through unchanged

### `apps/api/src/commerce/notification/service/notification.service.spec.ts` — 13
- builds no transporter when SMTP_HOST and SMTP_FROM are absent
- builds no transporter when only the host is set
- attempts no send and audits POST_ERROR when unconfigured
- supplies every NOT NULL column the email_notification_history table requires
- uses only enum values the database enum accepts
- takes the recipient from the order, not from the caller
- returns false and writes nothing when the order does not exist
- does not send to an address that is not a plain address
- builds a transporter from env only, and no live host is reachable
- keeps an explicit port 0 rather than silently substituting 587
- audits POST_ERROR when the send throws
- returns null for a missing source row
- replays the stored row with attemptCount + 1 and retriggeredFromId set

### `apps/api/src/commerce/nverse/controller/nverse.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/nverse/mapper/nverse.mapper.spec.ts` — 2
- maps a row to a verification token DTO
- returns null for a null/undefined row

### `apps/api/src/commerce/nverse/otp-rate-limit.guard.spec.ts` — 9
- allows the first OTP_SENDS_PER_NUMBER sends for a number, then 429s
- limits per IP even when every request uses a different number
- keeps a different number on a different IP unaffected
- normalises formatting so +91-98765 43210 cannot buy a fresh quota
- answers 429 TOO_MANY_REQUESTS, not a generic 500
- does not reveal WHICH limit tripped — same message for IP and number
- lets the caller through again once the window has elapsed
- still limits by IP when no contactNumber is supplied at all
- falls back to socket.remoteAddress when req.ip is absent

### `apps/api/src/commerce/nverse/service/msg91-otp.service.spec.ts` — 8
- verifyOtp makes no network call and never succeeds when the switch is off
- treats an unset switch as off (fail closed)
- fails closed when the switch is on but credentials are missing
- sends the Java
- verifies via GET with authkey/mobile/otp query params
- maps anything other than type==
- fails closed when the provider is unreachable
- clamps a nonsense MSG91_OTP_LENGTH to the Java default of 6

### `apps/api/src/commerce/nverse/service/nverse.service.spec.ts` — 13
- verifyOtp with a rejected OTP returns no token
- verifyOtp for an unknown number never even asks MSG91
- verifyOtp with the kill switch on (MSG91 unavailable) issues nothing
- login with a wrong password returns no token
- login never compares passwords itself — it delegates to GatekeeperService
- issues a real signed token only when MSG91 verifies
- refuses a disabled account even when MSG91 verifies the OTP
- unknown number and wrong OTP are indistinguishable on verify
- unknown number and provider failure are indistinguishable on send
- unknown email and wrong password are indistinguishable on login
- no response body ever carries an OTP value
- fails when the token does not check out
- succeeds only when the repository consumes a real token

### `apps/api/src/commerce/nverse/validators/nverse.sanitizer.spec.ts` — 4
- trims and lowercases
- returns undefined for an undefined/empty input
- strips non-digit characters
- returns undefined for an undefined/empty input

### `apps/api/src/commerce/nverse/validators/nverse.validator.spec.ts` — 11
- accepts email + password
- accepts contactNumber + password (email not required)
- rejects when neither email nor contactNumber is present
- rejects when password is missing
- accepts a 10-digit number
- accepts a 6-digit otp by default
- honours a configured otp length
- rejects a bad contact number before looking at the otp
- accepts email + token
- rejects when token is missing
- does not distinguish which field was wrong

### `apps/api/src/commerce/order/controller/custom-order.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/order/controller/custom-order.controller.tenant.spec.ts` — 4
- createCustomOrder without a tenant fails and never reaches the service
- getCustomerCustomOrderList without a tenant never queries as customer 1
- cancelCustomOrder without a tenant fails and never cancels as customer 1
- a real tenant id is the one passed through

### `apps/api/src/commerce/order/controller/order-customer-list.controller.spec.ts` — 11
- returns the tenant
- scopes by the authenticated tenant, never by anything a client sends
- rejects rather than widening scope when there is no tenant on the request
- returns an empty orderList when the customer has no orders
- falls back to Loom
- returns merged regular + custom previews keyed 
- returns an empty orderList when the customer has no orders
- rejects when there is no tenant on the request
- wraps ProcessingOrderStatus under the RainEntity key 
- is a valid object defaulting to false when the customer has no orders
- rejects when there is no tenant on the request

### `apps/api/src/commerce/order/controller/order-feedback.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/order/controller/order-fulfillment.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/order/controller/order.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/order/repository/order.repository.spec.ts` — 19
- stamps cancelledAt + reason on the order AND drives every item to CANCELLED
- uses one timestamp for the header and the items
- returns null and issues NO item write when the order does not exist
- propagates a DB error rather than reporting a successful cancel
- deleteOrder marks orders.deleted instead of issuing a DELETE
- deleteOrder returns null for an unknown or already-deleted order
- deleteCustomOrder marks custom_order.deleted and reports a boolean
- deleteCustomOrder is false when nothing matched
- cascades CANCELLED to custom_order_item on success
- returns false and writes nothing when the order is not the tenant
- totals the payload exactly: sum(price * quantity), with no invented floor
- sets adjustedTotal to the order total (Loom addOrder), not the column default 0
- keeps a genuinely zero-value order at zero
- writes a zero-priced item as 0, not as a fabricated 1500
- an empty item list produces a zero-total order, not a 1500 one
- carries Loom
- findById returns null when the order is absent, without reading order_item
- findCustomOrderById returns null when absent, without reading custom_order_item
- findById attaches orderItemList to the order it found

### `apps/api/src/commerce/order/service/order-previews.service.spec.ts` — 7
- merges both sources and re-sorts newest-first across them
- passes the tenant and paging straight through to both queries
- returns [] when the tenant has neither kind of order
- is true when any regular order is PROCESSING
- is true when any CUSTOM order is PROCESSING
- defaults to false when the tenant has no orders at all
- is false when orders exist but none are PROCESSING

### `apps/api/src/commerce/order/service/order.service.spec.ts` — 20
- cancelOrder goes through the repository cancel (header + item cascade)
- updateOrderStatus(
- propagates the repository
- does not swallow a DB failure into a successful-looking cancel
- PINS AN UNBUILT PATH: any non-CANCELLED status writes only an audit note
- defaults every money column to 
- keeps an explicit zero total at zero rather than falling back to a default
- advancePay falls back to the full total when the caller omits it
- an explicit advancePay is preserved and not overwritten by total
- accepts the legacy lowercase 
- stamps version 1 and a creation time
- PINS AN UNBUILT PATH: no forex exchange rate is snapshotted onto the order
- initialises each item to INITIATED/PENDING, as Loom addOrder does
- inherits the order currency when an item does not carry its own
- creates the order header even when the item list is empty
- prefers the body
- falls back to the authenticated tenant when the body carries none
- PINS A HAZARD: with no tenant anywhere it adopts an arbitrary existing tenant
- falls back to tenant 1 when even that lookup fails
- does not abort the whole order when one item insert fails

### `apps/api/src/commerce/pattern/controller/pattern.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/pattern/mapper/pattern.mapper.spec.ts` — 1
- stringifies the numeric/bigint id

### `apps/api/src/commerce/pattern/validators/pattern.sanitizer.spec.ts` — 2
- trims and escapes angle brackets
- leaves an already-clean name unchanged

### `apps/api/src/commerce/pattern/validators/pattern.validator.spec.ts` — 4
- accepts a valid name
- throws when name is missing
- throws when name exceeds 255 characters
- accepts the 255-char boundary

### `apps/api/src/commerce/payment/controller/payment.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/payment/controller/payment.controller.spec.ts` — 9
- processes a success event whose signature verifies over the raw body
- routes failure event types to handlePaymentFailure
- rejects a tampered payload signed for the original body
- rejects a signature produced with a different secret
- rejects an arbitrary non-empty signature header
- rejects a missing signature header
- rejects a replayed signature outside the tolerance window
- rejects when the raw body is unavailable, rather than verifying nothing
- fails closed when no endpoint secret is configured, even for an otherwise valid signature

### `apps/api/src/commerce/payment/service/razorpay-payment.service.spec.ts` — 21
- rejects when the order does not exist (E1 boundary)
- rejects when no payment is due on the order
- uses advancePay for an advance session and remainingPay for a remaining session
- marks the order failed and throws when the transaction log write fails
- returns NO_ACTION when no matching transaction is found, without touching the order
- creates no transaction row for an unknown order/payment pair
- marks PAID when the signature verifies
- rejects a forged signature: never PAID, order failed, no row created
- rejects a signature computed with the wrong secret
- rejects a signature bound to a different payment id (replay across payments)
- fails closed when no key secret is configured
- advance payment: moves order to processing and sends confirmation email + WhatsApp
- remaining payment: moves pre-order to paid and sends the pre-order confirmation with order items
- returns UPDATE_FAILURE and fails the order when the transaction write itself fails
- returns NO_ACTION when no matching transaction is found
- advance payment: marks FAILED, fails the order, and sends the cancel notification email
- remaining payment: records the failure but does not touch order status (characterization)
- returns NO_ACTION when the order has no transactions
- advance payment: rewrites every transaction on the order to PAID and notifies
- getTransactionData delegates paging straight to the repository
- getTransactionById delegates to the repository by id

### `apps/api/src/commerce/payment/service/stripe-payment.service.spec.ts` — 15
- rejects when the order does not exist (E8 boundary)
- rejects when no payment is due on the order
- persists a CREATED transaction and returns sessionId + checkoutUrl on success
- marks the order failed and throws when the transaction log write fails
- throws when no matching transaction is found (unauthorized/replayed webhook)
- advance payment: marks PAID, moves order to processing, sends confirmation email + WhatsApp
- clears the cart only on checkout.session.completed, not on async_payment_succeeded
- remaining payment: moves pre-order to paid and sends the pre-order confirmation with order items
- falls back to an empty item list for the pre-order email when the order has no orderItems
- marks the order failed when the transaction update itself fails
- throws when no matching transaction is found
- advance payment: marks FAILED with the checkout-session-expired reason and fails the order
- remaining payment: records the failed transaction but does not fail the order (characterization)
- getTransactionData delegates paging straight to the repository
- getTransactionById delegates to the repository by id

### `apps/api/src/commerce/payment/validators/payment.sanitizer.spec.ts` — 5
- trims and HTML-escapes paymentType
- escapes all string fields, leaves loomOrderId untouched
- escapes razorpayOrderId only
- escapes paymentType and transactionId
- escapes every string field on the payload

### `apps/api/src/commerce/payment/validators/payment.validator.spec.ts` — 16
- accepts a valid input
- rejects a non-positive orderId (current port behaviour)
- documented contract: validator is a stub and never rejects (diverges from port)
- accepts a valid input
- rejects a missing loomOrderId
- rejects a blank transactionSignature
- accepts a valid input
- rejects a missing error payload
- accepts a valid input
- rejects a blank transactionId
- accepts a valid input
- rejects totalAmount <= 0
- rejects loomOrderId <= 0
- documented contract: paymentType must be advance|remaining (port only checks non-blank)
- documented contract: customerEmail length is checked (port ignores customerEmail)
- documented contract: currency must be a valid enum (port only checks non-blank)

### `apps/api/src/commerce/product/category/mapper/category.mapper.spec.ts` — 4
- maps name/metaTitle/metaDescription and the resolved image urls, stamping timeOfCreation
- defaults metaTitle/metaDescription to empty string when absent
- always writes name/metaTitle/metaDescription and omits icon/socialImage when not passed
- includes icon/socialImage only when a replacement was uploaded

### `apps/api/src/commerce/product/category/repository/category.repository.spec.ts` — 6
- findById: null for a missing row, the row otherwise
- findById: a query failure propagates
- findAll: an empty table is still [], a failure propagates
- findByNameIgnoreCase: null for no match, a failure propagates
- countSegmentsByCategoryId: propagates a query failure instead of reporting 0 segments
- retrieveCategory: maps the paginated column set, a failure propagates

### `apps/api/src/commerce/product/controller/category.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/fabric-product.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/finished-product.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/missing-entity-404.spec.ts` — 4
- ${route} throws NotFoundException
- /get/product/slug (no slug) is a 404, not a 400 from the :id route
- /get/fabric-product/slug (no slug) is a 404, not a 400 from the :productId route
- /get/product/${bad} is a 400

### `apps/api/src/commerce/product/controller/product-size-profile.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/product-zoho-relation.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/product.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/segment.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/sku-group.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/special-status.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/sub-category.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/controller/tag.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/product/custom-product/mapper/custom-product.mapper.spec.ts` — 3
- maps a fully-populated input, stringifying price and stamping createdAt/updatedAt
- defaults unit to METER and string fields to empty string when absent
- maps name/productGroup/unit/price/images/remarks and stamps updatedAt, omitting sku/createdAt

### `apps/api/src/commerce/product/fabric-product/mapper/fabric-product.mapper.spec.ts` — 5
- attaches the caller-supplied productId and maps gsm/addToSwatch/width
- defaults addToSwatch to true when absent
- always overwrites gsm/addToSwatch/width unconditionally
- defaults addToSwatch to true when absent
- forces productGroup to 

### `apps/api/src/commerce/product/fabric-product/repository/fabric-product.repository.spec.ts` — 7
- retrieveEntity: null for a missing row, a failure propagates
- findByProductId: null for a missing row, a failure propagates
- update: returns null for a missing row, throws OptimisticLockError on a version race
- deleteById: returns 0 for a missing row, throws OptimisticLockError on a version race
- findFabricOverviews: empty is still [], a query failure propagates instead of an empty admin table
- findFabricFilterPreviewByIds: returns [] without querying when given no ids
- findFabricFilterPreviewPage: a query failure propagates instead of an empty storefront PLP

### `apps/api/src/commerce/product/fabric-product/service/fabric-product.batching.spec.ts` — 6
- issues exactly one query for a whole CSV column
- returns rows in CSV token order, not query order
- yields null for a token with no row — as retrieveEntity(id) used to
- keeps duplicate tokens duplicated but queries each id once
- short-circuits an empty or absent column without touching the database
- fires every enrichment lookup concurrently rather than one at a time

### `apps/api/src/commerce/product/finished-product/finished-product.port.spec.ts` — 2
- a genuine 0 price is persisted as \
- persists the real ids it was given

### `apps/api/src/commerce/product/finished-product/mapper/finished-product.mapper.spec.ts` — 1
- wraps the caller-supplied productId with no other fields

### `apps/api/src/commerce/product/finished-product/service/finished-product.enrich.spec.ts` — 5
- looks each entity up by its own id, not the product id
- returns each list as an array, and an empty csv as an empty list
- exposes the product row under both 
- returns null for an unknown slug
- treats an id past 2^53 as a miss rather than rounding it into another row

### `apps/api/src/commerce/product/product-preview/mapper/fabric-preview.mapper.spec.ts` — 1
- coerces bigint id/version/productId to Number and leaves product null for later enrichment

### `apps/api/src/commerce/product/product-preview/mapper/finished-preview.mapper.spec.ts` — 1
- coerces bigint id/version/productId to Number and leaves product null for later enrichment

### `apps/api/src/commerce/product/product-preview/mapper/main-product-preview.mapper.spec.ts` — 3
- coerces id/version to Number and defaults heroImage to empty string when null
- coerces a non-null mainProductId to Number rather than leaving it a bigint/string
- preserves a populated heroImage rather than blanking it

### `apps/api/src/commerce/product/product-preview/mapper/nav-product-preview.mapper.spec.ts` — 2
- coerces bigint id/version/subCategoryId to Number, leaves category/segment null, and defaults transient list fields to []
- defaults patternId to empty string when null but preserves a populated patternId/heroImage

### `apps/api/src/commerce/product/product-preview/mapper/product-preview.mapper.spec.ts` — 5
- coerces numeric-string columns to Number and computes totalQuantity as quantity + externalQuantity
- leaves category/segment null and defaults transient list fields to []
- defaults nullable string fields (tagId/patternId/heroImage/hoverImage) to empty string
- preserves null on nullable FK-id fields rather than coercing to 0
- coerces a non-null nullable FK-id field to Number

### `apps/api/src/commerce/product/product-preview/mapper/product-search-preview.mapper.spec.ts` — 2
- coerces id/version/price/skuGroupId to Number and preserves null FK ids
- coerces non-null specialStatusId/mainProductId to Number

### `apps/api/src/commerce/product/product-preview/mapper/review-product-preview.mapper.spec.ts` — 2
- coerces id/version/subCategoryId to Number and defaults heroImage to empty string when null
- preserves a populated heroImage

### `apps/api/src/commerce/product/product-size-profile/mapper/product-size-profile.mapper.spec.ts` — 9
- maps every field, stringifying consumedFabric
- keeps consumedFabric null when input is null/absent, and defaults disabled to false
- writes the full persisted shape (no partial-update quirk)
- coerces the numeric-string consumedFabric column back to Number
- preserves null consumedFabric rather than coercing to 0
- coerces bigint id/version to Number and embeds the resolved sizeProfileOption
- allows a null sizeProfileOption
- maps snake_case native-query columns, coercing numeric strings to Number
- preserves a null consumed_fabric rather than coercing to 0

### `apps/api/src/commerce/product/product-zoho-relation/mapper/product-zoho-relation.mapper.spec.ts` — 6
- maps every field, stringifying purchasePrice/tax
- defaults zohoItemId/hsnCode to empty string, purchasePrice to 0.001, and disabled to false when absent
- writes the full persisted shape
- coerces purchasePrice/tax back to Number, sets product undefined and quantity to 0 (transient placeholder)
- always nulls quantity, since it
- maps snake_case native-query columns, coercing numeric strings to Number

### `apps/api/src/commerce/product/product/dto/product.dto.spec.ts` — 6
- a genuine 0 price survives — it must NOT become 1200
- keeps the real subCategoryId instead of 25051
- leaves quantity undefined when absent (DB default 0) — never a placeholder 100
- a genuine 0 quantity survives
- still requires an id
- accepts a full update body with a 0 price

### `apps/api/src/commerce/product/product/mapper/product.mapper.spec.ts` — 16
- lowercases, strips non-alphanumerics to hyphens, and collapses/trims them
- collapses consecutive separators into one hyphen
- trims sku, regenerates slug from name, and defaults optional fields
- nulls mainProductId when mainProductCheck is true, even if a mainProductId was supplied
- passes through mainProductId when mainProductCheck is false
- regenerates slug and trims sku when sku is provided
- leaves sku as-is (untrimmed, including null) when sku is null/undefined
- omits subCategoryId/skuGroupId/specialStatusId from the update set when absent or zero
- includes subCategoryId/skuGroupId/specialStatusId when present and non-zero
- nulls badgeProfileId when disabled, even if an id was supplied
- keeps badgeProfileId when enabled and non-zero
- nulls badgeProfileId when enabled but id is 0
- madeToOrder branch also sets madeToOrderFabricId when enabled, and nulls both when disabled
- finishProfile branch resets finishProfileItemId to empty string when disabled
- nulls mainProductId when mainProductCheck is true regardless of supplied mainProductId
- never writes productSpecificSizeProfile (no backing column, per source-gap note)

### `apps/api/src/commerce/product/product/product.module.spec.ts` — 8
- binds all fourteen cross-module ports
- binds every port to a real provider — never a 
- SUB_CATEGORY_PORT reads through SubCategoryService
- BADGE_PROFILE_PORT reads through ProfileService
- FABRIC_PROFILE_PORT reads the fabric_profile table, not a null literal
- PRODUCT_SIZE_PROFILE_PORT actually issues the wholesale delete
- PRODUCT_ZOHO_RELATION_PORT looks the relation up and writes 
- IMAGE_GALLERY_SEO_PORT replaces the gallery rows instead of dropping them

### `apps/api/src/commerce/product/product/repository/product.repository.spec.ts` — 15
- retrieveEntity: returns null for a missing id, the row otherwise
- retrieveEntity: a query failure propagates instead of a 404-shaped null
- findBySlug: returns null for an unknown slug, the row otherwise
- findBySlug: a query failure propagates rather than rendering a 404 PDP
- returns null for a missing product without attempting a write
- returns the updated row when the version-checked write succeeds
- throws OptimisticLockError when the row changed between read and write
- returns 0 for a missing product without attempting a delete
- returns 1 when the version-checked delete removed the row
- throws OptimisticLockError when the row changed between read and delete
- maps rows to the gist projection
- an empty catalogue is still []
- a query failure propagates instead of an empty PLP
- findNavMenuCraftMapping falls back to the plain segment/subcategory join when the fabric-scoped query is empty
- findNavMenuCraftMapping: a query failure propagates rather than serving an empty nav menu

### `apps/api/src/commerce/product/segment/mapper/segment.mapper.spec.ts` — 4
- maps categoryId/name/metaTitle/metaDescription and the resolved image urls, stamping timeOfCreation
- defaults metaTitle/metaDescription to empty string when absent
- always overwrites categoryId/name/metaTitle/metaDescription and omits icon/socialImage when not passed
- includes icon/socialImage only when a replacement was uploaded

### `apps/api/src/commerce/product/segment/repository/segment.repository.spec.ts` — 6
- findById: null for a missing row, the row otherwise
- findById: a query failure propagates
- findAll: an empty table is still [], a failure propagates
- maps the joined preview rows
- a query failure propagates instead of an empty filter panel
- a query failure propagates instead of reporting 0 subcategories

### `apps/api/src/commerce/product/sku-group/mapper/sku-group.mapper.spec.ts` — 2
- maps name and always server-stamps timeOfCreation
- writes only name, leaving timeOfCreation untouched

### `apps/api/src/commerce/product/sku-group/repository/sku-group.repository.spec.ts` — 6
- findAll: an empty table is still [], a failure propagates
- retrieveEntity: null for a missing row, a failure propagates
- returns null for a missing sku group without writing
- throws OptimisticLockError on a version race
- returns the mapped entity when the version-checked write succeeds
- a query failure propagates instead of an empty admin list

### `apps/api/src/commerce/product/special-status/mapper/special-status.mapper.spec.ts` — 2
- maps name and always server-stamps timeOfCreation
- writes only name

### `apps/api/src/commerce/product/special-status/repository/special-status.repository.spec.ts` — 5
- findAll: an empty table is still [], a failure propagates
- retrieveEntity: null for a missing row, a failure propagates
- returns null for a missing row without writing
- throws OptimisticLockError on a version race
- null for a missing id, a query failure propagates

### `apps/api/src/commerce/product/sub-category/dto/subcategory.dto.spec.ts` — 3
- rejects a missing segmentId instead of defaulting to 66059
- rejects a missing name instead of inventing \
- keeps the real segmentId it was given

### `apps/api/src/commerce/product/sub-category/mapper/subcategory.mapper.spec.ts` — 8
- maps every field, stamping timeOfCreation
- leaves a profile id undefined (omitted from the write) when absent or 0 on create
- defaults metaTitle/metaDescription/featured when absent
- always writes name/metaTitle/metaDescription/featured/segmentId
- clears a profile id to null when present-and-0
- sets a profile id when present-and-nonzero
- omits a profile id from the update set entirely when absent (leaves existing value untouched)
- only includes image fields that were actually re-uploaded

### `apps/api/src/commerce/product/sub-category/repository/subCategory.repository.spec.ts` — 8
- null for a missing row, the mapped entity otherwise
- a query failure propagates
- an empty table is still [], a failure propagates
- a query failure propagates instead of reporting 0 products
- returns null for a missing subcategory without writing
- throws OptimisticLockError on a version race
- scopes the bulk UPDATE to this subcategory
- a write failure propagates rather than silently leaving stale profile FKs on related products

### `apps/api/src/commerce/product/tag/mapper/tag.mapper.spec.ts` — 2
- maps name and always server-stamps timeOfCreation
- writes only name

### `apps/api/src/commerce/product/tag/repository/tag.repository.spec.ts` — 7
- returns [] without querying when given no ids
- a query failure propagates instead of dropping the tag list
- null for a missing tag, the row otherwise
- a query failure propagates
- returns null for a missing tag without writing
- throws OptimisticLockError on a version race
- maps BigInt-friendly columns, a failure propagates

### `apps/api/src/commerce/profile/controller/badge-profile.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/profile/controller/made-to-order-profile.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/profile/controller/size-profile.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/profile/mapper/profile.mapper.spec.ts` — 4
- every mapper returns null for a null row (mechanically identical guard)
- projects the documented size-profile fields
- projects id/profileId/label/icon/sortOrder
- projects the made-to-order fields

### `apps/api/src/commerce/profile/validators/profile.sanitizer.spec.ts` — 5
- trims a value
- passes undefined through unchanged
- trims profileName/displayName/disclaimer, leaves other fields untouched
- trims name only
- trims name and phone when present

### `apps/api/src/commerce/profile/validators/profile.validator.spec.ts` — 14
- accepts a valid input
- rejects a missing profileName
- rejects a missing disclaimer
- always returns null (unconditional stub)
- accepts a valid input
- rejects a missing name
- rejects a non-array items
- always returns null (unconditional stub)
- accepts a valid input
- rejects a missing profileName
- rejects a NaN minimumOrderQuantity
- accepts a valid id
- rejects a missing id
- always returns null (unconditional stub)

### `apps/api/src/commerce/report/controller/report.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/report/service/report.service.spec.ts` — 9
- emits Java
- formats each row as Java
- renders a genuine zero as 0.00 instead of a fabricated default
- passes includeDisabled straight through to the query
- emits Java
- repeats the resolved size-profile quantity in both quantity columns, as Java does
- renders 0.00 when no size profile matched the relation
- rejects an unknown type — ReportFactoryService throws IllegalArgumentException
- emits only the header when there are no rows, never placeholder data

### `apps/api/src/commerce/response-key-contract.spec.ts` — 1
- ${route} emits 

### `apps/api/src/commerce/review/controller/review.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/review/mapper/review.mapper.spec.ts` — 3
- maps a full row, converting ids to bigint and rating to number
- defaults headline/comment to empty string and status to PENDING when missing
- falls back createdAt to now() when missing

### `apps/api/src/commerce/review/service/review.service.spec.ts` — 8
- returns only the product
- does not pad a short page up to 
- returns an empty list for a product with no reviews — never a site-wide fallback
- never reaches for sub-category / category / fabric / generic reviews
- passes paging straight through
- scopes to a product when one is given
- stays site-wide when no product is given
- zeroes out an id that cannot address a row rather than falling back to the global figure

### `apps/api/src/commerce/review/validators/review.sanitizer.spec.ts` — 3
- trims and HTML-escapes every optional string field
- leaves missing optional fields undefined
- trims the status field only

### `apps/api/src/commerce/review/validators/review.validator.spec.ts` — 10
- accepts a minimal valid input
- rejects rating out of range (0)
- rejects rating out of range (6)
- accepts rating boundary values 1 and 5
- rejects a missing name
- rejects a name over 255 chars
- rejects a missing country
- rejects a description over 5000 chars
- accepts a documented status
- rejects an undocumented status

### `apps/api/src/commerce/search/controller/search.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/search/controller/search.controller.spec.ts` — 7
- returns a validation error without calling the service for an empty keyword
- returns productPreviewList from the service on success
- propagates a service error instead of answering 200 with an empty productPreviewList
- returns a validation error without calling the service for a keyword >= 300 chars
- returns the entity envelope from the service on success
- BUG (inconsistent with v1): has no try/catch, so a service error propagates as a rejected promise instead of a JSON error envelope
- validates, delegates to searchService.searchProductV2, and propagates service errors

### `apps/api/src/commerce/search/mapper/search.mapper.spec.ts` — 2
- maps a fully-populated raw row
- defaults image alt text to empty string and specialStatus to null when absent

### `apps/api/src/commerce/search/repository/search.repository.spec.ts` — 4
- caps results at 150 and maps nullable image/altText fields
- no matches is still [], a query failure propagates instead of an empty results page
- searchBlogs: stringifies bigint id, a query failure propagates
- searchStories: no matches is still [], a query failure propagates

### `apps/api/src/commerce/search/validators/search.validator.spec.ts` — 5
- accepts a normal search term
- rejects a non-string term
- rejects an empty (post-trim) term
- rejects a term at/over the 300-char boundary
- accepts a term just under the 300-char boundary

### `apps/api/src/commerce/seo/controller/seo.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/seo/validators/seo.sanitizer.spec.ts` — 2
- trims image and HTML-escapes altText for every list item
- defaults missing image/altText to empty strings

### `apps/api/src/commerce/seo/validators/seo.validator.spec.ts` — 5
- accepts a valid payload
- rejects a missing productId
- rejects a non-deleted item with a blank image
- rejects a non-deleted item with a blank altText
- skips image/altText checks for items marked deleted

### `apps/api/src/commerce/settings/controller/settings.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/settings/mapper/settings.mapper.spec.ts` — 3
- maps every field straight through, casting the enum-typed fields
- maps each row in the list
- returns an empty array for an empty list

### `apps/api/src/commerce/settings/validators/settings.sanitizer.spec.ts` — 1
- returns the request object unchanged

### `apps/api/src/commerce/settings/validators/settings.validator.spec.ts` — 3
- accepts a valid request
- rejects a missing id
- rejects a missing attributeValue

### `apps/api/src/commerce/shared/db-lookup.spec.ts` — 6
- selects from the table it was given and returns the real row
- returns null when the row genuinely does not exist
- narrows a real row to 
- returns null, not 
- returns every matching row
- short-circuits an empty id list without querying

### `apps/api/src/commerce/shipment/controller/shipment.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/shipment/mapper/shipment.mapper.spec.ts` — 2
- maps input fields, dropping id (not part of ShipmentEntity
- spreads the entity and casts locationType to string

### `apps/api/src/commerce/shipment/validators/shipment.sanitizer.spec.ts` — 2
- trims and HTML-escapes the name
- leaves a falsy name untouched rather than throwing

### `apps/api/src/commerce/shipment/validators/shipment.validator.spec.ts` — 9
- accepts a valid shipment
- rejects a blank name
- rejects a name over 255 chars
- rejects a non-positive baseAmount
- rejects a non-positive baseQuantity
- rejects a negative additionalAmount
- rejects an estimatedFromDay below 1
- rejects estimatedToDay not strictly greater than estimatedFromDay
- rejects a falsy locationType

### `apps/api/src/commerce/skill/controller/skill.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/skill/mapper/skill.mapper.spec.ts` — 2
- maps id/name/description straight through, dropping other fields
- maps id/artisanId/skillId/level straight through

### `apps/api/src/commerce/skill/validators/skill.sanitizer.spec.ts` — 3
- trims name and description
- leaves undefined name/description as undefined
- trims name and description while preserving other fields

### `apps/api/src/commerce/skill/validators/skill.validator.spec.ts` — 4
- returns no errors for a valid name
- returns an error when name is missing
- returns no errors for a valid id
- returns an error when id is missing

### `apps/api/src/commerce/swallowed-failure.spec.ts` — 27
- happy path is unchanged: { success, message, products }
- a genuinely empty catalogue is still a 200 with products: []
- a query failure propagates instead of masquerading as an empty catalogue
- /get/fabric-preview-list: happy path unchanged, failure propagates
- happy path is unchanged: the service payload is returned verbatim
- a failure propagates rather than serving an empty menu {}
- findById: happy path unchanged (formatted row), missing row is still null
- findById: a query failure propagates instead of returning null (= 
- findAll / findRecent: empty table is still [], query failure propagates
- findAllWithCount: a query failure propagates instead of { rows: [], total: 0 }
- findByArtisan: the no-rows fallback still runs, but a query failure propagates
- CatalogApiController.getCatalogList: happy path unchanged, failure propagates
- CatalogApiController.getCatalog: an unknown id is still data: null, a failure is not
- CustomerDomainController.get_get_customers: failure propagates, empty stays empty
- SuperUserDomainController order search: no longer hardcodes success:true on failure
- SuperUserDomainController custom-order search: same contract
- TableExplorer data dump: happy path unchanged, empty table stays empty, failure propagates
- Workflow table-explorer read: empty stays empty, failure propagates
- Artisan incentive config: the NO-ROWS default fallback still runs; a query failure does not
- Artisan step assignment no longer reports 
- Profiles finish-profile list: empty stays empty, failure propagates
- Artisan payment ledger: failure propagates instead of an empty ledger
- AI embedding stats no longer reports status ACTIVE when the DB is down
- Forex admin read by id: failure propagates (no storefront caller for /get/forex/:forexId)
- /get/discount-list still degrades to an empty list — apps/storefront/src/app/api/checkout/discount/route.ts
- /get/forex-list still degrades to an empty list — apps/storefront/src/stores/currency.store.ts
- /get/ip-wise/currency still falls back to INR — public route, external geo-IP dependency

### `apps/api/src/commerce/table_explorer/controller/table_explorer.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/table_explorer/service/table_explorer.service.spec.ts` — 4
- serves an allowlisted slug (orders) with pagination
- rejects a non-allowlisted table name with 400 before any query runs
- getTableRowById honours the allowlist and returns null for a missing row
- every allowlisted name passes the gate (no self-blocking typos)

### `apps/api/src/commerce/tenant/controller/customer-account.controller.spec.ts` — 11
- rejects a choice outside myself|business|skip
- does NOT report success for a declaration it cannot store
- answers with the keys the order dashboard reads, and offers nothing
- rejects an unknown action
- does not pretend a dismissal was recorded
- saves a name against the caller
- succeeds with nothing written when the buyer typed nothing
- saves the name but reports the business details it cannot store
- rejects an unrecognised sourcing value
- stores the currency upper-cased against the caller
- rejects a currency the storefront does not support

### `apps/api/src/commerce/tenant/controller/tenant.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/tenant/controller/tenant.controller.spec.ts` — 6
- ${handler} denies a token lacking ${allowedRole}
- ${handler} denies a bare ROLE_ADMIN token
- ${handler} allows a ${allowedRole} token
- rejects a non-string name without touching the service
- trims name and phone before they reach the service
- returns the payload under 

### `apps/api/src/commerce/tenant/mapper/tenant.mapper.spec.ts` — 10
- maps the REAL column names, not name/phone/type
- splits the display name into first and last
- converts a bigint id to a number so it survives JSON
- never silently drops the name — the exact reported failure
- defaults buyerType to b2c and to b2b for a wholesale role
- handles a single-word name and a missing name
- returns null for no row
- maps role and user_id, which are the real columns
- tolerates snake_case rows
- returns null for no row

### `apps/api/src/commerce/tenant/repository/tenant.repository.spec.ts` — 2
- setSelectedCurrency upserts the caller
- still reads a real tenant id (numeric string accepted, as before)

### `apps/api/src/commerce/tenant/validators/tenant.sanitizer.spec.ts` — 2
- trims name and phone
- leaves missing name/phone as undefined

### `apps/api/src/commerce/tenant/validators/tenant.validator.spec.ts` — 3
- accepts a valid input with no errors
- accepts an input with name omitted (no type check triggered)
- rejects a non-string name

### `apps/api/src/commerce/transmission/tracking.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/transmission/tracking.controller.spec.ts` — 24
- reports the record
- never invents a delivery estimate — estimatedDelivery is always null
- never invents timeline events — only the one status the record carries
- emits no timeline at all when the record carries no status
- surfaces missing fields as null rather than substituting a plausible value
- does not fall back to 
- returns null when the record carries no tracking information at all
- passes through searchedBy/searchValue and the stored payload fields verbatim
- returns tracking when the caller owns the order and a record matches
- IDOR: tenant B cannot read tenant A
- returns a not-found envelope when no record matches an owned order
- rejects a non-numeric order id before touching the service
- propagates a service error instead of swallowing it into not-found
- matches trackingNumber case-insensitively for an owner
- IDOR: a non-owner gets not-found even though the AWB exists
- rejects a blank tracking number without calling the service
- returns a not-found envelope when no AWB matches
- matches transmissionBatchNo case-insensitively and narrows orderIds to the caller
- IDOR: a batch containing none of the caller
- returns a not-found envelope when no batch matches
- filters out records with no transmissionBatchNo and maps the rest
- emits no fabricated rows when the table is empty
- drops a batch row that carries no tracking information rather than rendering it blank
- propagates a service error rather than reporting success with an empty list

### `apps/api/src/commerce/whatsapp/controller/whatsapp.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/whatsapp/mapper/whatsapp.mapper.spec.ts` — 2
- picks only id/tenantId/entityId/entityType/triggerType/status, dropping every other row field
- passes a null tenantId/entityId/entityType through unchanged

### `apps/api/src/commerce/whatsapp/service/whatsapp-delivery-status-polling.service.spec.ts` — 5
- pollSingle of a missing row returns the all-zero summary and queries nothing
- advances a row when Freshchat reports a forward transition, writing only non-blank fields
- never downgrades: a READ row reported as SENT only gets poll bookkeeping
- groups by request_id (one GET per send) and matches rows by recipient
- a 429 ends the run early with rateLimited=true; other failures are isolated

### `apps/api/src/commerce/workflow/controller/element-feedback.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/workflow/controller/step-element.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/workflow/controller/subprocess-element.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/workflow/controller/workflow.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/workflow/mapper/workflow.mapper.spec.ts` — 4
- maps id/templateId/orderId/status, dropping other row fields
- maps id/name/description/isActive
- preserves a false isActive rather than defaulting it
- maps id/elementId/feedbackText/artisanId

### `apps/api/src/commerce/zoho/controller/zoho.controller.gates.spec.ts` — 0

### `apps/api/src/commerce/zoho/guard/zoho-webhook.guard.spec.ts` — 5
- accepts a request carrying both Loom header values
- honours an env-overridden agent and a multi-entry IP allowlist
- accepts when X-Forwarded-For
- rejects a spoofed header set arriving from an unlisted peer
- is off by default, so an App Runner proxy peer does not break delivery

### `apps/api/src/common/auth/roles.guard.spec.ts` — 18
- allows the request through when no @RequireGate metadata is present (public route)
- throws UnauthorizedException when Authorization header is missing
- a header of 
- throws UnauthorizedException when the Authorization header is an empty string
- strips a single 
- strips repeated 
- treats the prefix case-insensitively (
- passes a header with no 
- throws ForbiddenException when the resolved tenant lacks the required gate authority
- returns true and attaches the resolved tenant to the request when authorized
- allows a properly signed token on a gated route
- REJECTS a forged token (valid 3-part shape, bogus signature) and sets no tenant
- REJECTS a token signed with the wrong secret and sets no tenant
- REJECTS a forged token carrying no roles claim (no implicit super-user grant)
- REJECTS a correctly signed but expired token
- REJECTS a malformed (non-JWT) token
- does not even look at a forged token on an ungated route, and sets no tenant
- stamps the gate code onto GATE_CODE_KEY metadata via SetMetadata

### `apps/api/src/common/config/env.schema.spec.ts` — 11
- passes with only the required keys set
- fails naming the missing required key when DATABASE_URL is absent
- fails naming the missing required key when AUTH_JWT_SECRET is absent
- never includes a secret value in the thrown error message
- defaults all four kill-switches to false when unset
- parses kill-switches set to 
- rejects an sk_live_ Stripe key when PAYMENTS_LIVE_MODE is false
- rejects an sk_live_ Stripe key even when PAYMENTS_LIVE_MODE is true but NODE_ENV is not production
- accepts an sk_live_ Stripe key when PAYMENTS_LIVE_MODE is true and NODE_ENV is production
- accepts an sk_test_ Stripe key with PAYMENTS_LIVE_MODE false
- rejects a Stripe key that is neither sk_test_ nor sk_live_

### `apps/api/src/common/health/health.module.spec.ts` — 2
- exposes exactly one controller with a check() handler returning status ok
- returns a numeric, non-negative uptime

### `apps/api/src/common/middleware/request-id.middleware.spec.ts` — 2
- generates an id when none is provided
- preserves an incoming x-request-id

### `apps/api/src/common/params/id-param.spec.ts` — 7
- accepts a well-formed id and preserves it exactly past 2^53
- accepts an integer supplied as a number (JSON body ids)
- rejects an id past the postgres bigint bound with 400, not a 500
- names the offending field in the message
- converts ids inside the safe range
- returns null rather than a rounded id
- accepts a real slug

### `apps/api/src/common/response/rain-response.spec.ts` — 5
- returns exactly {success, message}
- preserves success:false through
- defaults success to true and message to empty string
- accepts an explicit success/message override
- passes an empty-array payload through untouched

### `apps/api/src/database/database.int.spec.ts` — 4
- connects and runs a raw query
- resolves the introspected schema — the loom_tenant mapping matches real columns
- resolves a relational query across a foreign key
- has the tables the schema declares

## apps/cms

### `apps/cms/src/app/api/auth/login/route.test.ts` — 20
- rejects a malformed JSON body without touching the backend
- requires both email and password
- sends the backend BOTH username and email — the Loom contract keys the lookup on username
- stores the backend JWT in an httpOnly session cookie
- accepts the backend
- writes an httpOnly identity cookie carrying the email and a derived display name
- rejects the login when the backend refuses and no sandbox fallback token is configured
- rejects the login when the backend is unreachable entirely
- DELETE clears both session cookies
- REGRESSION: a wrong password is rejected even with SANDBOX_ADMIN_TOKEN set
- does not open the sandbox path merely because the service token exists
- refuses the sandbox path in production even when every flag says otherwise
- refuses when the sandbox credential is enabled but not configured
- rejects the configured sandbox email with the WRONG password
- rejects a DIFFERENT email with the configured sandbox password
- admits ONLY the configured sandbox credential, matched exactly
- a real backend credential still wins without any sandbox configuration
- mints a weave_session cookie binding the issued token, which the middleware verifies
- fails LOUDLY (500, no cookies) when CMS_SESSION_SECRET is unset — never an unverifiable session
- signing out clears the session cookie too

### `apps/cms/src/app/api/crud/route.test.ts` — 26
- refuses a write path that is not in WRITE_REGISTRY
- refuses a path whose first segment is not a write verb
- refuses an uppercase VERB outright — WRITE_VERBS is case-sensitive and fails closed
- refuses an HTTP method outside POST/PATCH/PUT/DELETE
- refuses a relative segment rather than forwarding a traversal
- returns 503 when no service token can be minted, rather than forwarding unauthenticated
- refuses an UPDATE of a live-mirrored workflow template (the backend does NOT guard this route)
- allows the same UPDATE once the id is above the sandbox floor
- refuses a banded write that carries NO id at all — 
- refuses a non-integer id rather than letting Number() coerce it past the floor
- checks EVERY id source a rule declares, so a sandbox id in one slot cannot smuggle a live id in another
- bands a case-varied path — the backend routes update/WORKFLOW to the same handler
- does not let an ENCODED 
- does not let an encoded 
- refuses a query string on a banded write — a second, unguarded way to address a row
- forwards a delete with the id in the path and no body
- forwards a body on DELETE when one is supplied (cancel/order takes a cancellationReason)
- propagates the backend
- answers 502 rather than a bare success when the backend is unreachable
- overwrites a caller-supplied authorName on add/workflow-comment with the session
- refuses an unauthenticated comment rather than attributing it to nobody
- rejects a non-object body on an identity-bearing path instead of spreading a string
- puts tenantId on the QUERY STRING — a body tenantId is ignored by the backend and records approved_by NULL
- stamps WHO signed into the record text, ahead of the operator
- discards a caller-supplied tenantId already on the query rather than appending a second one
- refuses a sign-off with no session — an approval with no actor is the thing being fixed

### `apps/cms/src/app/api/product/create/route.test.ts` — 9
- create POSTs to /add/fabric-product with the payload forwarded verbatim
- create routes a finished product to /add/finished-product
- save PATCHes to /update/fabric-product — a different verb AND a different family
- save routes a finished product to /update/finished-product
- forwards the session cookie as a bearer token and the Origin the backend validates on
- still forwards, unauthenticated, when there is no session cookie — the backend is the authority
- propagates a rejected write
- answers 503 with the cause when the backend is unreachable
- does not report an empty backend body as a successful save

### `apps/cms/src/app/catalog/categories/page.test.tsx` — 3
- renders the list when the backend answers normally
- renders an ERROR STATE, not an empty list, when the backend rejects the envelope
- renders an error state on an HTTP failure too

### `apps/cms/src/lib/admin-api.test.ts` — 4
- returns normalized rows on a valid envelope
- rejects with the backend
- rejects on a 500
- getSettings rejects rather than reporting 

### `apps/cms/src/lib/artisanflow-api.test.ts` — 55
- returns the rows on a good envelope
- sends the paging contract the endpoint expects, with the documented defaults
- omits orderType and tenantId entirely when unset, rather than sending 
- PROPAGATES a {success:false} rejection instead of rendering it as an empty order list
- PROPAGATES a 401 as an auth fault, so a token mismatch is not read as 
- PROPAGATES a 500 as a server fault
- PROPAGATES a 503 as 
- PROPAGATES an unreachable backend as a network fault
- DEGRADES a 200 with no matching row to null — 
- keeps 
- falls back to the first array on the envelope when the named key is absent
- swallows an auth failure so the board degrades to 
- PINNED: it also swallows a rejection and a 500, which its sibling queue does NOT
- the review queue, by contrast, propagates a 500 rather than showing an empty review list
- the queue keeps every status count present even when the backend sends a partial map
- returns jobs from BOTH endpoints — the production board needs standard and custom
- keeps a CUSTOM_ORDER job whose id collides with an ORDER job — the two id sequences are independent
- still dedupes a genuine repeat of the same (type, id)
- fails the whole read when only the CUSTOM endpoint answers a 200-with-rejection
- propagates a systemic failure from either endpoint rather than half-rendering the board
- makes no request at all for an empty id list
- re-keys the backend
- takes the earliest start and latest end across a job
- ignores deleted steps
- returns null rather than epoch 0 when no step carries a real date
- ADDS adjustmentType 1 and SUBTRACTS everything else
- reports a wholesale discount as the loyalty figure and HIDES it from the visible line items
- matches the wholesale line case-insensitively and ignores surrounding whitespace
- does not divide by zero when the order has no subtotal
- leaves the total untouched when there are no adjustments
- sums one item
- does not leak another item
- tolerates a record with no nested list
- readyQty sums the ready records the same way
- reads a fabric item from the fabric product preview
- prefers the custom product for a non-fabric item, falling back to the finished preview
- falls back to the item id rather than rendering a blank row
- calls a completed node on time when it finished before its planned end
- reports how many days a completed node overran by
- derives a completed node
- reports an incomplete node past its due date as overdue
- measures an IN_PROGRESS node from when it actually started, not from the plan date
- flags the three-day window as due-soon and anything beyond it as on-track
- says 
- names the WORST overdue leaf as the bottleneck, not merely the first
- descends to subprocesses and names the leaf with its parent step
- skips deleted steps and deleted subprocesses
- is on track with a next-due label when nothing has slipped
- projects a slipped completion date from the worst stage delay
- counts the delivery window itself being blown even when every stage looks fine
- uses the LATEST actual completion across steps and subprocesses for a finished job
- reports a finished job delivered inside its window as on schedule
- puts steps in TEMPLATE order, which the backend does not return them in
- falls back to id order on a broken chain rather than dropping steps
- tolerates an empty or absent step list

### `apps/cms/src/lib/artisans-api.test.ts` — 4
- normalizes tenant-nested fields on a valid envelope
- rejects with the backend
- rejects on a 500
- getSkillList rejects rather than hiding a rejection as an empty skill list

### `apps/cms/src/lib/auth-service.test.ts` — 11
- stores the token under plain 
- also shatters the token into 5 obfuscated chunk keys that reconstruct it
- retrieveJWT prefers the plain jwt/token key over the chunks
- retrieveJWT reconstructs from chunks alone when the plain keys are absent
- retrieveJWT returns null when nothing is stored
- clears all 9 localStorage keys written across login: token, jwt, authority, user_email, and all 5 chunk keys
- hasValidJWT is true whenever a non-empty token string is present, regardless of expiry
- hasValidJWT does not call isTokenExpired: an expired-looking JWT still counts as valid
- isTokenExpired is dead code (zero callers in the app) but is characterized here: true for an expired exp claim
- isTokenExpired returns false for a well-formed token with a future exp
- isTokenExpired returns true for a too-short or garbage token

### `apps/cms/src/lib/backend-fetch-error.test.ts` — 10
- returns the parsed envelope on a good response
- treats {success:false} at HTTP 200 as a failure and surfaces the backend
- classifies an envelope rejection as 
- distinguishes an HTTP failure from a business rejection
- classifies 401/403 as an auth fault
- names the calling module in the message so a log points at the right file
- passes a success envelope through
- passes a bare array through (some endpoints answer unwrapped)
- falls back to a generic message when the backend sends success:false with no message
- does not treat success:true or a missing success key as a failure

### `apps/cms/src/lib/catalog-api.test.ts` — 3
- returns the parsed list on a valid envelope
- rejects with the backend
- rejects on a 500

### `apps/cms/src/lib/config.test.ts` — 5
- defaults RAW_SERVER_ENDPOINT to a hardcoded production URL when the env var is unset
- uses NEXT_PUBLIC_SERVER_ENDPOINT when set
- SERVER_ENDPOINT is the in-browser proxy path in a DOM environment (window defined under jsdom)
- LFS_SERVER_ENDPOINT uses NEXT_PUBLIC_LFS_SERVER_ENDPOINT when set, else the bloomscorp default
- dead flags (FAKE_API, BYPASS_AUTH, MAINTENANCE_MODE, SECURE_CONNECT) are static constants with no env wiring

### `apps/cms/src/lib/content-api.test.ts` — 4
- returns the parsed list on a valid envelope
- rejects with the backend
- rejects on a 500
- keeps 

### `apps/cms/src/lib/custom-products-api.test.ts` — 14
- normalizes a row, coercing absent numerics to 0 rather than NaN
- keeps a non-numeric price at 0 instead of letting NaN reach the screen
- preserves the difference between an absent timestamp and a zero one
- returns ok:false with the backend
- returns ok:false on a 401 — a token mismatch must not read as an empty catalogue
- returns ok:true with [] when the list key is missing entirely
- returns the normalized product
- returns null for a real 404 — the backend now says 
- still THROWS on 401 — a 4xx that is not 404 is a fault, not an empty record
- returns null for a 200 that carries no product — genuinely not found
- THROWS on a backend failure, unlike the list — the detail page must banner, not 404
- pins the two canonical groups and units so the sandbox never invents a third
- labels a known group and falls back to an em dash for an empty one
- splits the live CSV media field, dropping blanks and surrounding whitespace

### `apps/cms/src/lib/load-or-banner.test.tsx` — 5
- renders the loaded data when the read succeeds
- renders the classified message as an alert instead of an empty list
- banners an envelope rejection too — a refusal is not 
- lets a genuine bug in the loader propagate rather than disguising it as a backend outage
- does NOT catch an exception thrown by render — only the load is guarded

### `apps/cms/src/lib/profiles-api.test.ts` — 3
- returns the parsed list on a valid envelope
- rejects with the backend
- rejects on a 500

### `apps/cms/src/lib/whatsapp-api.test.ts` — 13
- classifies every trigger type present in the live data as transactional
- files an unseen promotional trigger as MARKETING via the keyword fallback
- lets marketing win a keyword tie, so a promo is never buried as an order message
- defaults an unknown, non-order trigger to TRANSACTIONAL rather than mislabelling it
- maps the row, taking the recipient name from tenantName and classifying the trigger
- sorts newest first, falling back to createdAt for rows with no sentAt
- returns ok:false with the backend
- returns ok:false on a 500 and on an unreachable backend
- returns ok:true with an empty list when the backend genuinely has no sends
- parses the stored preference JSON and keeps the opt-in status binary
- treats a missing opt-in flag as OPTED_OUT — never assume consent
- survives malformed preference JSON on one row instead of failing the whole list
- returns ok:false rather than an empty consent list when the backend refuses

### `apps/cms/src/middleware.test.ts` — 23
- redirects an unauthenticated page request to /login, preserving where it was going
- returns 401 JSON — not a redirect — for an unauthenticated /api/* call
- lets the login page and the login POST through without a session
- does NOT treat /api/auth/me as public — it is only reachable with a session
- admits a well-formed, unexpired JWT accompanied by its login-minted session cookie
- REJECTS a well-formed, unexpired JWT without the session cookie — presence + shape is no longer a session
- rejects a forged JWT even when a session cookie exists for a DIFFERENT token
- rejects a session cookie whose HMAC is wrong
- rejects an EXPIRED session cookie even for the right token
- fails CLOSED when CMS_SESSION_SECRET is unset — no JWT session verifies
- rejects an EXPIRED JWT rather than accepting any non-empty string
- rejects a token that is not a three-part JWT
- rejects a JWT whose payload is not decodable JSON
- admits a JWT with no exp claim when its session cookie binds it (the cookie carries the expiry)
- PINNED: the raw SANDBOX_ADMIN_TOKEN is accepted as a session token
- does not accept ANY cookie value when SANDBOX_ADMIN_TOKEN is unset
- challenges even the public login page — it sits IN FRONT of the session gate
- challenges a request holding a valid session but no basic-auth header
- passes a correct credential through to the session gate
- rejects a wrong password, and a password containing a colon is compared whole
- is disabled entirely when the credentials are not configured (the VPS)
- redirects the local-only tools to /dashboard so their server code never runs
- leaves them reachable when the flag is unset

## apps/storefront

### `apps/storefront/src/app/api/auth/guest-checkout/route.test.ts` — 10
- accepts a guest and parks the identity in an httpOnly cookie
- creates no account — nothing about a password or registration is returned
- gives an address that already has an account the identical answer (no enumeration oracle)
- rejects a malformed address — a property of the request, not of our customer table
- rejects a missing name
- rejects a body that is not JSON
- reports no guest session when the cookie is absent
- resumes an in-flight checkout from the cookie
- reports no guest session when the cookie is corrupt rather than throwing
- expires the guest cookie

### `apps/storefront/src/app/api/auth/login/route.test.ts` — 8
- calls Loom
- accepts a 
- treats success:false as a rejection even when a token-shaped field is present
- answers 401 and sets no session when the backend rejects the credentials
- never mints a session of its own when the backend is unreachable
- rejects a missing credential before touching the backend
- has no fs import anywhere under src/lib/auth
- does not compare a password in the login route

### `apps/storefront/src/app/api/auth/me/route.test.ts` — 8
- reports an anonymous visitor without calling the backend
- tears the session down when the cookie is not a JWT at all
- reads a passwordless identity out of a token this server signed
- does NOT trust a forged token
- falls back to the Loom profile for a legacy token and maps b2c by default
- reports logged-out (never a half-session) when the profile call fails
- clears the cookie and the buyer-mode for OUR OWN token once its exp has passed
- never serves the profile carried by an expired token

### `apps/storefront/src/app/api/auth/register/route.test.ts` — 5
- REFUSES to report success when Loom answers 200 with success:false
- creates the account and parks the authenticated JWT in an httpOnly cookie
- reports the failure when Loom rejects with an error status
- rejects an incomplete payload without calling the backend at all
- rejects a password under six characters without calling the backend

### `apps/storefront/src/app/api/backend/[...path]/route.test.ts` — 8
- rejoins the catch-all segments and preserves the query string
- rewrites Origin/Referer and injects the table-explorer token the backend demands
- promotes the jwt_token cookie to an Authorization header
- does NOT attach a stale session to an auth entry point
- does not overwrite an Authorization header the caller already set
- forwards the request body on a write
- passes a backend rejection through unchanged instead of masking it as success
- answers 502 with the legacy envelope when the backend is unreachable

### `apps/storefront/src/app/api/checkout/order/route.test.ts` — 8
- refuses an order from a caller with neither a session nor a guest cookie
- takes the guest identity from the httpOnly cookie and DISCARDS the one in the body
- uses the bearer token and sends no guest block for a logged-in buyer
- parks the guest order-status token in an httpOnly cookie
- sets no order cookie when the backend declines the order
- relays the backend
- answers 502 without claiming an order was created when the backend is unreachable
- rejects a body that is not JSON before touching the backend

### `apps/storefront/src/app/api/checkout/shipment/route.test.ts` — 6
- returns the guest quote from Loom
- uses the authenticated path and bearer token when a session exists
- fails with 502 — never a price — when every backend is unreachable
- relays the backend
- treats a reachable backend with an EMPTY list as no quote, not as a proceedable checkout
- returns no hardcoded rupee amount on any failure path

### `apps/storefront/src/app/api/profile/addresses/route.test.ts` — 8
- 401s an anonymous caller without touching the backend
- forwards the session token and returns the backend
- reports 502 with an empty list — never a silent success — when the backend fails
- 401s an anonymous caller and writes nothing
- saves through the backend and echoes the minted record
- reports the failure rather than pretending the address was saved locally
- forwards an empty object for an unparseable body instead of throwing
- relays a backend refusal instead of confirming an address that was never stored

### `apps/storefront/src/components/content-detail/sections-missing.test.tsx` — 5
- MobileOnThisPage does not throw when sections is missing
- TableOfContents does not throw when sections is missing
- ContentBody does not throw when sections is missing
- all three still render normally when sections are present
- handles an explicit empty list

### `apps/storefront/src/components/pdp/customization.test.tsx` — 7
- renders default fabric and viewable fabric cards
- calls onSelectFabric when an alternate fabric is clicked
- renders default fabric from product itself when madeToOrderFabric is undefined
- renders finish swatches and allows toggling finishes
- renders selected finish chips with remove trigger
- renders standard size buttons and selects size on click
- expands custom size form when Custom Size is clicked

### `apps/storefront/src/components/product/DiscoverCraft.test.tsx` — 5
- renders nothing when there are no stories
- renders a normal story
- does NOT throw when title is null — the PDP outage
- does NOT throw when title is undefined
- still renders the other cards when one story has a null title

### `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.test.ts` — 12
- maps a fabric row, deriving the product from fabricProductPreview.product
- exposes the PREVIEW id as productId, since that is what /add/cart-item binds to
- recomputes the unit price from the preview product plus makingCharge, as Loom stores no price
- falls back to finishedProductPreview when the row is a finished product
- degrades to a placeholder product when neither preview is present
- keeps IN_STOCK orderType and minOrderQuantity = 1 when volume discount profile has pre-order tiers
- aggregates count and subtotal across the cartItemList
- charges nothing on an empty cart rather than the flat shipping rate
- defaults to an empty cart when called with no argument
- reports NO shipping quote for a non-empty cart rather than inventing a flat rate
- does not scale, or otherwise invent, a rate as the cart grows
- returns none of the invented shipping amounts at any cart size

### `apps/storefront/src/lib/api/adapters/legacy-catalog.adapter.test.ts` — 16
- returns the placeholder for a missing/empty path
- passes an already-absolute URL through unchanged
- prefixes a relative path with the S3 base URL, adding a leading slash if missing
- maps a full DTO field by field
- falls back to defaults for a minimal/empty DTO
- treats a zero price as a real price, not a missing one (?? not ||)
- treats availableQuantity of 0 as out of stock (
- treats a negative availableQuantity as out of stock too
- falls back through the image field priority: primaryImage > imageUrl > images[0] > coverImage
- builds a specifications list only from present fields, plus free-form specifications map
- uses placeholder copy when description/care/origin/certification are missing
- reads a plain array payload and maps each item, including recursive children
- falls back through navigationList / categories / payload wrapper shapes
- defaults to an empty category list and the fallback promo banner when nothing matches
- uses the backend promo banner text/link when provided
- map a representative legacy and nest product payload to the same domain shape

### `apps/storefront/src/lib/api/adapters/nest-cart.adapter.test.ts` — 3
- maps a cart item, deriving totalPrice from the DTO
- maps cart totals directly from the DTO with no derivation (unlike the legacy adapter)
- defaults currency to INR when the DTO omits it

### `apps/storefront/src/lib/api/adapters/nest-catalog.adapter.test.ts` — 5
- maps a full DTO field by field
- falls back to the thumbnail as gallery when galleryUrls is empty, and is out of stock when stockQuantity is 0
- is out of stock when isAvailable is true but stockQuantity is 0 (both must hold)
- builds specifications only from present fields and falls back to summary for description
- maps nav items and marks featured collections by presence of a badge

### `apps/storefront/src/lib/api/client.test.ts` — 13
- always returns the Next proxy path in the browser, regardless of mode
- on the server, resolves the legacy Spring Boot URL for legacy mode
- on the server, resolves the Nest URL for nest mode
- on the server with no mode argument, defaults to env.NEXT_PUBLIC_API_MODE (legacy)
- adds a leading slash to an endpoint that lacks one
- does not double a leading slash the endpoint already has
- strips a trailing slash from the base URL before joining
- issues a GET by default and returns the parsed JSON body
- sends provided params as a query string, omitting undefined/null values
- sends default Content-Type/Accept headers, overridable by caller headers
- forwards method and JSON body for a POST
- throws an Error including the status and URL when the response is not OK
- does not validate the response shape — a mismatched payload is returned as-is (cast, not parse)

### `apps/storefront/src/lib/api/repositories/auth.repository.test.ts` — 11
- POSTs credentials to authenticate/email and returns the JWT
- throws on a 401 (bad credentials) rather than swallowing it
- throws on a 500 error envelope
- unwraps the {entity} envelope Loom actually returns
- swallows a failing request and falls back to { registered: false } instead of throwing
- reports a Google account as invalid for BASIC and names the real provider
- reports a password account as valid
- fails open to the password form rather than stranding the user on a network error
- POSTs a tenant-wrapped payload to customer/registration/email
- wraps the Auth0 ID token as the tenant password under 
- POSTs the email and returns the success confirmation

### `apps/storefront/src/lib/api/repositories/cart.repository.test.ts` — 14
- reads the cart from the /api/cart BFF route, not the /api/backend proxy
- treats a signed-out session as a genuinely empty cart, not an error
- THROWS on a backend failure instead of reporting an empty cart
- raises CartAuthError on a 401 so the UI can offer sign-in
- raises CartAuthError when the BFF flags an expired session with reauth
- POSTs the flat Loom CartItem entity to /api/cart/add
- omits zero/absent foreign keys rather than sending 0, which Loom cannot join
- throws on Loom
- raises CartAuthError when the session has expired
- sends the quantity and the product FK — never a price
- throws on Loom
- POSTs the cart row id to /api/cart/remove
- throws on Loom
- raises CartAuthError on an expired session

### `apps/storefront/src/lib/api/repositories/catalog.repository.test.ts` — 8
- fetches /get/navigation and maps the payload envelope to HeaderNavigation
- swallows a fetch failure and falls back to an empty navigation model
- POSTs pagination/filter params to /get/fabric-preview-list and maps the product list
- returns an empty product list with totalPages 1 when content is empty
- swallows a fetch failure and returns an empty result with totalPages 0
- GETs /get/fabric-product/slug/:slug (URL-encoded) and maps to ProductDetail
- returns null (not a throw) when the product fetch fails
- GETs /v1/products with page/limit/search/category/sortBy as query params

### `apps/storefront/src/lib/api/repositories/checkout.repository.test.ts` — 9
- maps the backend
- passes a real delivery estimate through
- leaves a missing delivery estimate ABSENT rather than inventing 5/7 or 7/12 days
- keeps a genuine same-day 0 estimate instead of turning it into 5 days
- keeps a genuine 0 instead of substituting a default charge
- throws — never a fabricated quote — when the backend fails
- throws on a 500 rather than falling back to invented prices
- treats an empty list as no quote available
- refuses an option the backend sent with no price at all

### `apps/storefront/src/lib/api/repositories/plp.repository.test.ts` — 7
- requests /api/plp with group and category query params and returns the parsed data
- defaults every field to an empty array when the route returns nothing for a key
- swallows a non-OK response and returns the empty-data shape rather than throwing
- requests /api/plp/related?ids=... and unwraps relatedProductsList
- short-circuits to an empty array without any network call when ids is empty
- requests /api/plp/segments?category=... and unwraps segmentList
- returns an empty array on a non-OK response instead of throwing

### `apps/storefront/src/lib/api/repositories/profile.repository.test.ts` — 8
- attaches an explicit Authorization header and flattens the nested tenant
- sends no Authorization header when no JWT is supplied
- throws on a 401 rather than swallowing it (no try/catch in this repository)
- unwraps the legacy {success,message,addressList} envelope into an Address[]
- returns an empty array for an empty envelope
- POSTs the address body to add/address and returns the response
- issues a DELETE to delete/address/:id
- unwraps the legacy {success,message,orderList} envelope into an Order[]

### `apps/storefront/src/lib/auth/error-message.test.ts` — 7
- translates every known code to something actionable
- gives the wrong-password case a message about the password
- replaces a code embedded in a longer sentence
- passes a real human message through untouched
- falls back for an empty or missing message
- uses the caller fallback when one is given
- does not swallow an UNKNOWN code — it should look odd, not vanish

### `apps/storefront/src/lib/auth/otp-store.test.ts` — 10
- a code issued by one instance verifies from another — the reported bug
- creates its table on first use
- never stores the code in plaintext
- rejects a wrong code
- rejects an expired code
- consumes the code — it cannot be replayed
- burns the code after 5 wrong guesses
- rejects an email with no outstanding code
- re-issuing replaces the previous code and clears attempts
- throws rather than silently falling back when DATABASE_URL is unset

### `apps/storefront/src/lib/auth/token-helper.test.ts` — 16
- round-trips a payload it signed itself
- produces the three-segment JWS shape with an HS256 header
- rejects a payload swapped under a valid signature (the privilege-escalation case)
- rejects a token minted with a different secret
- rejects an unsigned alg:none token carrying a full profile
- rejects a foreign (real Loom) token rather than reading its claims
- rejects malformed input without throwing
- rejects a correctly signed token whose payload is not JSON
- fails closed when the secret is absent instead of signing with a fallback
- does not silently accept tokens when the secret is absent
- rejects a correctly signed token whose exp has passed
- rejects a token that expires exactly now (>=, not >)
- rejects a signed token with NO exp — a session with no stated lifetime is immortal
- rejects a non-numeric or non-finite exp rather than coercing it
- accepts a token still inside its window
- separates 

### `apps/storefront/src/lib/cart/cart-helpers.test.ts` — 5
- calculates available stock for in-stock fabric product
- clamps requested quantity when exceeding available stock (e.g. ordered 10 when stock is 9)
- enforces 0.5 meter increment step for fabrics
- enforces MOQ for Pre-Order products
- returns 0.5 meter MOQ for IN_STOCK items even when minOrderQuantity is attached to params

### `apps/storefront/src/lib/checkout-session.test.ts` — 8
- round-trips an identity
- survives non-ASCII names (base64url of UTF-8, not latin1)
- returns null for a missing, empty or corrupt cookie instead of throwing
- refuses an identity with no email — checkout has nothing to key an order on
- drops non-string fields rather than passing them to the backend
- decodes a JSON array to null rather than an identity
- accepts ordinary addresses
- rejects the shapes that would produce an unreachable order

### `apps/storefront/src/lib/checkout/checkout-calculations.test.ts` — 18
- calculates shipping charge based on baseAmount and excess quantity per shipment option
- calculates shipping charge based on baseAmount + excess qty * additionalAmount
- supports explicit free shipping when flag is passed
- computes 100% advance for in-stock orders
- computes 50% advance for made-to-order items plus shipping
- applies coupon percentage discounts correctly
- formats dates properly
- reports no quote — not zero, not free — when no shipment is selected
- withholds every figure that depends on shipping, rather than understating it
- returns none of the amounts the old fallback invented
- invents nothing for an international address either
- still prices normally once a quote exists
- keeps a 0 base amount instead of substituting a default charge
- reports a free quote as free, and as HAVING a quote
- does not charge a per-unit surcharge the quote priced at 0
- returns undefined for a missing estimate instead of 
- still honours a real 0 as same-day
- offsets by a real day count

### `apps/storefront/src/lib/guest-cart.test.ts` — 17
- merges quantities for an identical line instead of duplicating it
- keeps a customised variant separate from the plain one
- keeps pre-order separate from in-stock for the same product
- keeps two different custom-size measurements as separate lines
- refreshes price and making charge on a re-add so a stale price cannot linger
- does not accumulate floating-point dust across repeated adds
- removes the line when the quantity is set to zero or below
- ignores an unknown key rather than clearing the cart
- returns an empty cart when localStorage holds something that is not an array
- notifies subscribers on change and stops after unsubscribe
- sends fabricProductId for a fabric line and drops the display fields
- sends finishedProductId for a finished line
- omits optional selections that were never made
- does nothing (and makes no request) for an empty guest cart
- replays every line to the account cart and clears the guest cart
- counts a rejected line as failed and still replays the rest
- never throws (login must not fail) when the network is down, and drops the cart rather than risking a double-add

### `apps/storefront/src/lib/loom/client.test.ts` — 12
- sends the Origin header Loom rejects requests without, and the bearer token
- throws a LoomError carrying the status and parsed body on a non-2xx
- tolerates an empty body rather than throwing a parse error
- blocks a POST that is not on the allowlist
- blocks the Loom gateway action routes specifically
- is not fooled by a query string appended to a blocked path
- is not fooled by a blocked path prefixed onto an allowlisted one
- allows the allowlisted cart write through
- allows any /authenticate* path through (the sign-in prefix)
- allows PATCH /update/cart-item but blocks every other PATCH
- allows DELETE of a numeric cart-item id only
- allows PUT under /manage/wishlist/ only

### `apps/storefront/src/lib/loom/forex-route-contract.test.ts` — 5
- the API controller source is reachable from the storefront
- is declared on the API
- is NOT role-gated — the storefront calls it with no token
- returns the response key the storefront reads (\
- the paths asserted here are the paths endpoints.ts actually requests

### `apps/storefront/src/lib/loom/public-route-contract.test.ts` — 5
- is declared on the API
- stays role-gated — no anonymous storefront caller (Loom: ${evidence})
- the API controller sources are reachable from the storefront
- is declared on the API
- is NOT role-gated — the storefront calls it with no token (Loom: ${evidence})

### `apps/storefront/src/lib/loom/token.test.ts` — 9
- accepts a token minted by apps/api (numeric sub + roles array)
- accepts the older wrapper shape (customerId + roles)
- accepts a numeric sub sent as a string
- REJECTS a legacy Loom token — opaque sub, no cleartext roles
- REJECTS a well-formed JWT carrying no roles claim
- rejects malformed input
- accepts a legacy token so auth/me falls through to the backend
- accepts a token with no roles claim
- still rejects structurally invalid input

### `apps/storefront/src/lib/plp/filter-engine.test.ts` — 49
- sets calculatedPrice from price for fabric products, no discount fields untouched
- does NOT compute discounted price from max_discount fields (wholesale-only in Angular)
- preserves API-provided calculatedDiscountedPrice when present
- returns no discounted price when max_discount_product_price is absent
- defaults price-less product to calculatedPrice 0
- calculates finished product price as basePrice + (fabricPrice * consumedFabric)
- uses made_to_order_fabric_price when present for finished product
- falls back to product.price as fabric price when no MTO fabric price for finished product
- builds a toggle cohort with a single inactive option
- groups sub-category options under their parent segment
- splits csv values, dedupes, and resolves display names from metadata
- falls back to the raw id as displayName when metadata has no match
- computes range min/max from actual product values
- defaults range min/max to 0/1000 when no products supplied
- skips the hidden 
- returns every product unchanged when no filters are active
- filters by a single active csv option (color)
- filters by sub-category (segment_category -> sub_category)
- narrows to the selected sub-option even when its parent is also active
- returns the whole parent segment when a parent is active with no sub-option selected
- unions sub-options selected across different parent segments
- filters inStock toggle to products with quantity > 0
- treats size_profile_option_list quantity as in-stock even when total_quantity is 0
- filters by price range, inclusive of both bounds
- excludes a product exactly one unit outside the range bound
- does not apply a range filter still at its default bounds
- combines a csv filter and a range filter with AND semantics
- returns an empty array when combined filters match nothing
- matches csv product if it shares any one of multiple active ids
- sorts in-stock products first for 
- sorts by descending id for 
- sorts ascending price for 
- sorts descending price for 
- returns products unchanged (stable, no reorder) for an unknown sort key
- does not mutate the input array
- returns no chips when nothing is active
- emits a csv chip for an active color option
- emits a range chip once the range is moved off its default
- emits a sub chip for an active sub-category option
- resets active options, sub-options, and range bounds back to defaults
- names the price param 
- does not serialise a range still at its full bounds — that is not a filter
- serialises a narrowed range as from-to
- SURVIVES a controls rebuild: the filter still applies after re-preparing from the URL
- clamps an out-of-range URL value to the catalogue bounds
- ignores a malformed or inverted URL value rather than filtering everything away
- a hyphenated slug selects the matching sub-category and nothing else
- does NOT widen to the whole parent segment
- an unknown slug activates nothing rather than emptying the grid

### `apps/storefront/src/lib/profile/adapters.test.ts` — 8
- maps Loom
- keeps a zero total instead of falling back (the falsy-zero bug class)
- does not invent a status for an unknown value
- reads 
- yields empty collections rather than throwing when they are absent
- returns null membership when the customer is not enrolled
- maps the live loyaltyProgramInfo aggregates
- zeroes the aggregates instead of inventing them when absent

### `apps/storefront/src/stores/cart.store.test.ts` — 7
- starts empty so the header badge renders 0 on the server and first client render
- refresh() loads the cart from the /api/cart BFF route
- refresh() surfaces an auth failure instead of pretending the cart is empty
- refresh() keeps a previously loaded cart when a later read fails
- refresh() reports a signed-out session as an empty cart, not an error
- open()/close() drive the side tab
- does NOT persist to localStorage — the cart belongs to the bearer token, not the browser

### `apps/storefront/src/stores/currency.store.test.ts` — 33
- defaults to inr when nothing is stored
- uses a valid stored currency
- is case-insensitive on the stored value
- falls back to inr for an invalid/garbage stored value
- inr is always 1.0 regardless of forexRates/forexList
- computes usd as forexRates.usd * forexList USD multiplier
- computes gbp as forexRates.gbp * forexList GBP multiplier
- computes eur as forexRates.eur * forexList EUR multiplier
- uses selectedCurrency when no target is passed
- falls back to DEFAULT_RATES when the currency is missing from forexRates but present in the default map
- falls back to 1.0 base rate and 1.25 conversion for a currency present in neither map
- converts to usd
- converts to gbp
- converts to eur
- passes inr through unchanged
- uses selectedCurrency as the default target when none is passed
- returns 0 for a zero price
- returns 0 for NaN
- formats usd with symbol code and 2dp
- formats gbp
- formats eur
- formats inr with thousands separator and no decimals when whole
- uses selectedCurrency as the default target when none is passed
- updates selectedCurrency state
- lowercases the currency before storing
- persists the selection to localStorage under the selectedCurrency key
- attaches NO client-side Authorization header — the proxy adds the session cookie
- syncs the selection to the profile endpoint
- silently swallows a failed profile sync (fire-and-forget, no throw)
- on success, merges live rates over defaults (inr pinned to 1.0) and uses the returned forexList
- falls back to DEFAULT_FOREX_LIST when the response
- characterizes failure: both requests erroring falls back to DEFAULT_RATES/DEFAULT_FOREX_LIST, no throw, isLoading cleared
- sets isLoading true synchronously while the fetch is in flight

### `apps/storefront/src/stores/wishlist.store.test.ts` — 2
- toggles a product SKU in wishlist
- parses CSV wishlist from customer profile

## packages/types

### `packages/types/src/schemas/customer.schema.test.ts` — 2
- accepts a valid customer
- rejects a bad email and unknown provider
