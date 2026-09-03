/**
 * Explicit allowlist for the generic table-explorer handler.
 *
 * WHY THIS EXISTS
 * `TableExplorerRepository` interpolates the caller's `tableName` into
 * `sql.identifier(...)`, i.e. it addresses a physical Postgres relation. The
 * identifier is quoted, so this is not SQL-injectable — but with no allowlist a
 * single compromised or over-provisioned `CODE_SU` session could dump *any*
 * table in the database (payment transactions, tenant credential columns,
 * verification tokens) through one endpoint. That is blast radius, and this
 * list is the blast door: a name that is not here returns 400 instead of rows.
 *
 * HOW IT WAS DERIVED (nothing here is speculative — every entry has a caller)
 *  1. Every `/get/table-explorer/data/<slug>` route that already exists in this
 *     API. These are the curated legacy entity slugs; the CMS's candidate-slug
 *     resolver (`apps/cms/src/app/api/table-explorer/route.ts`) can send any of
 *     them at the generic handler when the dedicated route does not win routing.
 *  2. The raw snake_case table names returned by `/get/table-explorer/tables`
 *     (`commerce/domain/table-explorer.controller.ts`). That endpoint is what
 *     feeds the CMS Table Explorer page's table picker, so every name it lists
 *     is a name the CMS will request verbatim as its first candidate.
 *  3. Slugs the CMS requests by hard-coded literal rather than through the
 *     picker: `sub-category` (SubCategoriesClient.tsx), `workflow` and the three
 *     `*-artisan-mapping` projections (lib/artisanflow-api.ts),
 *     `blog-content-section` / `story-content-section` (lib/content-api.ts), and
 *     `whatsapp-notification-history` (lib/whatsapp-api.ts and the
 *     `app/api/loom/[...path]` proxy allowlist).
 *
 * Adding a table here is a deliberate act: it widens what one super-user token
 * can read in bulk. Do not add a name without a caller.
 */
const ALLOWED_TABLE_NAMES = [
  // --- (1) curated entity slugs with an existing per-entity route -----------
  "address",
  "artisan",
  "authentication-log",
  "blog-content",
  "blog-content-category",
  "blog-content-section",
  "blog-content-type",
  "blog-vector",
  "cart-item",
  "catalog",
  "catalog-item",
  "catalog-item-media",
  "catalog-pdf",
  "category",
  "color",
  "cron-job-log",
  "custom-order",
  "custom-order-adjustment",
  "custom-order-fulfillment",
  "custom-order-item",
  "custom-order-item-fulfillment",
  "discount",
  "element",
  "element-feedback",
  "element-template",
  "fabric-product",
  "fabric-product-data",
  "fabric-profile",
  "fabric-profile-item",
  "faq",
  "faq-question",
  "finish-profile",
  "finish-profile-item",
  "finished-product",
  "forex",
  "forex-exchange-rate",
  "inventory-adjustment",
  "inventory-adjustment-item",
  "inventory-adjustment-reason",
  "inventory-restock-request",
  "log",
  "loom-tenant",
  "loyalty-program-config",
  "loyalty-program-config-audit-log",
  "order-fulfillment",
  "order-item",
  "order-item-fulfillment",
  "order-review-scheduled-email",
  "orders",
  "product",
  "product-fabric",
  "product-finished",
  "product-image-gallery-seo",
  "product-size-profile",
  "product-vector",
  "product-zoho-relation",
  "purchase-order-feedback",
  "razorpay-transaction",
  "review",
  "segment",
  "shipment",
  "skill",
  "sku-group",
  "special-status",
  "step-element",
  "step-element-artisan-mapping",
  "step-element-template",
  "story-content",
  "story-content-category",
  "story-content-section",
  "story-product-mapping",
  "story-vector",
  "stripe-transaction",
  "sub-category",
  "sub-process-element",
  "subprocess-element-artisan-mapping",
  "subprocess-element-template",
  "super-user",
  "tag",
  "verification-token",
  "volume-discount-profile",
  "volume-discount-profile-item",
  "warehouse",
  "workflow",
  "workflow-artisan-mapping",
  "workflow-custom-order-mapping",

  // --- (3) hard-coded CMS caller with no per-entity route on this side ------
  "whatsapp-notification-history",

  // --- (2) raw table names served by /get/table-explorer/tables ------------
  // The CMS picker sends these verbatim as its first candidate.
  "authentication_log",
  "cron_job_log",
  "inventory_adjustment_reason",
  "inventory_restock_request",
  "loom_tenant",
  "purchase_order_feedback",
  "sub_process_element",
  "verification_token",
] as const;

const ALLOWED = new Set<string>(ALLOWED_TABLE_NAMES);

/** The allowlist, for tests and for anything that needs to enumerate it. */
export const TABLE_EXPLORER_ALLOWLIST: readonly string[] = ALLOWED_TABLE_NAMES;

export function isTableExplorerTableAllowed(tableName: string): boolean {
  return ALLOWED.has(tableName);
}
