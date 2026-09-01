# Weave Feature Parity Report
Generated: 2026-07-05T18:14:16.581Z

## Summary

| Metric | Count |
| --- | --- |
| Controllers PRESENT (all endpoints found in sandbox source) | 15 |
| Controllers PARTIAL (some endpoints genuinely missing from sandbox source) | 9 |
| Controllers MISSING (no endpoints found in sandbox source) | 14 |
| Live Features PRESENT (sandbox nav + endpoint coverage) | 4 |
| Live Features PARTIAL (sandbox nav exists, some endpoints missing or TE-only) | 10 |
| Live Features MISSING (absent from sandbox entirely) | 1 |
| Extra sandbox improvements (not in live Loom nav) | 24 |
| TE-only entities (data via generic table-explorer, no dedicated view) | 41 |

---

## Section A — Gap Analysis by Controller

> **Method**: For each controller in `endpoint-dto-map.json`, strip path params to get static prefixes,
> then grep all `weave/src/**/*.ts(x)` files. PRESENT = all found; PARTIAL = some genuinely missing; MISSING = none found.
> `/get/table-explorer/data/<entity>` paths are marked COVERED-VIA-TABLE-EXPLORER (dynamic wrapper in source)
> and are excluded from the missing-endpoints list. (No endpoint-dto-map controller currently has TE paths —
> those are distributed per-entity in the Java backend but not listed in domain endpoint arrays.)

### MISSING Controllers (14)
| Controller | Domain | Endpoints | Sample Path |
| --- | --- | --- | --- |
| ProductController | products | 2 | /get/product-gist-list |
| ProductPreviewController | products | 2 | /get/product-preview-list/{category} |
| OrderFulfillmentController | orders | 2 | /get/super-user/order/{orderId}/fulfillment-list |
| OrderReadyController | orders | 1 | /get/super-user/order/{orderId}/ready-list |
| CustomOrderFulfillmentController | orders | 2 | /get/super-user/custom-order/{orderId}/fulfillment-list |
| CustomOrderReadyController | orders | 1 | /get/super-user/custom-order/{orderId}/ready-list |
| LoyaltyProgramInfoController | orders | 2 | /get/order/loyalty/info |
| SuperUserController | customers_tenants | 1 | /get/super-user/profile |
| StepElementController | workflow | 1 | /get/artisan/step-element-list/{status} |
| SubProcessElementController | workflow | 1 | /get/artisan/subprocess-element-list/{status} |
| StepElementArtisanAssignmentController | workflow | 1 | /get/step-element/{stepId}/artisan-assignments |
| SubProcessElementArtisanAssignmentController | workflow | 1 | /get/subprocess-element/{subProcessId}/artisan-assignments |
| FinishProfileItemController | profiles | 1 | /get/usage/finish-profile-item/{finishItemId} |
| SizeProfileOptionController | profiles | 1 | /get/usage/size-profile-option/{sizeProfileOptionId} |

### PARTIAL Controllers (9)
| Controller | Domain | Total Eps | Found | Missing Endpoint Paths |
| --- | --- | --- | --- | --- |
| FabricProductController | products | 4 | 1 | /get/fabric-product/slug/{productSlug} ; /get/v2/fabric-product/slug/{productSlug} ; /get/fabric-overview-list |
| FinishedProductController | products | 2 | 1 | /get/finished-product/slug/{productSlug} |
| OrderController | orders | 5 | 1 | /get/customer/order/{orderId} ; /get/customer/order-list/v2 ; /get/customer/order-list/all ; /get/customer/orders/status/processing |
| OrderPreviewController | orders | 2 | 1 | /get/customer/order-list |
| CustomOrderController | orders | 2 | 1 | /get/customer/custom-order/{orderId} |
| CustomerController | customers_tenants | 5 | 3 | /get/customer/profile ; /get/loyalty-eligible/customers |
| WorkflowController | workflow | 9 | 2 | /get/artisan/workflow-list/{status} ; /get/artisan/workflow/dashboard ; /get/artisan/workflow/{workflowId}/assigned-element-details ; /get/master/{masterId}/worker/{artisanId}/bpm-details ; /get/master/{masterId}/worker/{artisanId}/workflow/{workflowId}/assigned-element-details ; /get/order/{orderId}/workflow-list ; /get/order/{orderId}/workflow/{orderItemId} |
| CustomWorkflowController | workflow | 5 | 2 | /get/artisan/custom-workflow-list/{status} ; /get/custom-order/{orderId}/workflow-list ; /get/custom-order/{orderId}/workflow/{orderItemId} |
| ElementFeedbackController | workflow | 3 | 1 | /get/element/feedback-list ; /get/custom-workflow/element/feedback |

