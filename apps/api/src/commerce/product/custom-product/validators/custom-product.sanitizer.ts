// @ts-nocheck
/**
 * apps/api/src/product/custom-product/sanitizer/custom-product.sanitizer.ts
 *
 * Direct port of com.bloomscorp.loom.nverse.sanitizer.CustomProductSanitizer,
 * which — like CartItemSanitizer — is expected to only call through to the
 * external NVerseSanitizer base class's `sanitizeObject(entity)` (reflection-
 * based sanitization of every `java.lang.String` field). The
 * CustomProductSanitizer class body itself is not present in this
 * repository (package com.bloomscorp.loom.nverse.sanitizer); this follows
 * the exact same documented three-stage pipeline already ported for Cart
 * (apps/api/src/commerce/cart/validators/cart-item.sanitizer.ts,
 * documentation/bmx-nverse.md "Sanitization" section):
 *
 *   1. Canonicalization    — strip null bytes (\0).
 *   2. XSS stripping       — remove <script>, <iframe>, inline src=, eval(),
 *                             expression(), javascript:, vbscript:, onload=
 *                             patterns via regex.
 *   3. OWASP HTML sanitization — allow only safe formatting/block/image/
 *                             link/style/table elements.
 *
 * Stage 3 has no drop-in Node equivalent reproduced from source; the
 * conservative allowlist approximation below is duplicated verbatim from
 * cart-item.sanitizer.ts rather than re-derived — SWAP THIS for a vetted
 * library (e.g. `sanitize-html`) configured to the same allowlist before
 * shipping to production, same flag as Cart.
 */
import { CustomProductInput } from "../types/custom-product.types.js";

const NULL_BYTE = /\0/g;

// Stage 2 — XSS stripping, verbatim pattern list from bmx-nverse.md.
const XSS_PATTERNS: RegExp[] = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
  /\bsrc\s*=\s*["'][^"']*["']/gi,
  /\beval\s*\([^)]*\)/gi,
  /\bexpression\s*\([^)]*\)/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /\bonload\s*=\s*["'][^"']*["']/gi,
];

/**
 * Stage 3 substitute — conservative HTML allowlist. NOT verified against
 * the OWASP Java HTML Sanitizer's exact policy (external, not in this
 * repository); strips any tag not in the documented allow-category list.
 */
const ALLOWED_TAGS = new Set([
  "b", "i", "em", "strong", "u", "s", "sub", "sup", "br",
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote",
  "img", "a",
  "span", "table", "thead", "tbody", "tr", "td", "th",
]);

function stripDisallowedTags(value: string): string {
  return value.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName: string) => {
    return ALLOWED_TAGS.has(tagName.toLowerCase()) ? match : "";
  });
}

/** NVerseSanitizer#sanitize(String) */
export function sanitize(value: string): string {
  let result = value.replace(NULL_BYTE, "");
  for (const pattern of XSS_PATTERNS) {
    result = result.replace(pattern, "");
  }
  result = stripDisallowedTags(result);
  return result;
}

const STRING_FIELDS: (keyof CustomProductInput)[] = [
  "name",
  "sku",
  "productGroup",
  "remarks",
  "heroImage",
  "additionalImages",
  "additionalDocs",
];

/**
 * CustomProductSanitizer#getSanitized(CustomProduct entity) — sanitizes
 * every String field on the incoming payload, mirroring sanitizeObject(entity).
 * `unit` is an enum in source (not a plain string) and `price` is numeric,
 * so neither is touched here, matching the reflection-based sanitizer only
 * ever targeting java.lang.String fields.
 */
export function sanitizeCustomProduct<T extends Partial<CustomProductInput>>(entity: T): T {
  const sanitized: T = { ...entity };
  for (const field of STRING_FIELDS) {
    const value = (sanitized as Record<string, unknown>)[field];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[field] = sanitize(value);
    }
  }
  return sanitized;
}
// @ts-nocheck
// @ts-nocheck
