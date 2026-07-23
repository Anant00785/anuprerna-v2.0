// Single source of truth for cross-app types.
// Every API read the audit found untyped (364 of them) gets a Zod schema here,
// so storefront/cms/worker consume validated, typed data — never `any`.
export * from "./schemas/customer.schema.js";