### PRESENT Controllers (15)
| Controller | Domain | Endpoints |
| --- | --- | --- |
| CustomProductController | products | 2 |
| FabricPreviewController | products | 1 |
| FinishedPreviewController | products | 1 |
| CustomOrderPreviewController | orders | 1 |
| PurchaseOrderFeedbackController | orders | 3 |
| ImpactFactorController | orders | 1 |
| TenantController | customers_tenants | 1 |
| WorkflowTemplateController | workflow | 2 |
| BadgeProfileController | profiles | 2 |
| FabricProfileController | profiles | 2 |
| FinishProfileController | profiles | 2 |
| MadeToOrderProfileController | profiles | 2 |
| SizeProfileController | profiles | 2 |
| VolumeDiscountProfileController | profiles | 2 |
| CustomSizeProfileController | profiles | 2 |

---

## Section B — Sandbox Improvements (EXTRA — not gaps)

Sandbox nav items with no counterpart in the live Loom nav (intentional additions):

- **Categories**
- **Segments**
- **Sub-categories**
- **SKU Groups**
- **Special Status**
- **Filters**
- **Profiles**
- **Loyalty**
- **Orders**
- **Production**
- **Custom Orders**
- **Custom Products**
- **Workflow Feedback**
- **Traceability**
- **Skills**
- **Story Review**
- **Reports**
- **Cron Jobs**
- **AI Embeddings**
- **Table Explorer**
- **Page Feedback**
- **Settings**
- **Rebuild Map**
- **Data Sync**

---

## Section C — Live Feature Gap (live-nav.json vs sandbox)

> **Method**: For each live-nav item, check explicit NAV_ALIAS map first, then fuzzy-match against sandbox NAV_BASE.
> No match → MISSING. Match found → check related endpoints from contract-manifest.json against sandbox source.
> Endpoints are classified as: FOUND (in source directly), COVERED-VIA-TABLE-EXPLORER (dynamic TE wrapper),
> or GENUINELY-MISSING (not in source and not a TE path).
> Status: PRESENT = all covered; PARTIAL = has genuine gaps OR TE-only sub-features (no dedicated view).

### MISSING Live Features (1)
| Live Nav Item | Section | Notes |
| --- | --- | --- |
| Artisan Payments | OPERATIONS | No sandbox nav item found |

### PARTIAL Live Features (10)

**Manage User** (sandbox: `Users`)
- Found directly: `/get/super-user/order-list`, `/get/super-user/order/`, `/get/super-user/order/`, `/get/super-user/order/`, `/get/super-user/custom-order-list`, `/get/super-user/custom-order/`, `/get/super-user/custom-order/`, `/get/super-user/custom-order/`, `/get/super-user/order/feedback/`, `/get/super-user/review`
- Genuinely missing: _none_
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/super-user`, `/get/table-explorer/data/user-role`

**Manage Artisans** (sandbox: `Artisans`)
- Found directly: `/get/artisan`, `/get/artisans`, `/get/artisan`
- Genuinely missing (not in source, not via TE): `/get/catalog-list/artisan/`, `/get/catalog-pdf-generation-list/artisan/`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/artisan`, `/get/table-explorer/data/artisan-skill-mapping`, `/get/table-explorer/data/step-element-artisan-mapping`, `/get/table-explorer/data/subprocess-element-artisan-mapping`, `/get/table-explorer/data/workflow-artisan-mapping`

