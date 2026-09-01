/**
 * Admin/relationships API — Users, Reviews, Settings reads for the Weave CMS.
 *
 * Self-contained fetch helpers (mirrors api.ts request logic) scoped to the
 * admin sections so the core api.ts stays stable. All reads go through the
 * read-only NestJS wrapper (:8090) which proxies GETs to live Loom.
 *
 * Write-safety: there are NO write helpers here. Edit/approve/reject flows
 * assemble a payload client-side and show it in a preview drawer; nothing is
 * ever POSTed to Loom from these screens.
 */

import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { classifyHttpFailure, classifyNetworkFailure } from "@/lib/backend-fetch-error";

const BACKEND =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://localhost:8090")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090");

async function adminGet<T>(path: string, token?: string): Promise<T> {
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
    const classified = classifyNetworkFailure("admin-api", url, e);
    console.error(classified.message);
    throw classified;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const classified = classifyHttpFailure("admin-api", url, res.status, text.slice(0, 120));
    console.error(classified.message);
    throw classified;
  }
  return rewriteBloomscorpUrlsDeep(await res.json()) as T;
}

// ── Users ───────────────────────────────────────────────────────────────────

/** Lean customer row (Loom `customerList` / UserLitePreview). */
export interface UserRow {
  customerId: number;
  tenantId: number;
  userName: string;
  email: string;
  emailVerified: boolean;
  loomId: string;
  provider: string;
  userType: string;
  creationTime: number;
  lastAccessTime: number;
  isActiveLoyaltyUser: boolean;
  hasEverEnrolledForLoyaltyProgram: boolean;
}

/** Cart overview row (Loom `cartOverview` / CartOverview). */
export interface CartRow {
  tenantId: number;
  uid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  cartItemCount: number;
  hasAbandonedItem: boolean;
  lastUpdatedAt: number;
  estimatedTotalPrice: number;
}

export async function getCustomers(token?: string): Promise<UserRow[]> {
  try {
    const raw = await adminGet<{ customerList?: Record<string, unknown>[] }>(
      "/get/customers",
      token,
    );
    return (raw.customerList ?? []).map((u) => ({
      customerId: Number(u.customerId ?? 0),
      tenantId: Number(u.tenantId ?? 0),
      userName: String(u.userName ?? "—"),
      email: String(u.email ?? ""),
      emailVerified: Boolean(u.emailVerified),
      loomId: String(u.loomId ?? ""),
      provider: String(u.provider ?? "UNKNOWN"),
      userType: String(u.userType ?? ""),
      creationTime: Number(u.creationTime ?? 0),
      lastAccessTime: Number(u.lastAccessTime ?? 0),
      isActiveLoyaltyUser: Boolean(u.isActiveLoyaltyUser),
      hasEverEnrolledForLoyaltyProgram: Boolean(u.hasEverEnrolledForLoyaltyProgram),
    }));
  } catch {
    return [];
  }
}

