/**
 * custom-products-api.ts — read-only server helpers for the Custom Product
 * catalogue entity.
 *
 * Custom PRODUCT (this file) is the made-to-spec CATALOGUE entity live edits
 * under manage-product/manage-custom-product/ — a lightweight product row
 * (name, sku, price, group, unit, media, remarks). It is NOT the custom ORDER
 * (already ported at /artisanflow/custom-orders), which is a logistics/order
 * entity. The study flagged these as distinct concepts; keep them separate.
 *
 * The wrapper (:8090) serves these from the sandbox pg copy, admin-gated
 * (auth.matrix CODE_SU) — so we attach the server-only SANDBOX_ADMIN_TOKEN
 * (getSandboxToken), never the caller cookie. Read-only: no add/update helpers
 * are exposed here even though the wrapper has POST /add + PATCH /update; the
 * sandbox surface renders those live actions visibly DISABLED.
 *
 * Live endpoints (verified live, 368 rows):
 *   GET /get/custom-product              -> { customProductList: [...] }
 *   GET /get/custom-product/{productId}  -> { customProduct: {...} }
 */

import {loomGetJson} from "@/lib/backend-fetch-error";
import { getSandboxToken } from "@/lib/sandbox-token";
import type { Result } from "@/lib/result";


/**
 * Custom product row. Mirrors the live ICustomProduct interface
 * (manage-custom-product/interface/custom-product.ts) plus the wrapper's
 * envelope metadata (createdAt/updatedAt/version) surfaced by
 * buildCustomProductItem in the backend mapper.
 */
export interface CustomProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  /** Canonical live enum — see CUSTOM_PRODUCT_GROUPS. */
  productGroup: string;
  /** Canonical live enum — see CUSTOM_PRODUCT_UNITS. */
  unit: string;
  remarks: string;
  /** Single hero image URL (may be empty). */
  heroImage: string;
  /** Comma-separated additional image URLs (live stores CSV). */
  additionalImages: string;
  /** Comma-separated additional document URLs (live stores CSV). */
  additionalDocs: string;
  createdAt?: number;
  updatedAt?: number;
  version?: number;
}

/**
 * Canonical productGroup values — the ONLY two options the live create form
 * offers (create-custom-product.component.html: <option>fabric/finished</option>)
 * and the only two present across all 368 rows. Not a status literal, so Gate 7
 * does not lint it; pinned here so the sandbox never invents a third group.
 */
export const CUSTOM_PRODUCT_GROUPS = ["fabric", "finished"] as const;

/**
 * Canonical unit values. Live derives unit from productGroup
 * (create-custom-product.component.ts prepareForm: fabric->METER, finished->UNIT)
 * and both are the only units in the data (136 METER / 232 UNIT).
 */
export const CUSTOM_PRODUCT_UNITS = ["METER", "UNIT"] as const;

/** Human label for a productGroup (live shows Title-case in the create select). */
export function groupLabel(group: string): string {
  if (group === "fabric") return "Fabric";
  if (group === "finished") return "Finished";
  return group || "—";
}

/** Single backend GET for this module. All failure handling — network,
 *  HTTP, and the `{success:false}` envelope — lives in loomGetJson. */
const loomGet = <T,>(path: string, token?: string): Promise<T> =>
  loomGetJson<T>("custom-products-api", path, token);

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function normalize(input: Record<string, unknown>): CustomProduct {
  return {
    id: num(input.id),
    name: str(input.name),
    sku: str(input.sku),
    price: num(input.price),
    productGroup: str(input.productGroup),
    unit: str(input.unit),
    remarks: str(input.remarks),
    heroImage: str(input.heroImage),
    additionalImages: str(input.additionalImages),
    additionalDocs: str(input.additionalDocs),
    createdAt: input.createdAt != null ? num(input.createdAt) : undefined,
    updatedAt: input.updatedAt != null ? num(input.updatedAt) : undefined,
    version: input.version != null ? num(input.version) : undefined,
  };
}

/** Full custom-product list (read-only). Never throws — Result envelope. */
export async function getCustomProductList(): Promise<Result<CustomProduct[]>> {
  const token = getSandboxToken();
  try {
    const payload = await loomGet<{ customProductList?: unknown }>(
      "/get/custom-product",
      token,
    );
    const raw = Array.isArray(payload.customProductList)
      ? (payload.customProductList as Record<string, unknown>[])
      : [];
    return { ok: true, data: raw.map(normalize) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Single custom product by id (read-only). Returns null when not found. */
export async function getCustomProductById(
  id: number,
): Promise<CustomProduct | null> {
  const token = getSandboxToken();
  const payload = await loomGet<{ success?: boolean; customProduct?: unknown }>(
    `/get/custom-product/${id}`,
    token,
  );
  if (!payload || payload.success === false || !payload.customProduct) return null;
  return normalize(payload.customProduct as Record<string, unknown>);
}

/** Split a live CSV media string into a clean URL list. */
export function splitMedia(csv: string): string[] {
  return (csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
