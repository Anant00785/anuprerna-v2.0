/**
 * Artisans / Skills / Catalog read API — Relationships cluster.
 *
 * Server-side fetch helpers against the Loom backend (:8090). Each returns a
 * normalized, flat shape and never throws (returns [] on any error so the
 * page degrades to an empty list rather than a 500).
 *
 * Endpoints (verified live):
 *   GET /get/artisans?includeInactive=true   -> { artisanList: [...] }
 *   GET /get/skills                           -> { skillList: [...] }
 *   GET /get/catalog-list                     -> { catalogList: [...] }
 */

import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { classifyHttpFailure, classifyNetworkFailure } from "@/lib/backend-fetch-error";
import type {
  ArtisanRow,
  SkillRow,
  ArtisanCatalogRow,
  CatalogItemRow,
  CatalogItemMedia,
  ArtisanRole,
  Gender,
  SkillRef,
} from "@/types/artisan";
import type { Result } from "@/lib/result";

const BACKEND =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://localhost:8090")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090");

async function loomGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "localhost",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${BACKEND}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch (e) {
    const classified = classifyNetworkFailure("artisans-api", url, e);
    console.error(classified.message);
    throw classified;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const classified = classifyHttpFailure("artisans-api", url, res.status, text.slice(0, 120));
    console.error(classified.message);
    throw classified;
  }
  return rewriteBloomscorpUrlsDeep(await res.json()) as T;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return v == null ? "" : String(v);
}

// ── Artisans ────────────────────────────────────────────────────────────────

function normalizeSkills(raw: unknown): SkillRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => {
      const o = s as Record<string, unknown>;
      return { id: num(o.id), name: str(o.name) };
    });
}

function normalizeArtisan(input: Record<string, unknown>): ArtisanRow {
  const tenant = (input.tenant ?? {}) as Record<string, unknown>;
  const master = (input.masterArtisan ?? {}) as Record<string, unknown>;
  const masterTenant = (master.tenant ?? {}) as Record<string, unknown>;
  const skills = normalizeSkills(input.skills);

  return {
    id: num(input.id ?? tenant.id),
    name: str(input.name ?? tenant.name),
    contactNumber: str(input.contactNumber ?? tenant.contactNumber),
    artisanRole: (str(input.artisanRole) || "WORKER") as ArtisanRole,
    masterArtisanId:
      input.masterArtisanId != null
        ? num(input.masterArtisanId)
        : master.id != null
          ? num(master.id)
          : null,
    masterArtisanName: str(master.name ?? masterTenant.name),
    skills,
    skillIds: skills.map((s) => s.id),
    gender: (str(input.gender ?? tenant.gender) || "UNDEFINED") as Gender,
    dob: num(input.dob ?? tenant.dob),
    hasWhatsapp: Boolean(input.hasWhatsapp),
    state: str(input.state),
    district: str(input.district),
    villageTown: str(input.villageTown),
    postalCode: str(input.postalCode ?? input.pincode),
    expertise: str(input.expertise),
    experience: num(input.experience),
    catalogCount: num(input.catalogCount),
    hasBankAccount: Boolean(input.hasBankAccount),
    bankName: str(input.bankName),
    accountHolderName: str(input.accountHolderName),
    ifscCode: str(input.ifscCode),
    active: Boolean(input.active ?? tenant.active),
    timeOfCreation: num(input.timeOfCreation ?? tenant.creationTime),
  };
}

export async function getArtisanList(token?: string): Promise<ArtisanRow[]> {
  try {
    const data = await loomGet<{ artisanList?: Record<string, unknown>[] }>(
      "/get/artisans?includeInactive=true",
      token,
    );
    return (data.artisanList ?? []).map(normalizeArtisan);
  } catch {
    return [];
  }
}

// ── Skills ──────────────────────────────────────────────────────────────────

function normalizeSkill(input: Record<string, unknown>): SkillRow {
  return {
    id: num(input.id),
    name: str(input.name),
    description: str(input.description),
    deleted: input.deleted === true,
    timeOfCreation: num(input.timeOfCreation),
    lastUpdateTime: num(input.lastUpdateTime),
  };
}