**Manage Content** (sandbox: `Content`)
- Found directly: `/get/blog-content-types`, `/get/blog-content-category-list`, `/get/blog-content-list`, `/get/story-content-category-list`, `/get/story-content-list`, `/get/story-content/`, `/get/blog-content/`
- Genuinely missing: _none_
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/blog-content`, `/get/table-explorer/data/blog-content-category`, `/get/table-explorer/data/blog-content-section`, `/get/table-explorer/data/blog-content-type`, `/get/table-explorer/data/story-content`, `/get/table-explorer/data/story-content-category`, `/get/table-explorer/data/story-content-section`

**Manage Product** (sandbox: `Listings`)
- Found directly: `/get/finished-product/`, `/get/fabric-product/`, `/get/custom-product`, `/get/custom-product/{productId}`
- Genuinely missing (not in source, not via TE): `/get/story/product-previews/`, `/get/product-specific-size-profile-list`, `/get/product-specific-size-profile/`, `/get/usage/product-specific-size-profile-option/`, `/check/unique-product/name/`, `/check/unique-product/sku/`, `/get/product-preview-list`, `/get/product-gist-list`, `/get/product-gist-list`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/custom-product`, `/get/table-explorer/data/product`, `/get/table-explorer/data/product-fabric`, `/get/table-explorer/data/product-finished`, `/get/table-explorer/data/product-image-gallery-seo`, `/get/table-explorer/data/product-size-profile`, `/get/table-explorer/data/product-vector`, `/get/table-explorer/data/product-zoho-relation`, `/get/table-explorer/data/story-product-mapping`, `/get/table-explorer/data/temp-product-meta`

**Manage Catalogs** (sandbox: `Catalog`)
- Found directly: `/get/catalog/`, `/get/catalog-list`, `/get/catalog-pdf-generation/`
- Genuinely missing (not in source, not via TE): `/get/catalog-list/artisan/`, `/get/catalog-item/`, `/get/catalog-pdf-generation-list/artisan/`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/catalog`, `/get/table-explorer/data/catalog-item`, `/get/table-explorer/data/catalog-item-media`, `/get/table-explorer/data/catalog-pdf`

**Manage Inventory** (sandbox: `Inventory`)
- Found directly: `/get/inventory-adjustment-reason`, `/get/inventory-adjustment`, `/get/inventory-restock-request`
- Genuinely missing: _none_
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/inventory-adjustment`, `/get/table-explorer/data/inventory-adjustment-item`, `/get/table-explorer/data/inventory-adjustment-reason`, `/get/table-explorer/data/inventory-restock-request`

**Manage Feedbacks** (sandbox: `Order Feedback`)
- Found directly: `/get/element/feedback`, `/get/order/feedback-list`, `/get/super-user/order/feedback/`
- Genuinely missing (not in source, not via TE): `/get/custom-workflow/element/feedback`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/element-feedback`, `/get/table-explorer/data/purchase-order-feedback`

**Manage Reviews** (sandbox: `Reviews`)
- Found directly: `/get/fabric-preview-list`, `/get/finished-preview-list`, `/get/super-user/review`
- Genuinely missing (not in source, not via TE): `/get/story/product-previews/`, `/get/product-preview-list`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/order-review-scheduled-email`, `/get/table-explorer/data/review`

