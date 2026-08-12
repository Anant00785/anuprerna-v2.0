# Test catalogue

> **Generated file — do not edit.** Produced by `scripts/gen-docs/index.mjs` from the code
> itself. Run `pnpm docs:gen` to refresh; CI runs `pnpm docs:check` and fails if this file is
> stale. Every test in the repository and the behaviour it protects.

**593 tests across 82 files.**

- `apps/api` — 52 files, 335 tests
- `apps/cms` — 15 files, 93 tests
- `apps/storefront` — 14 files, 163 tests
- `packages/types` — 1 files, 2 tests

## apps/api

### `apps/api/src/auth/service/gatekeeper.pepper.int.spec.ts` — 1
- stored password hashes on real accounts are bcrypt cost-11, and verifyPassword runs against one without throwing

### `apps/api/src/auth/service/gatekeeper.service.spec.ts` — 13
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

### `apps/api/src/commerce/cart/mapper/cart.mapper.spec.ts` — 6
- maps a fully-populated input onto insert values, stringifying quantity/makingCharge
- defaults customSize to {} when absent
- defaults makingCharge to \
- defaults click/utm attribution fields to null when undefined
- does not set fabricProductId/finishedProductId/selectedFabricId/selectedSizeOptionId — those are attached separately by CartService after preview lookups
- writes only quantity and lastUpdatedAt (source quirk #1: every other field is intentionally left untouched on update)

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

### `apps/api/src/commerce/filter/mapper/filter.mapper.spec.ts` — 4
- maps a fully populated row, coercing snake_case DB columns to camelCase fields
- defaults missing/undefined fields to zero-values instead of throwing
- maps a fully populated row
- defaults missing fields to zero-values

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

### `apps/api/src/commerce/nverse/mapper/nverse.mapper.spec.ts` — 2
- maps a row to a verification token DTO
- returns null for a null/undefined row

### `apps/api/src/commerce/nverse/validators/nverse.sanitizer.spec.ts` — 4
- trims and lowercases
- returns undefined for an undefined/empty input
- strips non-digit characters
- returns undefined for an undefined/empty input

### `apps/api/src/commerce/nverse/validators/nverse.validator.spec.ts` — 10
- accepts email + password
- accepts contactNumber + password (email not required)
- rejects when neither email nor contactNumber is present
- rejects when password is missing
- accepts a request with a contactNumber
- rejects a request missing contactNumber
- accepts contactNumber + otp
- rejects when otp is missing
- accepts email + token
- rejects when token is missing

### `apps/api/src/commerce/order/order.controller.spec.ts` — 3
- getAll() delegates directly to service.getAll()
- create() delegates the raw body to service.create() untouched
- does not catch or transform errors thrown by the service

### `apps/api/src/commerce/order/order.service.spec.ts` — 10
- create() rejects a payload with no name (inherited CommerceDataService rule)
- create() rejects a payload whose name is an empty/whitespace string
- create() with a valid name persists into the generic commerce_order table and returns the inserted row
- findOne() throws NotFoundException naming the generic table when the id doesn
- findOne() rejects a non-numeric id before touching the database
- getAll() returns whatever rows the generic blob table yields (no 
- update() returns the updated row when the id exists
- update() throws NotFoundException when the id does not exist
- remove() resolves without error when the id exists
- remove() throws NotFoundException when the id does not exist

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

### `apps/api/src/commerce/payment/service/razorpay-payment.service.spec.ts` — 16
- rejects when the order does not exist (E1 boundary)
- rejects when no payment is due on the order
- uses advancePay for an advance session and remainingPay for a remaining session
- marks the order failed and throws when the transaction log write fails
- returns NO_ACTION when no matching transaction is found, without touching the order
- accepts the client-reported success at face value: no signature check runs before marking PAID
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

### `apps/api/src/commerce/review/mapper/review.mapper.spec.ts` — 3
- maps a full row, converting ids to bigint and rating to number
- defaults headline/comment to empty string and status to PENDING when missing
- falls back createdAt to now() when missing

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

### `apps/api/src/commerce/search/controller/search.controller.spec.ts` — 7
- returns a validation error without calling the service for an empty keyword
- returns entityList from the service on success
- swallows a service error into an empty entityList rather than propagating it
- returns a validation error without calling the service for a keyword >= 300 chars
- returns the entity envelope from the service on success
- BUG (inconsistent with v1): has no try/catch, so a service error propagates as a rejected promise instead of a JSON error envelope
- mirrors searchProduct: validates, delegates to searchService.searchProduct, and swallows errors into an empty entityList

### `apps/api/src/commerce/search/validators/search.validator.spec.ts` — 5
- accepts a normal search term
- rejects a non-string term
- rejects an empty (post-trim) term
- rejects a term at/over the 300-char boundary
- accepts a term just under the 300-char boundary

### `apps/api/src/commerce/seo/validators/seo.sanitizer.spec.ts` — 2
- trims image and HTML-escapes altText for every list item
- defaults missing image/altText to empty strings

### `apps/api/src/commerce/seo/validators/seo.validator.spec.ts` — 5
- accepts a valid payload
- rejects a missing productId
- rejects a non-deleted item with a blank image
- rejects a non-deleted item with a blank altText
- skips image/altText checks for items marked deleted

### `apps/api/src/commerce/settings/validators/settings.sanitizer.spec.ts` — 1
- returns the request object unchanged

### `apps/api/src/commerce/settings/validators/settings.validator.spec.ts` — 3
- accepts a valid request
- rejects a missing id
- rejects a missing attributeValue

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

### `apps/api/src/commerce/skill/validators/skill.sanitizer.spec.ts` — 3
- trims name and description
- leaves undefined name/description as undefined
- trims name and description while preserving other fields

### `apps/api/src/commerce/skill/validators/skill.validator.spec.ts` — 4
- returns no errors for a valid name
- returns an error when name is missing
- returns no errors for a valid id
- returns an error when id is missing

### `apps/api/src/commerce/tenant/mapper/tenant.mapper.spec.ts` — 2
- projects only id/name/email/phone/type, dropping extra row fields
- projects only id/roleName/tenantId

### `apps/api/src/commerce/tenant/validators/tenant.sanitizer.spec.ts` — 2
- trims name and phone
- leaves missing name/phone as undefined

### `apps/api/src/commerce/tenant/validators/tenant.validator.spec.ts` — 3
- accepts a valid input with no errors
- accepts an input with name omitted (no type check triggered)
- rejects a non-string name

### `apps/api/src/commerce/transmission/tracking.controller.spec.ts` — 20
- sets dispatchedAt to createdAt verbatim
- BUG: estimatedDelivery is synthesized as createdAt + 7 days, not a real carrier ETA
- BUG: the ORDER_PLACED timeline entry is fabricated as createdAt - 1 day, not a real event
- always includes a DISPATCHED entry at createdAt, naming the carrier
- falls back to 
- adds no IN_TRANSIT/DELIVERED entries for a status outside that set (e.g. still DISPATCHED)
- adds an IN_TRANSIT entry (createdAt + 1 day) when status is IN_TRANSIT, without a DELIVERED entry
- adds both IN_TRANSIT and DELIVERED entries, in order, when status is DELIVERED
- passes through searchedBy/searchValue and the payload fields verbatim into the envelope
- returns tracking when a record
- returns a not-found envelope when no record matches
- rejects a non-numeric order id before calling the service
- catches a service error and reports not-found rather than throwing
- matches trackingNumber case-insensitively
- rejects a blank/whitespace-only tracking number without calling the service
- returns a not-found envelope when no AWB matches
- matches transmissionBatchNo case-insensitively
- returns a not-found envelope when no batch matches
- filters out records with no transmissionBatchNo and maps the rest
- BUG (asymmetric with the other three endpoints): on a service error, returns success:true with an empty list instead of success:false

### `apps/api/src/common/auth/roles.guard.spec.ts` — 11
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

### `apps/cms/src/lib/api-helper.test.ts` — 17
- returns [] for null/undefined data
- returns [] for falsy non-object data (0, empty string)
- passes an array response through unchanged
- throws when success is false, using the message
- throws a default message when success is false and message is missing
- prefers the caller-supplied preferredKey when present, even over other array keys
- returns the preferredKey
- falls through to auto-detection when preferredKey is absent from the payload
- auto-detects the single array-valued property, ignoring metadata keys
- ambiguity: with multiple array-valued keys, the FIRST one in object key order wins (undocumented, order-dependent)
- unwraps the sole non-metadata object key when no array key exists
- does NOT unwrap a sole non-metadata key when its value is a primitive, not an object
- returns the raw object when there are multiple non-metadata keys and none are arrays
- returns the object unchanged for an empty object payload
- returns metadata-only payloads (all keys filtered out) as-is
- characterizes non-object primitive responses: a number falls through to the raw-return branch
- characterizes non-object primitive responses: a truthy string is indexed like an array-of-chars and returned as-is

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

### `apps/cms/src/lib/config.test.ts` — 5
- defaults RAW_SERVER_ENDPOINT to a hardcoded production URL when the env var is unset
- uses NEXT_PUBLIC_SERVER_ENDPOINT when set
- SERVER_ENDPOINT is the in-browser proxy path in a DOM environment (window defined under jsdom)
- LFS_SERVER_ENDPOINT uses NEXT_PUBLIC_LFS_SERVER_ENDPOINT when set, else the bloomscorp default
- dead flags (FAKE_API, BYPASS_AUTH, MAINTENANCE_MODE, SECURE_CONNECT) are static constants with no env wiring

### `apps/cms/src/services/artisan-service.test.ts` — 5
- sends includeInactive as a query param and normalizes tenant-nested fields
- has no try/catch: a success:false envelope propagates as a thrown error
- nests name/contactNumber/gender/dob/active under tenant in the request body
- nulls masterArtisanId when artisanRole is MASTER
- converts a dd/mm/yyyy string to an epoch timestamp, and passes numbers through

### `apps/cms/src/services/catalog-service.test.ts` — 4
- getCatalogListByArtisan hits the correct path-param URL and unwraps 
- getCatalogById unwraps the singular 
- propagates a rejected backend response as a thrown error
- generateCatalogPdfByArtisan POSTs to the artisan-scoped endpoint and unwraps the generation record

### `apps/cms/src/services/content-service.test.ts` — 5
- hits /get/blog-content-types and unwraps blogContentTypeList
- createBlog posts the partial payload as-is
- getBlogById sends the id in the path and unwraps the single-object blogContent key
- has no try/catch: a success:false envelope on getStories propagates as a thrown error
- hits /get/faqs and unwraps faqList, even though no page calls it yet

### `apps/cms/src/services/inventory-service.test.ts` — 4
- getInventoryAdjustments sends offset/limit/sku as query params and unwraps 
- getWarehouseById unwraps the singular 
- propagates a rejected response from getRestockRequests
- updateRestockRequestStatus PATCHes the exact payload shape

### `apps/cms/src/services/logistic-service.test.ts` — 10
- maps a UI tab status through ORDER_API_STATUS_MAP and sends it as the query param
- normalizes a raw backend order into the CustomerOrder shape
- propagates request failures instead of masking them as an empty array (consistent with deleteOrder)
- URL-encodes the keyword and sends offset/pageSize as pageNumber/pageSize
- has no try/catch: an errored DELETE propagates to the caller
- falls back to DEFAULT_SHIPMENTS when the backend returns an empty list
- propagates a request failure instead of silently falling back to DEFAULT_SHIPMENTS
- posts the payload to /add/shipment and propagates a failure instead of reporting fake success
- resolves with the backend response body on success
- normalizes currency/rate/markup field aliases from the backend

### `apps/cms/src/services/loyalty-service.test.ts` — 6
- builds an email-only query when email is provided
- builds a tenure+amount query when email is absent
- sends the active flag and unwraps customerList
- has no try/catch: a success:false envelope propagates as a thrown error
- posts the config payload as-is to /enable/loyalty-program
- flags a discount over 100% (pure function, no network)

### `apps/cms/src/services/product-service.test.ts` — 5
- getColors hits 
- getSegments returns [] when the response is not an array (defensive fallback)
- propagates an error-envelope rejection from the backend
- createColor trims name/hex and POSTs the expected payload shape
- getFinishedProducts falls back to 

### `apps/cms/src/services/report-service.test.ts` — 2
- POSTs the config to /download/report/:type as a blob request
- uses the filename from the content-disposition header when present

### `apps/cms/src/services/review-service.test.ts` — 6
- sends the exact path and query params, and unwraps the reviewList envelope
- has no try/catch: a success:false envelope propagates as a thrown error
- addReview posts the payload as-is to /add/review
- updateReview issues a PATCH to /update/super-user/review with the payload
- defaults to status=PENDING, pageNumber=0, pageSize=50 when called with no args
- does not manually set Content-Type on the FormData body, so the request resolves instead of hanging

### `apps/cms/src/services/settings-service.test.ts` — 5
- getSettings unwraps 
- getSettings propagates a backend error instead of silently returning hardcoded fallback data
- getSettings also falls back when the backend returns an empty settingsList array
- updateSettingsItem propagates the failure instead of reporting false success
- updateSettingsItem resolves true when the backend request succeeds

### `apps/cms/src/services/user-service.test.ts` — 4
- getCustomers hits 
- getUserByUID hits the path-param URL and unwraps the 
- propagates a rejected response from getCartOverviewList
- registerCustomer POSTs the given payload verbatim to 

### `apps/cms/src/services/workflow-service.test.ts` — 4
- getWorkflows defaults status to 
- getCustomWorkflows passes a caller-supplied status through to the URL
- getArtisanPayments unwraps 
- propagates a rejected response from getWorkflowFeedback

## apps/storefront

### `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.test.ts` — 9
- maps a full cart item, deriving the product from productDetails
- builds a placeholder product when productDetails is missing
- defaults qty to 1 and derives totalPrice from unitPrice * quantity when totalPrice is absent
- falls back to a random string id when both cartItemId and productId are missing
- treats an explicit unitPrice/totalPrice of 0 (a free item) as real, not absent
- aggregates item count and totals from the item list
- returns an empty cart shape for an empty/missing items list
- applies free shipping over 2000 subtotal, else a flat 150 charge, when deliveryCharge is absent
- map a representative legacy and nest cart to the same domain shape

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

### `apps/storefront/src/lib/api/repositories/auth.repository.test.ts` — 7
- POSTs credentials to authenticate/email and returns the JWT
- throws on a 401 (bad credentials) rather than swallowing it
- throws on a 500 error envelope
- POSTs to check-email/tenant and returns the tenant status
- swallows a failing request and falls back to { registered: false } instead of throwing
- POSTs the full registration payload to customer/registration
- POSTs the email and returns the success confirmation

### `apps/storefront/src/lib/api/repositories/cart.repository.test.ts` — 6
- fetches /get/cart-item/list and maps the payload envelope to a domain Cart
- swallows a fetch failure and returns an empty cart rather than throwing
- also swallows a 401 the same way — getCart never surfaces auth failure to the caller
- fetches /v1/cart and maps the NestApiResponse envelope to a domain Cart
- POSTs productId/quantity to /add/cart-item and returns the updated cart
- propagates a server error instead of swallowing it, unlike getCart

### `apps/storefront/src/lib/api/repositories/catalog.repository.test.ts` — 8
- fetches /get/navigation and maps the payload envelope to HeaderNavigation
- swallows a fetch failure and falls back to an empty navigation model
- POSTs pagination/filter params to /get/fabric-preview-list and maps the product list
- returns an empty product list with totalPages 1 when content is empty
- swallows a fetch failure and returns an empty result with totalPages 0
- GETs /get/fabric-product/slug/:slug (URL-encoded) and maps to ProductDetail
- returns null (not a throw) when the product fetch fails
- GETs /v1/products with page/limit/search/category/sortBy as query params

### `apps/storefront/src/lib/api/repositories/plp.repository.test.ts` — 7
- requests /api/plp with group and category query params and returns the parsed data
- defaults every field to an empty array when the route returns nothing for a key
- swallows a non-OK response and returns the empty-data shape rather than throwing
- requests /api/plp/related?ids=... and unwraps relatedProductsList
- short-circuits to an empty array without any network call when ids is empty
- requests /api/plp/segments?category=... and unwraps segmentList
- returns an empty array on a non-OK response instead of throwing

### `apps/storefront/src/lib/api/repositories/profile.repository.test.ts` — 8
- attaches an explicit Authorization header when a JWT is passed in
- sends no Authorization header when no JWT is supplied
- throws on a 401 rather than swallowing it (no try/catch in this repository)
- unwraps the legacy {success,message,addressList} envelope into an Address[]
- returns an empty array for an empty envelope
- POSTs the address body to add/address and returns the response
- issues a DELETE to delete/address/:id
- unwraps the legacy {success,message,orderList} envelope into an Order[]

### `apps/storefront/src/lib/plp/filter-engine.test.ts` — 34
- sets calculatedPrice from price, no discount fields untouched
- computes discounted price when max_discount fields present
- returns no discounted price when max_discount_product_price is absent
- treats a missing discount percentage as zero, not as a free product
- defaults price-less product to calculatedPrice 0
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

### `apps/storefront/src/stores/auth.store.test.ts` — 9
- should initialize with unauthenticated state
- should set token and mark logged in
- should set user profile
- should clear state on logout
- persists the jwt to localStorage under the anuprerna-auth key
- writes a jwt_token cookie when the token is set
- logout removes the persisted localStorage token
- logout removes the jwt_token cookie — no live token left behind
- the jwt_token cookie carries no Secure or HttpOnly flag (documents a known gap, not desired behaviour)

### `apps/storefront/src/stores/cart.store.test.ts` — 5
- adds and removes items
- appends rather than merges when the same productId is added twice
- remove() is a no-op when the productId is not in the cart
- clear() empties the cart regardless of item count
- persists items to localStorage under the anuprerna-cart key

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
- does not call the profile sync endpoint when unauthenticated (no jwt)
- syncs the selection to the profile endpoint when authenticated
- silently swallows a failed profile sync (fire-and-forget, no throw)
- on success, merges live rates over defaults (inr pinned to 1.0) and uses the returned forexList
- falls back to DEFAULT_FOREX_LIST when the response
- characterizes failure: both requests erroring falls back to DEFAULT_RATES/DEFAULT_FOREX_LIST, no throw, isLoading cleared
- sets isLoading true synchronously while the fetch is in flight

## packages/types

### `packages/types/src/schemas/customer.schema.test.ts` — 2
- accepts a valid customer
- rejects a bad email and unknown provider
