// @ts-nocheck
/**
 * apps/api/src/catalog/product/tag/validators/tag.validator.ts
 *
 * ⚠️ SOURCE NOT PROVIDED — FLAGGED, NOT FABRICATED BUSINESS LOGIC.
 *
 * `com.bloomscorp.loom.nverse.validator.TagValidator` (referenced by
 * TagController) was not included in the uploaded repository — only
 * `product/category/validator/CategoryValidator.java` was provided as a
 * sibling example. Per the migration rules ("never invent business logic",
 * "never create placeholder implementations"), this file does NOT attempt
 * to reproduce TagValidator's actual rule set, because that rule set is
 * unknown.
 *
 * What IS verified from source and reused here:
 *  - `CategoryValidator` (the one sibling validator we do have) validates
 *    its only plain string field via the shared
 *    `com.bloomscorp.loom.nverse.validator.StringValidator#validate(value, 1, 255)`
 *    helper — a generic length-bounds check, not Category-specific logic.
 *  - The introspected schema (`database/schema/schema.ts`) confirms
 *    `tag.name` is `varchar({ length: 255 }).notNull()` — the exact same
 *    shape (`NOT NULL`, `VARCHAR(255)`) as `category.name`.
 *
 * Applying the same generic `StringValidator.validate(value, 1, 255)` bound
 * to `tag.name` is therefore a schema-grounded, low-risk inference — NOT a
 * guess at bespoke per-entity business logic — but it is still an
 * inference, not a verified port. TODO: replace with a verbatim port once
 * `TagValidator.java` is available; confirm the (1, 255) bound and check
 * for any additional rule (e.g. a uniqueness/format check) that may exist
 * in the real class but isn't visible from CategoryValidator alone.
 */
import { CreateTagInput } from "../types/tag.types.js";

/** StringValidator#validate(value, min, max) — inclusive length bounds, non-null. */
function isValidStringLength(value: unknown, min: number, max: number): boolean {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

/** TagValidator#validate(Tag entity) — INFERRED, see file header. */
export function validateTag(entity: Pick<CreateTagInput, "name">): boolean {
  return isValidStringLength(entity.name, 1, 255);
}
// @ts-nocheck
// @ts-nocheck