**Manage Workflow** (sandbox: `Workflow`)
- Found directly: `/get/workflow/`, `/get/workflow-template/`, `/get/workflow-template-list`, `/get/workflow-list/{status}`, `/get/custom-workflow-list/{status}`, `/get/custom-workflow/`
- Genuinely missing (not in source, not via TE): `/get/custom-workflow/element/feedback`
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/workflow`, `/get/table-explorer/data/workflow-artisan-mapping`, `/get/table-explorer/data/workflow-custom-order-mapping`, `/get/table-explorer/data/workflow-template`

**Wholesale Program** (sandbox: `Wholesale`)
- Found directly: `/get/loyalty-program/customers/metrics`
- Genuinely missing: _none_
- Covered via Table Explorer (data reachable, no dedicated view): `/get/table-explorer/data/loyalty-program-config`, `/get/table-explorer/data/loyalty-program-config-audit-log`

### PRESENT Live Features (4)
- **Dashboard** → sandbox `Dashboard`
- **Manage Whatsapp** → sandbox `WhatsApp`
- **Manage Logistics** → sandbox `Logistics`
- **Impact Factor** → sandbox `Impact Factor`

### Table Explorer Only Entities (41 entities across all features)

> These entities are data-reachable via the generic `/table-explorer` page but have no dedicated
> sandbox feature view. Useful port-backlog signal — not a gap in the strict sense, but worth
> dedicated pages for each as the sandbox matures.

- `artisan`
- `artisan-skill-mapping`
- `blog-content`
- `blog-content-category`
- `blog-content-section`
- `blog-content-type`
- `catalog`
- `catalog-item`
- `catalog-item-media`
- `catalog-pdf`
- `custom-product`
- `element-feedback`
- `inventory-adjustment`
- `inventory-adjustment-item`
- `inventory-adjustment-reason`
- `inventory-restock-request`
- `loyalty-program-config`
- `loyalty-program-config-audit-log`
- `order-review-scheduled-email`
- `product`
- `product-fabric`
- `product-finished`
- `product-image-gallery-seo`
- `product-size-profile`
- `product-vector`
- `product-zoho-relation`
- `purchase-order-feedback`
- `review`
- `step-element-artisan-mapping`
- `story-content`
- `story-content-category`
- `story-content-section`
- `story-product-mapping`
- `subprocess-element-artisan-mapping`
- `super-user`
- `temp-product-meta`
- `user-role`
- `workflow`
- `workflow-artisan-mapping`
- `workflow-custom-order-mapping`
- `workflow-template`

---

## Nav Diff

### Present in live nav but ABSENT in sandbox
- **Artisan Payments** (OPERATIONS)

### Present in live nav with PARTIAL sandbox coverage
- **Manage User** → sandbox `Users`
  - TE-only (no dedicated view): /get/table-explorer/data/super-user, /get/table-explorer/data/user-role
- **Manage Artisans** → sandbox `Artisans`
  - Genuinely missing: /get/catalog-list/artisan/, /get/catalog-pdf-generation-list/artisan/
  - TE-only (no dedicated view): /get/table-explorer/data/artisan, /get/table-explorer/data/artisan-skill-mapping, /get/table-explorer/data/step-element-artisan-mapping, /get/table-explorer/data/subprocess-element-artisan-mapping, /get/table-explorer/data/workflow-artisan-mapping
- **Manage Content** → sandbox `Content`
  - TE-only (no dedicated view): /get/table-explorer/data/blog-content, /get/table-explorer/data/blog-content-category, /get/table-explorer/data/blog-content-section, /get/table-explorer/data/blog-content-type, /get/table-explorer/data/story-content, /get/table-explorer/data/story-content-category, /get/table-explorer/data/story-content-section
- **Manage Product** → sandbox `Listings`
  - Genuinely missing: /get/story/product-previews/, /get/product-specific-size-profile-list, /get/product-specific-size-profile/, /get/usage/product-specific-size-profile-option/, /check/unique-product/name/, /check/unique-product/sku/, /get/product-preview-list, /get/product-gist-list, /get/product-gist-list
  - TE-only (no dedicated view): /get/table-explorer/data/custom-product, /get/table-explorer/data/product, /get/table-explorer/data/product-fabric, /get/table-explorer/data/product-finished, /get/table-explorer/data/product-image-gallery-seo, /get/table-explorer/data/product-size-profile, /get/table-explorer/data/product-vector, /get/table-explorer/data/product-zoho-relation, /get/table-explorer/data/story-product-mapping, /get/table-explorer/data/temp-product-meta
- **Manage Catalogs** → sandbox `Catalog`
  - Genuinely missing: /get/catalog-list/artisan/, /get/catalog-item/, /get/catalog-pdf-generation-list/artisan/
  - TE-only (no dedicated view): /get/table-explorer/data/catalog, /get/table-explorer/data/catalog-item, /get/table-explorer/data/catalog-item-media, /get/table-explorer/data/catalog-pdf
- **Manage Inventory** → sandbox `Inventory`
  - TE-only (no dedicated view): /get/table-explorer/data/inventory-adjustment, /get/table-explorer/data/inventory-adjustment-item, /get/table-explorer/data/inventory-adjustment-reason, /get/table-explorer/data/inventory-restock-request
- **Manage Feedbacks** → sandbox `Order Feedback`
  - Genuinely missing: /get/custom-workflow/element/feedback
  - TE-only (no dedicated view): /get/table-explorer/data/element-feedback, /get/table-explorer/data/purchase-order-feedback
- **Manage Reviews** → sandbox `Reviews`
  - Genuinely missing: /get/story/product-previews/, /get/product-preview-list
  - TE-only (no dedicated view): /get/table-explorer/data/order-review-scheduled-email, /get/table-explorer/data/review
- **Manage Workflow** → sandbox `Workflow`
  - Genuinely missing: /get/custom-workflow/element/feedback
  - TE-only (no dedicated view): /get/table-explorer/data/workflow, /get/table-explorer/data/workflow-artisan-mapping, /get/table-explorer/data/workflow-custom-order-mapping, /get/table-explorer/data/workflow-template
- **Wholesale Program** → sandbox `Wholesale`
  - TE-only (no dedicated view): /get/table-explorer/data/loyalty-program-config, /get/table-explorer/data/loyalty-program-config-audit-log

---

## Validation Gate Results

| # | Feature | Expected | Actual | Pass? |
| --- | --- | --- | --- | --- |
| 1 | Impact Factor (ImpactFactorController / `/get/impact/order/{orderId}`) | PRESENT | PRESENT | ✓ PASS |
| 2 | Manage Whatsapp — consent + notification-history both found (whatsapp-api.ts + dedicated history tab in WhatsAppClient.tsx) | PRESENT | PRESENT | ✓ PASS |
| 3 | Manage Logistics | PRESENT | PRESENT | ✓ PASS |
| 4 | Wholesale Program (alias ok; loyalty-config is TE-only -> PARTIAL) | PARTIAL | PARTIAL | ✓ PASS |
| 5 | Artisan Payments (workflow artisan-payments) | MISSING | MISSING | ✓ PASS |
| 6 | Zero mutation (read-only invariant: no non-GET handlers under api/(impact|logistics|wholesale|loom), no mutating fetches in whatsapp/impact/logistics/wholesale, allowlisted GET-only loom proxy) | PASS | PASS | ✓ PASS |
| 7 | Enum-union lint (status literals at getWorkflowList / derive* / status-styling call sites must be in the live OrderStatus / PaymentStatus / WorkflowStatus union) | PASS | PASS | ✓ PASS |
| 8 | Order Feedback (Manage Feedbacks -> dedicated /order-feedback list + detail; both GET endpoints found in source, nav item present, read-only) | PRESENT | PRESENT | ✓ PASS |

> **ImpactFactorController (Section A note)**: Controller-level analysis shows **PRESENT**
> because `/get/impact/order/` IS present in `artisanflow-api.ts` (called by the Traceability feature).
> Feature-level analysis (Section C) now shows **PRESENT** — a dedicated /impact nav item
> was added to the sandbox; Impact Factor surfaces as a standalone feature (not only inline in Traceability.

> **Manage Whatsapp (Section C detail)**: Found `/get/customers/whatsapp-status`, `/get/table-explorer/data/whatsapp-notification-history`.
> Genuinely missing: _none_.
> Gate originally expected PARTIAL (notification-history was not yet ported). It is now PRESENT:
> `weave/src/lib/whatsapp-api.ts` added a dedicated `getWhatsAppNotificationHistory()` that
> hardcodes `/get/table-explorer/data/whatsapp-notification-history`, and `WhatsAppClient.tsx`
> renders a full "Message History" tab backed by it. Both endpoints found directly in source.