export async function getSkillList(token?: string): Promise<SkillRow[]> {
  try {
    const data = await loomGet<{ skillList?: Record<string, unknown>[] }>(
      "/get/skills",
      token,
    );
    return (data.skillList ?? [])
      .map(normalizeSkill)
      .filter((s) => !s.deleted);
  } catch {
    return [];
  }
}

// ── Catalog ─────────────────────────────────────────────────────────────────

function normalizeMedia(raw: unknown): CatalogItemMedia[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m === "object")
    .map((m) => {
      const o = m as Record<string, unknown>;
      return {
        id: num(o.id),
        mediaUrl: str(o.mediaUrl),
        mediaType: str(o.mediaType),
        altText: str(o.altText),
        hero: Boolean(o.hero),
      };
    });
}

function normalizeCatalogItem(raw: Record<string, unknown>): CatalogItemRow {
  return {
    id: num(raw.id),
    name: str(raw.name),
    price: num(raw.price),
    currency: str(raw.currency) || "INR",
    quantity: num(raw.quantity),
    unit: str(raw.unit),
    description: str(raw.description),
    media: normalizeMedia(raw.catalogItemMediaList),
  };
}

function normalizeCatalog(raw: Record<string, unknown>): ArtisanCatalogRow {
  const artisan = (raw.artisan ?? {}) as Record<string, unknown>;
  const artisanTenant = (artisan.tenant ?? {}) as Record<string, unknown>;
  const items = Array.isArray(raw.catalogItems)
    ? (raw.catalogItems as Record<string, unknown>[]).map(normalizeCatalogItem)
    : [];
  const imageCount = items.reduce((sum, it) => sum + it.media.length, 0);
  return {
    id: num(raw.id),
    name: str(raw.name),
    description: str(raw.description),
    artisanId: num(artisan.id ?? artisanTenant.id),
    artisanName: str(artisan.name ?? artisanTenant.name),
    artisanState: str(artisan.state),
    defaultCatalog: Boolean(raw.defaultCatalog),
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
    items,
    itemCount: items.length,
    imageCount,
  };
}

export async function getCatalogList(token?: string): Promise<ArtisanCatalogRow[]> {
  try {
    const data = await loomGet<{ catalogList?: Record<string, unknown>[] }>(
      "/get/catalog-list",
      token,
    );
    return (data.catalogList ?? []).map(normalizeCatalog);
  } catch {
    return [];
  }
}


// -- Artisan detail (single) --------------------------------------------------
//
// GET /get/artisan/{id} -> { artisan: {...} }  (verified live; nests identity
// under `tenant`, normalized flat by normalizeArtisan). A bogus id returns
// { success:true } with NO `artisan` key -> resolves to null (clean not-found).
// Throws on a real backend error (network/500) so the server page renders a
// load-error, never a silent empty. ArtisanDetail extends the list row with
// lastUpdateTime (the live detail "Last Updated" field).

export interface ArtisanDetail extends ArtisanRow {
  lastUpdateTime: number;
}

export async function getArtisanById(
  id: number,
  token?: string,
): Promise<ArtisanDetail | null> {
  const data = await loomGet<{ artisan?: Record<string, unknown> }>(
    `/get/artisan/${id}`,
    token,
  );
  if (!data.artisan || data.artisan.id == null) return null;
  const base = normalizeArtisan(data.artisan);
  return { ...base, lastUpdateTime: num(data.artisan.lastUpdateTime) };
}

// GET /get/artisan/{masterId}/workers -> { artisanList: [...] }. Result-wrapped
// so a Loom outage renders an ErrorBanner in-section, not a misleading empty.
export async function getWorkersOfMaster(
  masterId: number,
  token?: string,
): Promise<Result<ArtisanRow[]>> {
  try {
    const data = await loomGet<{ artisanList?: Record<string, unknown>[] }>(
      `/get/artisan/${masterId}/workers`,
      token,
    );
    return { ok: true, data: (data.artisanList ?? []).map(normalizeArtisan) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load workers",
    };
  }
}

// The master a worker belongs to. Result-wrapped for the same in-section
// error-vs-empty distinction.
export async function getMasterArtisan(
  masterId: number,
  token?: string,
): Promise<Result<ArtisanDetail | null>> {
  try {
    return { ok: true, data: await getArtisanById(masterId, token) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load master artisan",
    };
  }
}