export async function getCartOverview(token?: string): Promise<CartRow[]> {
  try {
    const raw = await adminGet<{ cartOverview?: Record<string, unknown>[] }>(
      "/get/tenant/cart-item/list",
      token,
    );
    return (raw.cartOverview ?? []).map((c) => {
      const tenant = (c.tenant ?? {}) as Record<string, unknown>;
      return {
        tenantId: Number(tenant.id ?? 0),
        uid: String(tenant.uid ?? ""),
        name: String(tenant.name ?? "—"),
        email: String(tenant.decryptedEmail ?? tenant.email ?? ""),
        emailVerified: Boolean(tenant.emailVerified),
        cartItemCount: Number(c.cartItemCount ?? 0),
        hasAbandonedItem: Boolean(c.hasAbandonedItem),
        lastUpdatedAt: Number(c.lastUpdatedAt ?? 0),
        estimatedTotalPrice: Number(c.estimatedTotalPrice ?? 0),
      };
    });
  } catch {
    return [];
  }
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewStatus = "PENDING" | "APPROVED" | "REMOVED";

/** Lean review row, flattened from the deeply-nested Loom review object. */
export interface ReviewRow {
  id: number;
  reviewer: string;
  city: string;
  country: string;
  rating: number;
  description: string;
  link: string;
  status: ReviewStatus;
  adminAdded: boolean;
  productId: number | null;
  productName: string;
  productSku: string;
  productImage: string;
  productGroup: string;
  /** Comma-separated review-photo URLs (empty string when none). */
  productImages: string;
  createdAt: number;
}

export async function getReviews(
  status: ReviewStatus,
  token?: string,
): Promise<ReviewRow[]> {
  try {
    const raw = await adminGet<{ reviewList?: Record<string, unknown>[] }>(
      `/get/super-user/review?pageNumber=0&pageSize=1000&status=${status}`,
      token,
    );
    return (raw.reviewList ?? []).map((r) => {
      const p = (r.product ?? {}) as Record<string, unknown>;
      return {
        id: Number(r.id ?? 0),
        reviewer: String(r.name ?? "—"),
        city: String(r.city ?? ""),
        country: String(r.country ?? ""),
        rating: Number(r.rating ?? 0),
        description: String(r.description ?? ""),
        link: String(r.link ?? ""),
        status: String(r.status ?? status) as ReviewStatus,
        adminAdded: Boolean(r.adminAdded),
        productId: r.productId == null ? null : Number(r.productId),
        productName: String(p.name ?? "—"),
        productSku: String(p.sku ?? ""),
        productImage: String(p.heroImage ?? ""),
        productGroup: String(p.productGroup ?? ""),
        productImages: String(r.productImages ?? ""),
        createdAt: Number(r.createdAt ?? 0),
      };
    });
  } catch {
    return [];
  }
}

/** Fetch all three review buckets in parallel. */
export async function getAllReviews(token?: string): Promise<Record<ReviewStatus, ReviewRow[]>> {
  const [pending, approved, removed] = await Promise.all([
    getReviews("PENDING", token),
    getReviews("APPROVED", token),
    getReviews("REMOVED", token),
  ]);
  return { PENDING: pending, APPROVED: approved, REMOVED: removed };
}

// ── Settings ────────────────────────────────────────────────────────────────

export interface SettingRow {
  id: number;
  version: number;
  attributeName: string;
  attributeType: string; // NUMBER | BOOLEAN | TEXT | OBJECT
  attributeValue: number | boolean | string | Record<string, unknown> | null;
  attributeLink: string;
}

export async function getSettings(token?: string): Promise<SettingRow[]> {
  try {
    const raw = await adminGet<{ settingsList?: Record<string, unknown>[] }>(
      "/get/settings-list",
      token,
    );
    return (raw.settingsList ?? []).map((s) => ({
      id: Number(s.id ?? 0),
      version: Number(s.version ?? 0),
      attributeName: String(s.attributeName ?? ""),
      attributeType: String(s.attributeType ?? ""),
      attributeValue: (s.attributeValue ?? null) as SettingRow["attributeValue"],
      attributeLink: String(s.attributeLink ?? ""),
    }));
  } catch {
    return [];
  }
}



// ── Loyalty Program ─────────────────────────────────────────────────────────

export interface MembershipConfig {
  id: number;
  tenure: number;
  active: boolean;
  discountPercentage: number;
  minimumOrderValueCurrency: string;
  minimumOrderValue: number;
  minimumOrderValueINR: number;
  exchangeRate: number;
  startDate: number;
  endDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface LoyaltyMetricsRow {
  tenantId: number;
  customerId: number;
  userName: string;
  email: string;
  totalOrderCount: number;
  totalOrderValue: number;
  totalLoyaltyOrderCount: number;
  totalLoyaltyOrderValue: number;
  totalLoyaltyDiscountValue: number;
  cycleTotalOrderCount: number;
  cycleTotalOrderValue: number;
  cycleLoyaltyOrderCount: number;
  cycleLoyaltyOrderValue: number;
  cycleLoyaltyDiscountValue: number;
  membershipConfig: MembershipConfig | null;
}

export async function getLoyaltyMetrics(
  active: boolean,
  token?: string,
): Promise<LoyaltyMetricsRow[]> {
  try {
    const raw = await adminGet<{ customerList?: Record<string, unknown>[] }>(
      `/get/loyalty-program/customers/metrics?active=${active}`,
      token,
    );
    return (raw.customerList ?? []).map((r) => {
      const mc = (r.membershipConfig ?? null) as Record<string, unknown> | null;
      return {
        tenantId: Number(r.tenantId ?? 0),
        customerId: Number(r.customerId ?? 0),
        userName: String(r.userName ?? ""),
        email: String(r.email ?? ""),
        totalOrderCount: Number(r.totalOrderCount ?? 0),
        totalOrderValue: Number(r.totalOrderValue ?? 0),
        totalLoyaltyOrderCount: Number(r.totalLoyaltyOrderCount ?? 0),
        totalLoyaltyOrderValue: Number(r.totalLoyaltyOrderValue ?? 0),
        totalLoyaltyDiscountValue: Number(r.totalLoyaltyDiscountValue ?? 0),
        cycleTotalOrderCount: Number(r.cycleTotalOrderCount ?? 0),
        cycleTotalOrderValue: Number(r.cycleTotalOrderValue ?? 0),
        cycleLoyaltyOrderCount: Number(r.cycleLoyaltyOrderCount ?? 0),
        cycleLoyaltyOrderValue: Number(r.cycleLoyaltyOrderValue ?? 0),
        cycleLoyaltyDiscountValue: Number(r.cycleLoyaltyDiscountValue ?? 0),
        membershipConfig: mc
          ? {
              id: Number(mc.id ?? 0),
              tenure: Number(mc.tenure ?? 0),
              active: Boolean(mc.active),
              discountPercentage: Number(mc.discountPercentage ?? 0),
              minimumOrderValueCurrency: String(mc.minimumOrderValueCurrency ?? "INR"),
              minimumOrderValue: Number(mc.minimumOrderValue ?? 0),
              minimumOrderValueINR: Number(mc.minimumOrderValueINR ?? 0),
              exchangeRate: Number(mc.exchangeRate ?? 1),
              startDate: Number(mc.startDate ?? 0),
              endDate: Number(mc.endDate ?? 0),
              createdAt: Number(mc.createdAt ?? 0),
              updatedAt: Number(mc.updatedAt ?? 0),
            }
          : null,
      };
    });
  } catch {
    return [];
  }
}

// ── Cron Jobs ────────────────────────────────────────────────────────────────

export type CronJobStatus = "RUNNING" | "SUCCESS" | "FAILURE" | "SKIPPED";

export interface CronJobLog {
  id: number;
  jobName: string;
  startTime: number;
  endTime: number | null;
  status: CronJobStatus;
  message: string | null;
  createdAt: number;
}

export async function getCronLogs(token?: string): Promise<CronJobLog[]> {
  try {
    const raw = await adminGet<{ cronJobLogList?: Record<string, unknown>[] }>(
      "/get/cron-logs",
      token,
    );
    return (raw.cronJobLogList ?? []).map((r) => ({
      id: Number(r.id ?? 0),
      jobName: String(r.jobName ?? ""),
      startTime: Number(r.startTime ?? 0),
      endTime: r.endTime != null ? Number(r.endTime) : null,
      status: String(r.status ?? "SKIPPED") as CronJobStatus,
      message: r.message != null ? String(r.message) : null,
      createdAt: Number(r.createdAt ?? 0),
    }));
  } catch {
    return [];
  }
}

// ── AI Embeddings ────────────────────────────────────────────────────────────

export interface AIEmbeddingGroupStat {
  productGroup: string;
  enabledProducts: number;
  embeddings: number;
  missingEmbeddings: number;
  coveragePercent: number;
  productsWithTags: number;
  productsWithoutTags: number;
  tagCoveragePercent: number;
  productsMissingMetaDescription: number;
}

export interface AIEmbeddingIssueProduct {
  productId: number;
  sku: string;
  name: string;
  productGroup: string;
  issueCount: number;
  issueSummary: string;
}

export interface AIEmbeddingStats {
  totalEmbeddings: number;
  enabledProducts: number;
  missingEmbeddings: number;
  coveragePercent: number;
  disabledStaleVectors: number;
  orphanVectors: number;
  productsWithTags: number;
  productsWithoutTags: number;
  tagCoveragePercent: number;
  productsMissingMetaDescription: number;
  productsMissingTaxonomyOrFilters: number;
  productsWithIncompleteMetadata: number;
  lastSuccessfulReindexTime: number | null;
  lastStartupIndexTime: number | null;
  groupStats: AIEmbeddingGroupStat[];
  issueProducts: AIEmbeddingIssueProduct[];
}

export async function getAIEmbeddingStats(token?: string): Promise<AIEmbeddingStats | null> {
  try {
    const raw = await adminGet<{ aiEmbeddingStats?: Record<string, unknown> }>(
      "/get/ai-embedding-stats",
      token,
    );
    const s = raw.aiEmbeddingStats ?? {};
    return {
      totalEmbeddings: Number(s.totalEmbeddings ?? 0),
      enabledProducts: Number(s.enabledProducts ?? 0),
      missingEmbeddings: Number(s.missingEmbeddings ?? 0),
      coveragePercent: Number(s.coveragePercent ?? 0),
      disabledStaleVectors: Number(s.disabledStaleVectors ?? 0),
      orphanVectors: Number(s.orphanVectors ?? 0),
      productsWithTags: Number(s.productsWithTags ?? 0),
      productsWithoutTags: Number(s.productsWithoutTags ?? 0),
      tagCoveragePercent: Number(s.tagCoveragePercent ?? 0),
      productsMissingMetaDescription: Number(s.productsMissingMetaDescription ?? 0),
      productsMissingTaxonomyOrFilters: Number(s.productsMissingTaxonomyOrFilters ?? 0),
      productsWithIncompleteMetadata: Number(s.productsWithIncompleteMetadata ?? 0),
      lastSuccessfulReindexTime: s.lastSuccessfulReindexTime != null ? Number(s.lastSuccessfulReindexTime) : null,
      lastStartupIndexTime: s.lastStartupIndexTime != null ? Number(s.lastStartupIndexTime) : null,
      groupStats: ((s.groupStats ?? []) as Record<string, unknown>[]).map((g) => ({
        productGroup: String(g.productGroup ?? ""),
        enabledProducts: Number(g.enabledProducts ?? 0),
        embeddings: Number(g.embeddings ?? 0),
        missingEmbeddings: Number(g.missingEmbeddings ?? 0),
        coveragePercent: Number(g.coveragePercent ?? 0),
        productsWithTags: Number(g.productsWithTags ?? 0),
        productsWithoutTags: Number(g.productsWithoutTags ?? 0),
        tagCoveragePercent: Number(g.tagCoveragePercent ?? 0),
        productsMissingMetaDescription: Number(g.productsMissingMetaDescription ?? 0),
      })),
      issueProducts: ((s.issueProducts ?? []) as Record<string, unknown>[]).map((p) => ({
        productId: Number(p.productId ?? 0),
        sku: String(p.sku ?? ""),
        name: String(p.name ?? ""),
        productGroup: String(p.productGroup ?? ""),
        issueCount: Number(p.issueCount ?? 0),
        issueSummary: String(p.issueSummary ?? ""),
      })),
    };
  } catch {
    return null;
  }
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────

export interface WhatsAppPreference {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  description: string;
}

export interface WhatsAppRow {
  tenantId: number;
  customerId: number;
  userName: string;
  email: string;
  whatsappNumber: string;
  optInStatus: "OPTED_IN" | "OPTED_OUT";
  consentExpiresAt: number | null;
  dismissCount: number;
  preferences: WhatsAppPreference[];
}

export async function getWhatsAppStatus(token?: string): Promise<WhatsAppRow[]> {
  try {
    const raw = await adminGet<{ customerWhatsAppStatusList?: Record<string, unknown>[] }>(
      "/get/customers/whatsapp-status",
      token,
    );
    return (raw.customerWhatsAppStatusList ?? []).map((r) => {
      let prefs: WhatsAppPreference[] = [];
      try {
        if (r.whatsappPreferences) prefs = JSON.parse(String(r.whatsappPreferences));
      } catch { /* ignore */ }
      return {
        tenantId: Number(r.tenantId ?? 0),
        customerId: Number(r.customerId ?? 0),
        userName: String(r.userName ?? ""),
        email: String(r.email ?? ""),
        whatsappNumber: String(r.whatsappNumber ?? ""),
        optInStatus: (String(r.whatsappOptInStatus ?? "OPTED_OUT")) as "OPTED_IN" | "OPTED_OUT",
        consentExpiresAt: r.whatsappConsentExpiresAt != null ? Number(r.whatsappConsentExpiresAt) : null,
        dismissCount: Number(r.whatsappDismissCount ?? 0),
        preferences: prefs,
      };
    });
  } catch {
    return [];
  }
}

// ── Table Explorer ────────────────────────────────────────────────────────────

export interface TableSummary {
  tableName: string;
  approximateRowCount: number;
  sizeBytes: number;
  columnCount: number;
}

export async function getTableSummaries(token?: string): Promise<TableSummary[]> {
  try {
    const raw = await adminGet<{ tableList?: Record<string, unknown>[] }>(
      "/get/table-explorer/tables",
      token,
    );
    return (raw.tableList ?? []).map((t) => ({
      tableName: String(t.tableName ?? ""),
      approximateRowCount: Number(t.approximateRowCount ?? 0),
      sizeBytes: Number(t.sizeBytes ?? 0),
      columnCount: Number(t.columnCount ?? 0),
    }));
  } catch {
    return [];
  }
}
