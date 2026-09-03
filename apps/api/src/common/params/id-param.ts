import { BadRequestException } from "@nestjs/common";

/**
 * Strict path-parameter id parsing.
 *
 * The per-DTO `requireInt` helpers this replaces did `Number(value)` then
 * `BigInt(n)`, which accepted "1e5", "0x10" and " 5" as valid ids, lost
 * precision above 2^53 *before* the BigInt conversion (9007199254740993
 * silently queried 9007199254740992), and threw a raw RangeError — a 500 —
 * for a 20-digit id.
 *
 * Here the raw string is validated first and converted with BigInt(string)
 * directly, so every well-formed id round-trips exactly and everything else
 * is a 400.
 */
/** Postgres `bigint` upper bound — anything larger overflows the driver (a 500). */
const MAX_BIGINT = 9223372036854775807n;

export function parseIdParamStrict(value: unknown, field = "id"): bigint {
  const raw = typeof value === "number" && Number.isInteger(value) ? String(value) : value;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  const id = BigInt(raw);
  if (id > MAX_BIGINT) {
    throw new BadRequestException(`${field} must be an integer.`);
  }
  return id;
}

/**
 * bigint -> number for the columns Drizzle introspected as `mode: "number"`
 * (review.product_id, product_size_profile.*, ...). Anything outside the
 * safe-integer range cannot match such a column, so it is a genuine miss
 * (null) rather than a silently-truncated lookup.
 */
export function toSafeNumberId(id: bigint): number | null {
  const n = Number(id);
  return Number.isSafeInteger(n) ? n : null;
}

/** Path slug params: reject empty/whitespace so `/slug/` cannot fall through. */
export function parseSlugParamStrict(value: unknown, field = "slug"): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}
