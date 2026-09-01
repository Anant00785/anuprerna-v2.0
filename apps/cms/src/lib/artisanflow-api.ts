/**
 * ArtisanFlow read-only API client.
 *
 * SINGLE-TENANT for now. This module is the ONLY data boundary for the
 * ArtisanFlow module (order -> production workflow -> traceability). It is
 * deliberately self-contained so the whole `/artisanflow/*` corner can later be
 * lifted into a separate multi-tenant service without untangling it from the
 * rest of Weave.
 *
 * READS ONLY. All requests go through the :8090 wrapper, which transparently
 * proxies GETs to live Loom and REFUSES every mutating verb (501). We never
 * issue a write here. Endpoint constants mirror the old Weave
 * request-mapper.service.ts so the ported logic stays faithful.
 *
 * Server-only: import from server components / route handlers. The service
 * token (loom-service-token.ts) is minted server-side and never reaches the
 * client.
 */

import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { BackendFetchError, classifyHttpFailure, classifyNetworkFailure, rethrowIfSystemic } from "@/lib/backend-fetch-error";

export { BackendFetchError };

const BACKEND =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://localhost:8090")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8090");

// afGet is the ONLY place that talks to the wrapper for this module. Every
// failure — network-unreachable, 401/403 auth, 5xx, or the sandbox running
// isolated/outdated code — is classified into a BackendFetchError with a
// cause-specific, actionable message (see backend-fetch-error.ts) and
// console.error'd here so the real cause is ALWAYS in the server log, even
// for callers below that end up swallowing it into a fallback. A genuine
// 200-with-no-matching-row is NOT an error — it never reaches this catch;
// callers see it as a normal `undefined` field on the parsed envelope.
async function afGet<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: "localhost",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const url = `${BACKEND}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch (e) {
    const classified = classifyNetworkFailure("artisanflow-api", url, e);
    console.error(classified.message);
    throw classified;
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const classified = classifyHttpFailure("artisanflow-api", url, res.status, text.slice(0, 160));
    console.error(classified.message);
    throw classified;
  }
  return rewriteBloomscorpUrlsDeep(await res.json()) as T;
}

/** Best-effort: pull a named array off an envelope, else the first array found. */
function pickArray<T>(payload: unknown, ...keys: string[]): T[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k] as T[];
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

// ── Types (only the fields the ArtisanFlow screens consume) ────────────────

export interface CustomOrderPreview {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  total: number;
  adjustedTotal: number;
  currency: string;
  createdAt: number;
  dispatchedOn: number;
  estimatedDeliveryFrom: number;
  estimatedDeliveryTo: number;
  orderStatus: string;
  itemCount: number;
  processingItemCount: number;
  readyItemCount: number;
  dispatchedItemCount: number;
  cancelledItemCount: number;
  hasOverdueSubProcess: boolean;
  orderType: string;
  loyaltyOrder: boolean;
  /** Internal running commentary on the whole order — NOT the customer's own
   *  `note` (a separate field; see CustomOrderDetail and the note in
   *  CustomOrderDetailView on why the two are never merged). Already present on
   *  the custom-order-list payload; typing it lets the list row surface it. */
  globalNote?: string;
}

export interface CustomOrderAdjustment {
  id: number;
  adjustmentType: number; // 1 = add (+), 2 = subtract (-)
  particular: string;
  adjustmentAmount: number;
  currency: string;
  sortOrder: number;
}

export interface CustomOrderItem {
  id: number;
  orderType: string;
  productGroup: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  orderStatus: string;
  shippingCode?: string;
  trackingUrl?: string;
  zohoPackageId?: string;
  dispatchedOn?: number;
  estimatedDeliveryFrom?: number;
  estimatedDeliveryTo?: number;
  hasWorkflow?: boolean;
  customization?: {
    customProduct?: { id?: number; name?: string; sku?: string; heroImage?: string };
    fabricProductPreview?: { product?: { name?: string; sku?: string; heroImage?: string } };
    finishedProductPreview?: { product?: { name?: string; sku?: string; heroImage?: string } };
  };
}

export interface CustomOrderDetail {
  id: number;
  tenant: { name?: string; email?: string; contactNumber?: string };
  orderType: string;
  loyaltyOrder: boolean;
  loyaltyDiscount: number;
  loyaltyDiscountAmount: number;
  subTotal: number;
  shippingCost: number;
  total: number;
  adjustedTotal: number;
  currency: string;
  advancePay: number;
  remainingPay: number;
  note: string;
  globalNote?: string;
  cancellationReason: string;
  createdAt: number;
  zohoOrderId: string;
  deleted: boolean;
  orderItems: CustomOrderItem[];
  adjustments: CustomOrderAdjustment[];
  ccEmails: string[];
}

export interface CustomOrderItemFulfillment {
  customOrderItemId: number;
  quantity: number;
  unit: string;
  /** relational.custom_order_item_fulfillment.created_at — EPOCH MILLISECONDS. */
  createdAt?: number;
}
export interface CustomOrderFulfillment {
  id: number;
  shippingCode?: string;
  trackingUrl?: string;
  zohoPackageId?: string;
  dispatchedOn?: number;
  /** Epoch ms. The fallback date when dispatchedOn was never filled in. */
  createdAt?: number;
  note?: string;
  customOrderItemFulfillmentList: CustomOrderItemFulfillment[];
}
export interface CustomOrderItemReady {
  customOrderItemId: number;
  quantity: number;
  unit: string;
  /** relational.custom_order_item_ready.created_at — EPOCH MILLISECONDS. */
  createdAt?: number;
}
export interface CustomOrderReady {
  id: number;
  receivedDate?: number;
  /** Epoch ms. The fallback date when receivedDate was never filled in. */
  createdAt?: number;
  note?: string;
  customOrderItemReadyList: CustomOrderItemReady[];
}

export interface WorkflowTemplatePreview {
  id: number;
  name: string;
  description: string;
  productAssociated: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SubProcessFeedback {
  text?: string;
  image?: string;
  video?: string;
  status?: string;
  remarks?: string;
  uploader?: string;
  updatedAt?: number;
  id?: number;
  /** relational.element_feedback.approved_by — the tenant id that APPROVED this
   *  sign-off. Present on live-synced rows (measured: job 133044983 subprocess
   *  133044992 carries approvedBy 23483) and written by
   *  PATCH /update/element/feedback/admin when the status is APPROVED. */
  approvedBy?: number;
  /** The tenant id that SUBMITTED the evidence, distinct from approvedBy. */
  uploadedBy?: number;
  feedbackUploaded?: boolean;
}

/**
 * One CAPTURED DETAIL on a stage or a task — live's `properties[]` entry.
 *
 * The TEMPLATE decides WHICH details a node captures (key + datatype +
 * valuetype); the JOB carries the VALUE actually recorded against it. Measured
 * on job 133044983 (2026-08-17):
 *   step "Yarn Processing" -> { key: "Target GSM", value: 150, datatype: "number", valuetype: "required" }
 *   step "Yarn Weaving"    -> { key: "Original Sample EPI * PPI", value: "80*24", datatype: "string", valuetype: "required" }
 *   sub  "Yarn Processing" -> Warp / Weft Yarn Color & Shade, both value "Ecru"
 *   sub  "Base Fabric QC"  -> { key: "Comments on the Quality", datatype: "string", valuetype: "deferred" }  (NO value yet)
 *
 * `value` ABSENT is the meaningful, common state: a detail the template asked
 * for that nobody has filled in. It is never rendered as an empty string.
 *
 * The api type declared neither field until 2026-08-17, which is the whole
 * reason the job board rendered none of it — the data has been on the wire the
 * entire time. stages.ts already reads the same array as `RawProperty` for the
 * template builder; that type carries no `value` because a TEMPLATE has none.
 */
export interface NodeProperty {
  key: string;
  /** The captured value. `number` when datatype is "number", else a string.
   *  ABSENT (undefined) when nothing has been captured yet. */
  value?: string | number;
  /** Live spec metadata: "string" | "number". Drives which input is rendered. */
  datatype?: string;
  /** "required" | "optional" | "deferred". `deferred` does NOT block completing
   *  the task — see the note on stages.ts Detail. */
  valuetype?: string;
}
export interface WorkflowSubProcess {
  element?: { id?: number; elementId?: string; feedback?: SubProcessFeedback };
  /** The details captured against THIS TASK. See NodeProperty. */
  properties?: NodeProperty[];
  // Template ORDER lives in this linked list, not in the id. Present on every
  // row the backend returns (verified 2026-08-16 across 375 multi-task steps).
  primarySubProcess?: boolean;
  parentSubProcessId?: string;
  previousSubProcessId?: string;
  nextSubProcessId?: string;
  name: string;
  status?: string;
  estimatedDays?: number;
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
  feedbackRequired?: boolean;
  deleted?: boolean;
  id: number;
}
export interface WorkflowStep {
  element?: { id?: number; elementId?: string; feedback?: SubProcessFeedback };
  /** The details captured against THIS STAGE. See NodeProperty. */
  properties?: NodeProperty[];
  // Template ORDER lives in this linked list, not in the id. Written by
  // stages.ts toBackendSteps() and returned intact by the backend (verified
  // 2026-08-16 across 189 multi-step workflows).
  parentStepId?: string;
  previousStepId?: string;
  nextStepId?: string;
  name: string;
  status?: string;
  primaryStep?: boolean;
  estimatedDays?: number;
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
  feedbackRequired?: boolean;
  deleted?: boolean;
  subProcesses: WorkflowSubProcess[];
  id: number;
}
export interface ArtisanAssignment {
  artisanId: number;
  /** The two work measures are MUTUALLY EXCLUSIVE on the wire. Loom's
   *  RainResponse serialises NON_NULL, so it omits whichever is absent, and the
   *  backend mirror only emits a quantity key when present (workflow.mapper.ts
   *  artisanAssignmentResponse). A fabric job carries metres; a finished-goods
   *  job carries pieces. Read whichever is there; never write both. */
  quantityOfFabricInMeters?: number;
  quantityOfProducts?: number;
  basePay?: number;
  basePayStatus?: string;
}
export interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  productAssociated?: boolean;
  steps: WorkflowStep[];
  createdAt?: number;
  updatedAt?: number;
}
export interface WorkflowInstancePreview {
  id: number;
  name: string;
  description: string;
  workflowType: string;
  orderId: number;
  orderCreatedAt: number;
  orderDeliveryDateFrom: number;
  orderDeliveryDateTo: number;
  productSku: string;
  productName: string;
  productImage: string;
  status: string;
  hasOverdueSubProcess: boolean;
  hasAssignedArtisan: boolean;
  hasStepLevelAssignment: boolean;
  hasSubProcessLevelAssignment: boolean;
  customerName?: string;
}
export interface WorkflowInstance {
  id: number;
  name: string;
  description: string;
  type: string;
  orderId: number;
  orderItemId: number;
  /** Only present when type === 'CUSTOM_ORDER' — buildCustomWorkflowDetail
   *  (backend) stores the custom-order link under referenceOrderId/
   *  referenceOrderItemId, NOT orderId/orderItemId. Order and custom-order
   *  jobs are different entities sharing this one detail shape. */
  referenceOrderId?: number;
  referenceOrderItemId?: number;
  status: string;
  /** Free-text job note (dated dispatch commitments staff type against the
   *  job). `/get/workflow/{id}` has always returned it; the interface simply
   *  never declared it, which is why the gap-fill summary below dropped it. */
  note?: string | null;
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  // Planning measures, fabric XOR finished-goods. mergeWorkflowUpdate and
  // mergeCustomWorkflowUpdate both apply applyWorkflowPlanningDetails, which
  // nulls the losing side, so at most one of these three is ever set. They
  // decide which quantity unit the job is planned in.
  avgArtisanWorkHoursPerMeter?: number;
  avgWorkHoursPerProduct?: number;
  fabricUsedPerProductInMeters?: number;
  createdAt?: number;
  updatedAt?: number;
  tenant?: { uid?: string; contactNumber?: string };
  product?: {
    id?: number; name?: string; sku?: string; heroImage?: string; productGroup?: string;
    subCategory?: { name?: string; segment?: { name?: string; category?: { name?: string } } };
  };
  customProduct?: { name?: string; sku?: string; heroImage?: string };
  // The reusable template this instance was seeded from. `id` lets the instance
  // page deep-link into the template editor to adjust stages / durations.
  workflowTemplate?: { id: number; name?: string };
  steps: WorkflowStep[];
  artisanAssignments: ArtisanAssignment[];
}

export interface WorkflowFeedbackItem {
  id: number;
  workflowId: number;
  orderId: number;
  orderItemId: number;
  artisanName?: string;
  userName?: string;
  productSku?: string;
  productName?: string;
  productImage?: string;
  stepName?: string;
  subProcessName?: string;
  feedbackDescription?: string;
  feedbackImage?: string;
  feedbackVideo?: string;
  remarks?: string;
  status: string; // PENDING | APPROVED | REJECTED
  updatedAt?: number;
  /** 'order' | 'custom' — which workflow kind the rollup resolved this to.
   *  '' when the feedback has no rollup mapping at all (queue endpoint only). */
  workflowType?: string;
  /** Loom's own job name, "<customer>-<orderId>-<sku>". ALREADY returned by both
   *  the queue and the two preview endpoints (workflow.mapper.ts
   *  elementFeedbackPreviewRow) and simply never declared here, which is why the
   *  Job Feedback rows rendered their customer as "—": the field the reviewer
   *  needed was in the payload the whole time. Live's list calls that column
   *  "User Name"; see feedbackUserName() in the feedback page for the parse. */
  workflowName?: string;
}

export interface WorkflowFeedbackQueue {
  items: WorkflowFeedbackItem[];
  /** Per-status totals over the WHOLE table, independent of the page returned. */
  counts: { PENDING: number; APPROVED: number; REJECTED: number };
}

export interface Artisan {
  id: number;
  tenant?: { uid?: string; name?: string };
  artisanRole?: string;
  state?: string;
  experience?: number;
  skills?: unknown[];
  catalogCount?: number;
  hasWhatsapp?: boolean;
  hasBankAccount?: boolean;
  lastUpdateTime?: number;
}

/** One line's impact row. Mirrors live's ImpactItem exactly
 *  (live-weave-ref/.../order-detail/interface/impact-item.ts) — every figure is
 *  NULLABLE because a PARTIAL row genuinely has no number yet, and rendering a
 *  null as 0 would invent an impact that was never calculated. */
export interface OrderImpactItem {
  workflowId: number | null;
  orderItemId: number;
  productType: string;
  calculationStatus: string;
  /** Comma-separated enum tokens. Humanise with formatPendingReason. */
  pendingReason: string | null;
  fabricMeters: number | null;
  co2OffsetKg: number | null;
  waterSavedLitres: number | null;
  artisanHours: number | null;
  womenArtisanHours: number | null;
  stitchingHours: number | null;
  womenStitchingHours: number | null;
  totalWorkHours: number | null;
  assumptionVersion?: number;
  updatedAt?: number;
}

/** Mirrors live's ImpactSummary. `womenStitchingHours` and `configurationError`
 *  were missing here and are part of the dashboard live actually renders. */
export interface OrderImpact {
  orderId: number;
  configurationError?: string | null;
  completeItems: number;
  partialItems: number;
  fabricMeters: number;
  co2OffsetKg: number;
  waterSavedLitres: number;
  artisanHours: number;
  womenArtisanHours: number;
  stitchingHours: number;
  womenStitchingHours?: number;
  totalWorkHours: number;
  items?: OrderImpactItem[];
}

// ── Custom orders ──────────────────────────────────────────────────────────

export async function getCustomOrderList(
  opts: { orderType?: string; tenantId?: number; pageNumber?: number; pageSize?: number },
  token?: string,
): Promise<CustomOrderPreview[]> {
  const qp = new URLSearchParams({
    pageNumber: String(opts.pageNumber ?? 0),
    pageSize: String(opts.pageSize ?? 300),
  });
  if (opts.orderType) qp.set("orderType", opts.orderType);
  if (opts.tenantId != null) qp.set("tenantId", String(opts.tenantId));
  try {
    const j = await afGet<unknown>(`/get/super-user/custom-order-list?${qp.toString()}`, token);
    return pickArray<CustomOrderPreview>(j, "orderList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getCustomOrderDetail(
  id: number,
  token?: string,
): Promise<CustomOrderDetail | null> {
  try {
    const j = await afGet<{ order?: CustomOrderDetail; success?: boolean }>(
      `/get/super-user/custom-order/${id}`,
      token,
    );
    return j.order ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}

export async function getCustomOrderFulfillmentList(
  id: number,
  token?: string,
): Promise<CustomOrderFulfillment[]> {
  try {
    const j = await afGet<unknown>(`/get/super-user/custom-order/${id}/fulfillment-list`, token);
    return pickArray<CustomOrderFulfillment>(j, "customOrderFulfillmentList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getCustomOrderReadyList(
  id: number,
  token?: string,
): Promise<CustomOrderReady[]> {
  try {
    const j = await afGet<unknown>(`/get/super-user/custom-order/${id}/ready-list`, token);
    return pickArray<CustomOrderReady>(j, "customOrderReadyList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

// ── Workflow ────────────────────────────────────────────────────────────────

export async function getWorkflowTemplateList(token?: string): Promise<WorkflowTemplatePreview[]> {
  try {
    const j = await afGet<unknown>(`/get/workflow-template-list`, token);
    return pickArray<WorkflowTemplatePreview>(j, "workflowTemplateList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getWorkflowTemplate(id: number, token?: string): Promise<WorkflowTemplate | null> {
  try {
    const j = await afGet<{ workflowTemplate?: WorkflowTemplate }>(`/get/workflow-template/${id}`, token);
    return j.workflowTemplate ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}

export async function getWorkflowList(status: string, token?: string): Promise<WorkflowInstancePreview[]> {
  // Backend serves standard vs custom workflows via SEPARATE endpoints (Loom
  // parity, 2026-07-04 backend refactor): /get/workflow-list/{status} = standard
  // ORDER workflows only, /get/custom-workflow-list/{status} = custom-order
  // workflows only. The Production board needs BOTH — fetch and merge (dedupe by id).
  const [std, cust] = await Promise.all([
    afGet<unknown>(`/get/workflow-list/${status}`, token)
      .then((j) => pickArray<WorkflowInstancePreview>(j, "workflowList"))
      .catch((e) => { rethrowIfSystemic(e); return [] as WorkflowInstancePreview[]; }),
    afGet<unknown>(`/get/custom-workflow-list/${status}`, token)
      .then((j) => pickArray<WorkflowInstancePreview>(j, "workflowList"))
      .catch((e) => { rethrowIfSystemic(e); return [] as WorkflowInstancePreview[]; }),
  ]);
  // Dedupe on (workflowType, id). This merge is EXACTLY where the two
  // independent id sequences meet, so an id-only Set drops a real CUSTOM_ORDER
  // row the moment its id matches an ORDER row -- and because std is spread
  // first, it is always the custom-order job that disappears. Key rationale +
  // measured id ranges are on getWorkflowListMulti below.
  const seen = new Set<string>();
  const out: WorkflowInstancePreview[] = [];
  for (const w of [...std, ...cust]) {
    const key = `${w.workflowType}:${w.id}`;
    if (!seen.has(key)) { seen.add(key); out.push(w); }
  }
  return out;
}

/**
 * Live Loom WorkflowStatus enum (manage-workflow tabs). The endpoint takes ONE
 * status at a time; there is NO "IN_PROGRESS" or "ALL" workflow status
 * (IN_PROGRESS is a workflow-STEP status). Non-completed = the live/in-progress
 * working set (CREATED + INITIATED + HALTED).
 */
export const WORKFLOW_STATUSES = ["CREATED", "INITIATED", "HALTED", "COMPLETED"] as const;
export const ACTIVE_WORKFLOW_STATUSES = ["CREATED", "INITIATED", "HALTED"] as const;

/**
 * ONE side of the workflow-list split, for callers that already know which kind
 * of job they want. getWorkflowList() below merges the standard and custom lists
 * because the production board genuinely needs both; a caller filtering to a
 * single workflowType afterwards is paying for a whole list it will discard.
 */
export async function getWorkflowListOfType(
  kind: "ORDER" | "CUSTOM_ORDER",
  status: string,
  token?: string,
): Promise<WorkflowInstancePreview[]> {
  const path = kind === "CUSTOM_ORDER" ? "custom-workflow-list" : "workflow-list";
  try {
    const j = await afGet<unknown>(`/get/${path}/${status}`, token);
    return pickArray<WorkflowInstancePreview>(j, "workflowList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/**
 * Fetch several workflow statuses in parallel and merge, deduped on
 * (workflowType, id) -- NOT on id alone.
 *
 * ORDER jobs and CUSTOM_ORDER jobs live in two backend tables with independent
 * auto-increment sequences, and their id ranges overlap almost end to end
 * (measured 2026-08-16 on the sandbox: ORDER 525,129..1,000,000,731,001,
 * CUSTOM_ORDER 2,677,965..1,000,000,000,128; both also mint sandbox ids from
 * their own MAX(id)+1 above the shared 1e12 floor, so the sandbox band collides
 * by construction). id alone is therefore NOT an identity here -- it silently
 * discards one of two colliding jobs everywhere this feeds: the production
 * board, All Jobs, and getOrderWorkflowSummariesFresh.
 */
export async function getWorkflowListMulti(
  statuses: readonly string[],
  token?: string,
): Promise<WorkflowInstancePreview[]> {
  const lists = await Promise.all(statuses.map((st) => getWorkflowList(st, token)));
  const seen = new Set<string>();
  const out: WorkflowInstancePreview[] = [];
  for (const list of lists) {
    for (const w of list) {
      const key = `${w.workflowType}:${w.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(w);
      }
    }
  }
  return out;
}

export async function getWorkflow(id: number, token?: string): Promise<WorkflowInstance | null> {
  try {
    const j = await afGet<{ workflow?: WorkflowInstance }>(`/get/workflow/${id}`, token);
    return j.workflow ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}

/**
 * Derive a job's real run window from its OWN steps: earliest
 * estimatedStartDate -> latest estimatedEndDate across non-deleted steps.
 * WorkflowInstancePreview.orderDeliveryDateFrom/To (declared above) are dead:
 * measured 2026-08-17 against the sandbox, EVERY row reads epoch 0 --
 * relational.orders_full has no delivery-date key at all, and
 * workflows_full/custom_workflows_full carry zero rows with a non-zero
 * estimatedStartDate/estimatedEndDate. The real per-job schedule lives one
 * level down, on workflow_step_detail_full (2,213 rows DO carry genuine
 * epochs there). This is that aggregation, run over a job's already-fetched
 * `steps` (see getWorkflow / getCustomWorkflowDetail) instead of the dead
 * order-level fields. Deleted steps and non-positive dates are excluded, not
 * coerced to 0 -- a side with no qualifying step returns null, never 1970.
 */
export function computeStepWindow(steps: WorkflowStep[]): { from: number | null; to: number | null } {
  let from: number | null = null;
  let to: number | null = null;
  for (const s of steps || []) {
    if (s.deleted) continue;
    if (typeof s.estimatedStartDate === "number" && s.estimatedStartDate > 0) {
      if (from === null || s.estimatedStartDate < from) from = s.estimatedStartDate;
    }
    if (typeof s.estimatedEndDate === "number" && s.estimatedEndDate > 0) {
      if (to === null || s.estimatedEndDate > to) to = s.estimatedEndDate;
    }
  }
  return { from, to };
}

// ── Discussion (workflow-comment) — native-only, no Loom counterpart. Shared by
// both ORDER and CUSTOM_ORDER job detail pages (one workflowId space). ──
export interface WorkflowComment {
  id: number;
  workflowId: number;
  text: string;
  authorName: string | null;
  authorTenantId: number | null;
  createdAt: number;
}

export async function getWorkflowComments(workflowId: number, token?: string): Promise<WorkflowComment[]> {
  try {
    const j = await afGet<{ workflowCommentList?: WorkflowComment[] }>(`/get/workflow/${workflowId}/comments`, token);
    return j.workflowCommentList ?? [];
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/** Bulk comment counts for a batch of workflow ids (Production board badges). */
export async function getWorkflowCommentCounts(workflowIds: number[], token?: string): Promise<Record<number, number>> {
  if (workflowIds.length === 0) return {};
  try {
    const j = await afGet<{ counts?: Record<string, number> }>(`/get/workflow-comment-counts?ids=${workflowIds.join(",")}`, token);
    const counts: Record<number, number> = {};
    for (const [k, v] of Object.entries(j.counts ?? {})) counts[Number(k)] = v;
    return counts;
  } catch (e) {
    rethrowIfSystemic(e);
    return {};
  }
}

// ── Custom-workflow management (manage-custom-workflow parity, 2026-07-06) ──
// Backend gap-fill added native POST add/custom-workflow, PATCH update/custom-
// workflow, alongside the existing native reads below. Kept separate from the
// standard-workflow helpers above: custom-workflow rows key their order link as
// `referenceOrderId` (not `orderId`), so a dedicated type avoids a misleading cast.

export interface CustomWorkflowPreview {
  id: number;
  name: string;
  status: string;
  orderId: number;
  productSku: string;
  description: string;
  productName: string;
  productImage: string;
  workflowType: string;
  orderCreatedAt: number;
  hasAssignedArtisan: boolean;
}

export interface CustomWorkflowDetail {
  id: number;
  name: string;
  description: string;
  note?: string | null;
  status: string;
  type: string;
  custom: boolean;
  estimatedStartDate?: number;
  estimatedEndDate?: number;
  createdAt?: number;
  updatedAt?: number;
  workflowTemplate?: { id: number; name?: string };
  referenceOrderId?: number;
  referenceOrderItemId?: number;
  referenceProductId?: number;
  steps: WorkflowStep[];
  artisanAssignments?: ArtisanAssignment[];
}

/** GET /get/custom-workflow-list/{status} -- custom-order workflows ONLY (not
 *  merged with standard). Matches live's separate "Manage Custom Process" page. */
export async function getCustomWorkflowList(status: string, token?: string): Promise<CustomWorkflowPreview[]> {
  try {
    const j = await afGet<unknown>(`/get/custom-workflow-list/${status}`, token);
    return pickArray<CustomWorkflowPreview>(j, "workflowList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getCustomWorkflowDetail(id: number, token?: string): Promise<CustomWorkflowDetail | null> {
  try {
    const j = await afGet<{ workflow?: CustomWorkflowDetail }>(`/get/custom-workflow/${id}`, token);
    return j.workflow ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}

/** GET /get/step-element/{stepId}/artisan-assignments (WorkflowAdminGuard --
 *  requires SANDBOX_ADMIN_TOKEN, i.e. getServiceToken(), not the session cookie). */
export async function getStepElementAssignments(stepId: number, token?: string): Promise<ArtisanAssignment[]> {
  try {
    const j = await afGet<unknown>(`/get/step-element/${stepId}/artisan-assignments`, token);
    return pickArray<ArtisanAssignment>(j, "artisanAssignmentList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/** GET /get/subprocess-element/{subProcessId}/artisan-assignments (same guard). */
export async function getSubProcessElementAssignments(subProcessId: number, token?: string): Promise<ArtisanAssignment[]> {
  try {
    const j = await afGet<unknown>(`/get/subprocess-element/${subProcessId}/artisan-assignments`, token);
    return pickArray<ArtisanAssignment>(j, "artisanAssignmentList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/**
 * Real artisan lineage for a workflow: the legacy workflow-level
 * `artisanAssignments` blob field is stale/empty on most rows -- the
 * AUTHORITATIVE attribution lives at the step/subprocess (element) level via
 * getStepElementAssignments / getSubProcessElementAssignments (same pattern
 * the instance + custom-workflow detail pages already use for their
 * assignment panels). This merges both sources (blob first, then element-
 * level), deduped by artisanId, so the traceability chain shows real artisans
 * instead of the near-always-empty blob. Degrades gracefully to `[]` (never
 * throws) when nothing is recorded -- callers render "no artisan recorded".
 */
export async function getWorkflowArtisanLineage(
  steps: WorkflowStep[] | undefined,
  blobAssignments: ArtisanAssignment[] | undefined,
  token?: string,
): Promise<ArtisanAssignment[]> {
  const liveSteps = (steps || []).filter((s) => !s.deleted);
  const [stepLists, subListsByStep] = await Promise.all([
    Promise.all(liveSteps.map((s) => getStepElementAssignments(s.id, token))),
    Promise.all(
      liveSteps.map((s) =>
        Promise.all(
          (s.subProcesses || []).filter((sp) => !sp.deleted).map((sp) => getSubProcessElementAssignments(sp.id, token)),
        ),
      ),
    ),
  ]);
  const seen = new Set<number>();
  const merged: ArtisanAssignment[] = [];
  const add = (a: ArtisanAssignment) => {
    if (!a || a.artisanId == null || seen.has(a.artisanId)) return;
    seen.add(a.artisanId);
    merged.push(a);
  };
  for (const a of blobAssignments || []) add(a);
  for (const list of stepLists) for (const a of list) add(a);
  for (const subLists of subListsByStep) for (const list of subLists) for (const a of list) add(a);
  return merged;
}

// QC/element feedback lives in Loom (its S3 photo/video URLs point at the shared
// anuprerna-bloomscorp bucket). NOT yet migrated into the sandbox copy, so this
// currently returns [] (endpoint proxies to Loom and 401s under the sandbox token).
// HELD (Amit, 2026-07-04): keep sandbox-only — do NOT read live Loom. When the
// element-feedback sync lands + the S3 objects are readable, this lights up.
export async function getWorkflowFeedbackList(status: string, token?: string): Promise<WorkflowFeedbackItem[]> {
  try {
    const j = await afGet<unknown>(`/get/element/feedback?status=${status}`, token);
    return pickArray<WorkflowFeedbackItem>(j, "elementFeedbackList");
  } catch {
    // INTENTIONAL exception to the rethrow-systemic-errors rule used elsewhere
    // in this file: this route is DOCUMENTED (see comment above) to always
    // 401 under the sandbox token until the Loom element-feedback sync lands.
    // A 401 here is expected-forever, not a config mistake -- swallow it, same
    // as before, so getOrderBoard (the caller) keeps degrading to "no pending
    // feedback" instead of a false "check your SANDBOX_ADMIN_TOKEN".
    return [];
  }
}

/**
 * Job Feedback queue — GET /get/element-feedback/queue.
 *
 * Distinct from getWorkflowFeedbackList above, which mirrors Loom's own preview
 * endpoint: that one serves ONE workflow kind and inner-joins the rollup, so
 * custom-workflow feedback and rows with no subprocess mapping fall out of it.
 * The queue is the review surface — every row for a status, both kinds, plus the
 * per-status totals so the tab badges stay truthful when the page is capped.
 */
export async function getWorkflowFeedbackQueue(
  status: string,
  token?: string,
  pageSize = 500,
): Promise<WorkflowFeedbackQueue> {
  const empty = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  try {
    const j = await afGet<{ elementFeedbackCounts?: Partial<typeof empty> }>(
      `/get/element-feedback/queue?status=${encodeURIComponent(status)}&pageSize=${pageSize}`,
      token,
    );
    return {
      items: pickArray<WorkflowFeedbackItem>(j, "elementFeedbackList"),
      counts: { ...empty, ...(j?.elementFeedbackCounts ?? {}) },
    };
  } catch (e) {
    rethrowIfSystemic(e);
    return { items: [], counts: empty };
  }
}

export async function getArtisanList(token?: string): Promise<Artisan[]> {
  try {
    const j = await afGet<unknown>(`/get/artisans`, token);
    return pickArray<Artisan>(j, "artisanList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getOrderImpact(orderId: number, token?: string): Promise<OrderImpact | null> {
  try {
    const j = await afGet<{ impact?: OrderImpact }>(`/get/impact/order/${orderId}`, token);
    return j.impact ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}

// ── Per-order workflow list (production-read-order-workflow-list) ──────────
// The order-wise WorkflowSummary rollup, WITH subprocess counts -- distinct
// from the boolean `hasWorkflow` on CustomOrderItem, which only says a
// workflow exists, not its progress.

export interface OrderWorkflowSubProcessSummary {
  subProcessId: number;
  subProcessName: string;
  subProcessStatus: string;
  hasAssignedArtisan?: boolean;
  hasApprovedFeedback?: boolean;
  subProcessEstimatedStartDate?: number;
  subProcessEstimatedEndDate?: number;
  subProcessActualStartDate?: number;
  subProcessActualEndDate?: number;
}
export interface OrderWorkflowStepSummary {
  stepId: number;
  stepName: string;
  stepStatus: string;
  stepElementId?: string;
  previousStepElementId?: string;
  nextStepElementId?: string;
  hasAssignedArtisan?: boolean;
  stepEstimatedStartDate?: number;
  stepEstimatedEndDate?: number;
  stepActualStartDate?: number;
  stepActualEndDate?: number;
  subProcesses: OrderWorkflowSubProcessSummary[];
}
export interface OrderWorkflowSummary {
  workflowId: number;
  workflowName: string;
  orderItemId: number;
  productSku: string;
  status: string;
  note?: string;
  orderItemUnit?: string;
  orderItemStatus?: string;
  orderedQuantity?: number;
  readyQuantity?: number;
  fulfilledQuantity?: number;
  hasOverdueSubProcess?: boolean;
  steps: OrderWorkflowStepSummary[];
}

/** GET /get/order/{orderId}/workflow-list -- per-order-item WorkflowSummary[]
 *  with real subprocess counts (standard orders).
 *  KNOWN LIMITATION: this is a denormalised rollup that is NOT recomputed by
 *  the 2026-07-06 write-path gap-fill (POST /add/workflow etc.) -- a
 *  newly-created sandbox instance will not appear here even though it is
 *  live on /get/workflow/{id} and the production board. See backend
 *  workflow.service.ts addWorkflow() comment. */
export async function getOrderWorkflowList(orderId: number, token?: string): Promise<OrderWorkflowSummary[]> {
  try {
    const j = await afGet<unknown>(`/get/order/${orderId}/workflow-list`, token);
    return pickArray<OrderWorkflowSummary>(j, "workflowList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/** GET /get/custom-order/{orderId}/workflow-list -- same shape, custom orders.
 *  Same known limitation as getOrderWorkflowList above. */
export async function getCustomOrderWorkflowList(orderId: number, token?: string): Promise<OrderWorkflowSummary[]> {
  try {
    const j = await afGet<unknown>(`/get/custom-order/${orderId}/workflow-list`, token);
    return pickArray<OrderWorkflowSummary>(j, "workflowList");
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/**
 * Order workflow nodes by the template CHAIN (previous/next element ids), with
 * ascending id as the fallback.
 *
 * The steps/tasks of a workflow are a linked list: stages.ts toBackendSteps()
 * writes parentStepId/previousStepId/nextStepId (and the parallel
 * *SubProcessId trio) as element-id references, and the backend returns them
 * intact. Sorting by `a.id - b.id` instead is an ASSUMPTION that the rows were
 * inserted in template order and never re-sequenced -- and PipelineSwimlane
 * hard-locks every card except the one it computes as active from that order,
 * so if the assumption ever breaks the operator is not shown a slightly odd
 * board, they are BLOCKED on the wrong card with no way through.
 *
 * Measured on the live sandbox 2026-08-16 before changing anything: 189 of 189
 * multi-step workflows and 375 of 375 multi-task steps have a COMPLETE,
 * single-headed chain, and in every one of those 564 cases the chain order
 * equals ascending-id order. So this is a no-op on today's data -- which is
 * exactly why it is worth doing now: it converts an unasserted invariant into
 * the actual ordering rule while the two still agree, instead of after they
 * diverge. Ordering runs over the UNFILTERED list (a soft-deleted node in the
 * middle still carries the links its neighbours point through); callers filter
 * `deleted` afterwards.
 *
 * Falls back to id order whenever the chain is not usable -- missing/duplicate
 * element ids, no single head, or a walk that fails to cover every node -- so a
 * malformed chain can never render FEWER stages than exist.
 */
function orderByChain<T extends { id: number }>(
  nodes: T[],
  elementIdOf: (n: T) => string | undefined,
  previousOf: (n: T) => string | undefined,
  nextOf: (n: T) => string | undefined,
): T[] {
  const byId = [...nodes].sort((a, b) => a.id - b.id);
  if (nodes.length < 2) return byId;

  const byElement = new Map<string, T>();
  for (const n of nodes) {
    const el = elementIdOf(n);
    if (!el || byElement.has(el)) return byId;
    byElement.set(el, n);
  }
  const heads = nodes.filter((n) => !previousOf(n));
  if (heads.length !== 1) return byId;

  const out: T[] = [];
  const seen = new Set<number>();
  let cur: T | undefined = heads[0];
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.push(cur);
    const nx = nextOf(cur);
    cur = nx ? byElement.get(nx) : undefined;
  }
  return out.length === nodes.length ? out : byId;
}

/** Steps in template order. See orderByChain. */
export function orderWorkflowSteps(steps: WorkflowStep[]): WorkflowStep[] {
  return orderByChain(
    steps || [],
    (s) => s.element?.elementId,
    (s) => s.previousStepId,
    (s) => s.nextStepId,
  );
}

/**
 * Rollup step summaries in template order — the same chain rule as
 * orderWorkflowSteps, applied to the SUMMARY shape (*ElementId fields).
 *
 * NOT optional. MEASURED on the sandbox 2026-08-16: /get/custom-order/{id}/
 * workflow-list does NOT return steps in chain order — workflow 132938526 comes
 * back [Yarn Weaving, Yarn Processing, Fabric Finishing] while its chain (and
 * its full detail record) reads Yarn Processing -> Yarn Weaving -> Fabric
 * Finishing. Unordered, the stage chips show the run backwards and the
 * "current stage" fallback (first not-yet-COMPLETED) names the wrong stage on
 * any job with no IN_PROGRESS step. Falls back to id order on a malformed
 * chain, exactly like its sibling.
 */
export function orderWorkflowStepSummaries(
  steps: OrderWorkflowStepSummary[],
): OrderWorkflowStepSummary[] {
  return orderByChain(
    (steps || []).map((s) => ({ ...s, id: s.stepId })),
    (s) => s.stepElementId,
    (s) => s.previousStepElementId,
    (s) => s.nextStepElementId,
  );
}

/** Tasks of one step in template order. See orderByChain. */
export function orderWorkflowSubProcesses(subs: WorkflowSubProcess[]): WorkflowSubProcess[] {
  return orderByChain(
    subs || [],
    (sp) => sp.element?.elementId,
    (sp) => sp.previousSubProcessId,
    (sp) => sp.nextSubProcessId,
  );
}

function stepsToSummary(steps: WorkflowStep[]): OrderWorkflowStepSummary[] {
  return (steps || [])
    .filter((s) => !s.deleted)
    .map((s) => ({
      stepId: s.id,
      stepName: s.name,
      stepStatus: s.status || "",
      subProcesses: (s.subProcesses || [])
        .filter((sp) => !sp.deleted)
        .map((sp) => ({
          subProcessId: sp.id,
          subProcessName: sp.name,
          subProcessStatus: sp.status || "",
        })),
    }));
}

/**
 * FRESH per-order workflow PREVIEWS (relational.custom_workflows_full /
 * workflows_full), for ONE order, across every workflow status.
 *
 * Why this exists next to the summary rollup: the two carry DIFFERENT fields
 * and are synced on DIFFERENT schedules, and the Order Watch view needs both.
 *   - the rollup (workflow_order_summary) is the only source of orderItemId,
 *     ordered/ready/dispatched quantities and the step tree -- but it was last
 *     synced 2026-07-17.
 *   - the preview list is the only source of productName, hasAssignedArtisan
 *     and hasOverdueSubProcess -- and it is synced daily.
 * Measured on order 132440539 (2026-08-16): the rollup calls two jobs
 * INITIATED that the preview list (and the operator) call COMPLETED, and it
 * reports 9 overdue where the fresh flag says 6. Reading the exception counts
 * off the stale copy would have understated finished work and cried wolf on
 * three jobs, so the preview wins on every field it owns.
 *
 * ALL FOUR statuses, not ACTIVE_WORKFLOW_STATUSES: an order-level "N of M jobs
 * done" that cannot see COMPLETED jobs can only ever print 0.
 */
export async function getOrderWorkflowPreviewsSafe(
  orderId: number,
  kind: "order" | "custom-order",
  token?: string,
): Promise<WorkflowInstancePreview[]> {
  const wantType = kind === "custom-order" ? "CUSTOM_ORDER" : "ORDER";
  try {
    const lists = await Promise.all(
      WORKFLOW_STATUSES.map((st) => getWorkflowListOfType(wantType, st, token)),
    );
    // Dedupe on id ALONE is safe here and only here: every row has already been
    // filtered to one workflowType, so the two overlapping id sequences that
    // force (type,id) keys elsewhere cannot collide inside this list.
    const seen = new Set<number>();
    const out: WorkflowInstancePreview[] = [];
    for (const w of lists.flat()) {
      if (w.workflowType !== wantType || w.orderId !== orderId) continue;
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      out.push(w);
    }
    return out;
  } catch (e) {
    // Supplementary, exactly like getOrderWorkflowSummariesSafe: a wrapper
    // hiccup degrades the production panel, it does not 500 the order page.
    if (e instanceof BackendFetchError) return [];
    throw e;
  }
}

/**
 * getOrderWorkflowList/getCustomOrderWorkflowList's rollup is a denormalised
 * cache the backend doesn't recompute on the write-path gap-fill (see the
 * KNOWN LIMITATION comment above) -- a job created via POST /add/workflow or
 * /add/custom-workflow won't show up there right after creation. This fills
 * that gap: cross-reference the LIVE workflow list (getWorkflowListMulti,
 * always current) for this order, and for any instance the rollup is missing,
 * fetch its full detail (which IS live) and synthesize a matching summary.
 */
export async function getOrderWorkflowSummariesFresh(
  orderId: number,
  kind: "order" | "custom-order",
  token?: string,
  /**
   * Pre-fetched FRESH previews for this order (getOrderWorkflowPreviewsSafe).
   * The Order Watch surface needs that list anyway, and without this parameter
   * it and the gap-fill below would each scan the same workflow lists: 3 GETs
   * here + 4 there = 7 full-list scans per order render (and per inline-row
   * expand, which is measured as the hot path in OrdersClient). Handing the
   * list in makes it 4. Passing a SUPERSET is safe: the gap-fill only ever
   * matches ids the rollup is missing, and it filters on (workflowType,
   * orderId) exactly as the internal scan does.
   */
  previews?: WorkflowInstancePreview[],
): Promise<OrderWorkflowSummary[]> {
  const rollup = kind === "custom-order"
    ? await getCustomOrderWorkflowList(orderId, token)
    : await getOrderWorkflowList(orderId, token);

  const known = new Set(rollup.map((w) => w.workflowId));
  // getWorkflowListMulti merges BOTH backend lists -- /get/workflow-list/{status}
  // (workflowType "ORDER") and /get/custom-workflow-list/{status} (workflowType
  // "CUSTOM_ORDER"). Standard orders and custom orders are INDEPENDENT id
  // sequences (each table auto-increments its own), and their ranges overlap in
  // practice, so orderId alone does NOT identify an order: order #N and custom
  // order #N are unrelated entities that merely share a number. Matching on
  // orderId alone therefore pulled the OTHER kind's jobs into this order's
  // summary -- and then ran the wrong detail fetch on them
  // (getCustomWorkflowDetail on an ORDER job, getWorkflow on a CUSTOM_ORDER
  // job), surfacing one customer's production under another customer's order.
  // Filter on (workflowType, orderId), exactly as getOrderBoard groups.
  //
  // FAN-OUT: this runs on four surfaces, including every inline row expand on
  // the orders list, so the scan cost matters. getWorkflowListMulti fetches BOTH
  // backend lists per status (/get/workflow-list/{status} AND
  // /get/custom-workflow-list/{status}) = 6 upstream GETs, then throws away
  // whichever half is not `wantType`. Scan only the side we are going to keep:
  // 3 GETs instead of 6, byte-identical output, and no new staleness. A cache
  // was considered and REJECTED: this function exists precisely because the
  // rollup is stale, so a TTL on its live source would reintroduce the bug it
  // was written to fix, and a per-REQUEST cache buys nothing measurable because
  // every one of the four surfaces calls it exactly once per request.
  const wantType = kind === "custom-order" ? "CUSTOM_ORDER" : "ORDER";
  const live = previews ?? (
    await Promise.all(ACTIVE_WORKFLOW_STATUSES.map((st) => getWorkflowListOfType(wantType, st, token)))
  ).flat();
  const missing = live.filter(
    (w) => w.orderId === orderId && w.workflowType === wantType && !known.has(w.id),
  );
  if (missing.length === 0) return rollup;

  const extra = await Promise.all(
    missing.map(async (w): Promise<OrderWorkflowSummary | null> => {
      if (kind === "custom-order") {
        const full = await getCustomWorkflowDetail(w.id, token);
        if (!full || full.referenceOrderItemId == null) return null;
        return {
          workflowId: full.id,
          workflowName: full.name,
          orderItemId: full.referenceOrderItemId,
          productSku: w.productSku,
          status: full.status,
          // Carry the job NOTE, 2026-08-16. This synthesised summary stands in
          // for a rollup row, and the rollup carries `note` — omitting it here
          // meant a freshly-created job's dispatch commitment was dropped on
          // exactly the path that exists to stop fresh jobs disappearing. The
          // detail fetch above already has it, so this costs nothing.
          note: full.note ?? undefined,
          steps: stepsToSummary(full.steps),
        };
      }
      const full = await getWorkflow(w.id, token);
      if (!full) return null;
      return {
        workflowId: full.id,
        workflowName: full.name,
        orderItemId: full.orderItemId,
        productSku: w.productSku,
        status: full.status,
        note: full.note ?? undefined,   // same reason as the custom branch above
        steps: stepsToSummary(full.steps),
      };
    }),
  );

  return [...rollup, ...extra.filter((x): x is OrderWorkflowSummary => x != null)];
}

/**
 * Non-throwing form of getOrderWorkflowSummariesFresh for the four surfaces that
 * treat this rollup as SUPPLEMENTARY (order detail, custom-order detail, and the
 * two inline-expand routes behind them).
 *
 * getOrderWorkflowSummariesFresh reaches the wrapper through afGet, and afGet
 * rethrows systemic failures (unreachable / 401 / 5xx / sandbox isolated) as a
 * BackendFetchError on purpose, so a real outage cannot masquerade as "this
 * order has no jobs". But those callers were awaiting it BARE inside a
 * Promise.all whose siblings are all Result-wrapped, so a single wrapper hiccup
 * escaped the server component and 500'd the entire order page -- exactly the
 * failure mode already fixed for getWorkflowComments on the job-detail page.
 * Degrade the production section to empty, keep the order on screen, and leave
 * the classified cause in the server log (afGet already console.errors it).
 * Non-BackendFetchError bugs still propagate.
 */
export async function getOrderWorkflowSummariesSafe(
  orderId: number,
  kind: "order" | "custom-order",
  token?: string,
  previews?: WorkflowInstancePreview[],
): Promise<OrderWorkflowSummary[]> {
  try {
    return await getOrderWorkflowSummariesFresh(orderId, kind, token, previews);
  } catch (e) {
    if (e instanceof BackendFetchError) return [];
    throw e;
  }
}

// ── Money math (faithful port of custom-order-overview.component.ts) ────────
//
// The old Weave overview RECOMPUTES the adjusted total and the wholesale/loyalty
// figures on the client from `total` + the adjustment rows, rather than trusting
// the server's stored adjustedTotal. We reproduce that exact logic so the number
// on screen matches what staff saw in Weave.
//
//   adjustedTotal = total + Σ(type===1 ? +amount : -amount)
//   wholesaleDiscountTotal = Σ amount where particular == "wholesale discount"
//   loyaltyDiscountAmount  = wholesaleDiscountTotal
//   loyaltyDiscountPct     = subTotal>0 ? wholesaleDiscountTotal/subTotal*100 : 0
//   visibleAdjustments     = adjustments EXCLUDING the wholesale-discount rows
//     (the wholesale discount is shown on its own "Wholesale Program Discount"
//      line, not in the per-line adjustment list — but it IS still subtracted
//      inside the adjustedTotal above.)

export interface CustomOrderMoney {
  subTotal: number;
  total: number;
  adjustedTotal: number;
  loyaltyDiscountAmount: number;
  loyaltyDiscountPct: number;
  visibleAdjustments: CustomOrderAdjustment[];
  currency: string;
}

function isWholesaleDiscount(a: CustomOrderAdjustment): boolean {
  return (a.particular || "").trim().toLowerCase() === "wholesale discount";
}

export function computeCustomOrderMoney(order: CustomOrderDetail): CustomOrderMoney {
  const adjustments = order.adjustments || [];
  let adjustedTotal = order.total;
  for (const a of adjustments) {
    if (a.adjustmentType === 1) adjustedTotal += a.adjustmentAmount;
    else adjustedTotal -= a.adjustmentAmount;
  }
  const wholesaleDiscountTotal = adjustments
    .filter(isWholesaleDiscount)
    .reduce((s, a) => s + (a.adjustmentAmount || 0), 0);

  return {
    subTotal: order.subTotal,
    total: order.total,
    adjustedTotal,
    loyaltyDiscountAmount: wholesaleDiscountTotal,
    loyaltyDiscountPct: order.subTotal > 0 ? (wholesaleDiscountTotal / order.subTotal) * 100 : 0,
    visibleAdjustments: adjustments.filter((a) => !isWholesaleDiscount(a)),
    currency: order.currency,
  };
}

// ── Item / product display helpers (port of overview getters) ──────────────

export function customItemName(item: CustomOrderItem): string {
  const c = item.customization;
  const fab = c?.fabricProductPreview?.product ?? c?.finishedProductPreview?.product;
  const name = item.productGroup === "fabric" ? fab?.name : c?.customProduct?.name ?? fab?.name;
  return name || `Item #${item.id}`;
}
export function customItemSku(item: CustomOrderItem): string {
  const c = item.customization;
  const fab = c?.fabricProductPreview?.product ?? c?.finishedProductPreview?.product;
  return (item.productGroup === "fabric" ? fab?.sku : c?.customProduct?.sku ?? fab?.sku) || "";
}
export function customItemImage(item: CustomOrderItem): string {
  const c = item.customization;
  const fab = c?.fabricProductPreview?.product ?? c?.finishedProductPreview?.product;
  return (item.productGroup === "fabric" ? fab?.heroImage : c?.customProduct?.heroImage ?? fab?.heroImage) || "";
}
export function customItemProductId(item: CustomOrderItem): string {
  const id = item.customization?.customProduct?.id;
  return id != null ? String(id) : "";
}

/** Total fulfilled (shipped) quantity for one order item across all fulfillments. */
export function fulfilledQty(itemId: number, fulfillments: CustomOrderFulfillment[]): number {
  return fulfillments
    .flatMap((f) => f.customOrderItemFulfillmentList || [])
    .filter((x) => x.customOrderItemId === itemId)
    .reduce((s, x) => s + x.quantity, 0);
}
/** Total ready quantity for one order item across all ready records. */
export function readyQty(itemId: number, readies: CustomOrderReady[]): number {
  return readies
    .flatMap((r) => r.customOrderItemReadyList || [])
    .filter((x) => x.customOrderItemId === itemId)
    .reduce((s, x) => s + x.quantity, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
//  ATTENTION-FIRST ORDER BOARD  (the redesigned daily ArtisanFlow face)
// ───────────────────────────────────────────────────────────────────────────
//  The team's #1 daily need is order-level, attention-first: which live
//  production orders need attention, and WHAT exactly. This section aggregates
//  the live workflow instances (one per order item) up to ORDER cards and
//  derives every attention flag from REAL step/subprocess dates + feedback —
//  never faked. Kept inside this single module boundary so the whole
//  ArtisanFlow corner stays extraction-ready.
//
//  Attention rules (all derived from live data):
//    LATE       — an estimated step/subprocess end date has passed and that
//                 step is not complete. Reports the largest lateness in days.
//    FEEDBACK   — the workflow has PENDING workflow feedback awaiting review.
//    UNASSIGNED — the workflow has no artisan assigned.
//    STALLED    — in progress, not late, but the most recent ACTUAL date is
//                 older than STALL_DAYS (no recent progress).
// ═══════════════════════════════════════════════════════════════════════════

const DAY_MS = 24 * 60 * 60 * 1000;
const STALL_DAYS = 14; // no actual-date progress for this long => stalled
// ABANDONED = old order (created > this many days ago) with ZERO completed steps
// across all its items. Dead 2025 test/stale orders that bury real production.
// Tune this to widen/narrow what gets hidden from the board.
const ABANDONED_DAYS = 180;
const BOARD_TTL_MS = 60 * 1000; // in-process cache so navigation is instant

export type AttentionKind = "late" | "feedback" | "unassigned" | "stalled";

export interface BoardItem {
  workflowId: number;
  orderId: number;
  productName: string;
  productSku: string;
  productImage: string;
  status: string; // INITIATED | CREATED | ...
  // "ORDER" (standard) | "CUSTOM_ORDER" -- carried straight through from the
  // preview. Both kinds now open the SAME detail page,
  // /artisanflow/workflow/instance/{id}: it resolves the order link by wf.type
  // (referenceOrderId for custom, orderId for standard). The old custom-only
  // /workflow/{id} route was deleted, so this field is no longer a link
  // discriminator -- it is still the grouping/filter key, since orderId is only
  // unique WITHIN a type.
  workflowType: string;
  stepsTotal: number;
  stepsDone: number;
  stageNum: number;      // 1-based index of the current (first incomplete) step
  stageName: string;
  progressPct: number;
  lateDays: number;      // 0 = not late
  stalled: boolean;
  stalledDays: number;
  unassigned: boolean;
  detailAvailable: boolean;
  pendingFeedback: number;
  commentCount?: number;
}

export interface OrderBoardCard {
  orderId: number;
  /** "ORDER" | "CUSTOM_ORDER" -- orderId is only unique WITHIN this type. */
  workflowType: string;
  customer: string;
  orderCreatedAt: number;
  deliveryDateTo: number;
  items: BoardItem[];
  itemCount: number;
  productSummary: string;
  heroImage: string;
  stepsDone: number;
  stepsTotal: number;
  progressPct: number;
  detailAvailable: boolean;
  // aggregated attention
  needsAttention: boolean;
  maxLateDays: number;
  lateItems: number;
  pendingFeedback: number;
  unassignedItems: number;
  stalledItems: number;
  maxStalledDays: number;
  reasons: { kind: AttentionKind; text: string }[];
  severity: number; // sort key, higher = more urgent
}

async function mapLimit<A, B>(items: A[], limit: number, fn: (a: A) => Promise<B>): Promise<B[]> {
  const out: B[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function deriveCustomer(name: string, description: string, orderId: number): string {
  // preview.name looks like "Jaimie SWEENEY-104702056-DUR1200795"; the customer
  // is the segment before the numeric order id.
  const cut = name.split(`-${orderId}`)[0]?.trim();
  if (cut && cut.length > 1) return cut;
  const fromDesc = (description || "").replace(/\s+(fabric\s+|finished\s+)?workflow$/i, "").trim();
  return fromDesc || name.split("-")[0]?.trim() || "Order";
}

/** All actual/estimated dates from a workflow instance, flattened. */
function analyzeInstance(inst: WorkflowInstance | null, preview: WorkflowInstancePreview, now: number): BoardItem {
  const steps = (inst?.steps || []).filter((s) => !s.deleted);
  const stepsTotal = steps.length;
  const stepsDone = steps.filter((s) => (s.status || "").toUpperCase() === "COMPLETED").length;
  const firstIncomplete = steps.findIndex((s) => (s.status || "").toUpperCase() !== "COMPLETED");
  const stageNum = firstIncomplete === -1 ? stepsTotal : firstIncomplete + 1;
  const stageName = firstIncomplete === -1 ? (steps[stepsTotal - 1]?.name || "") : (steps[firstIncomplete]?.name || "");
  const progressPct = stepsTotal ? Math.round((stepsDone / stepsTotal) * 100) : 0;

  // LATE: earliest passed estimated end date among incomplete steps/subprocesses.
  let earliestMissed = 0;
  let lastActivity = 0;
  for (const s of steps) {
    const sDone = (s.status || "").toUpperCase() === "COMPLETED";
    if (!sDone && s.estimatedEndDate && s.estimatedEndDate > 0 && s.estimatedEndDate < now) {
      if (!earliestMissed || s.estimatedEndDate < earliestMissed) earliestMissed = s.estimatedEndDate;
    }
    if (s.actualStartDate && s.actualStartDate > lastActivity) lastActivity = s.actualStartDate;
    if (s.actualEndDate && s.actualEndDate > lastActivity) lastActivity = s.actualEndDate;
    for (const sp of s.subProcesses || []) {
      const spDone = (sp.status || "").toUpperCase() === "COMPLETED";
      if (!spDone && sp.estimatedEndDate && sp.estimatedEndDate > 0 && sp.estimatedEndDate < now) {
        if (!earliestMissed || sp.estimatedEndDate < earliestMissed) earliestMissed = sp.estimatedEndDate;
      }
      if (sp.actualStartDate && sp.actualStartDate > lastActivity) lastActivity = sp.actualStartDate;
      if (sp.actualEndDate && sp.actualEndDate > lastActivity) lastActivity = sp.actualEndDate;
    }
  }
  const lateDays = earliestMissed ? Math.floor((now - earliestMissed) / DAY_MS) : 0;

  const isComplete = (inst?.status || preview.status || "").toUpperCase() === "COMPLETED";
  const inProgress = !isComplete && stepsDone > 0 && stepsDone < stepsTotal;
  const stalledDays = lastActivity ? Math.floor((now - lastActivity) / DAY_MS) : 0;
  const stalled = !!(inProgress && lateDays === 0 && lastActivity > 0 && stalledDays > STALL_DAYS);

  return {
    workflowId: preview.id,
    orderId: preview.orderId,
    productName: preview.productName || inst?.product?.name || "Item",
    productSku: preview.productSku || inst?.product?.sku || "",
    productImage: preview.productImage || inst?.product?.heroImage || "",
    status: preview.status || inst?.status || "",
    workflowType: preview.workflowType || "",
    stepsTotal,
    stepsDone,
    stageNum,
    stageName,
    progressPct,
    lateDays: lateDays > 0 ? lateDays : 0,
    stalled,
    stalledDays: stalled ? stalledDays : 0,
    unassigned: preview.hasAssignedArtisan === false,
    detailAvailable: stepsTotal > 0,
    pendingFeedback: 0, // filled in from the feedback map by the caller
  };
}

export interface OrderBoard {
  cards: OrderBoardCard[];
  /** How many old, zero-progress (abandoned) orders were hidden from the board. */
  hiddenAbandoned: number;
  /** Live jobs with no linked order (started via the standalone "Start job" flow). */
  orderless: BoardItem[];
}

let _boardCache: { at: number; data: OrderBoard } | null = null;

/**
 * Build the attention-first order board from live Loom data.
 * Read-only. Cached in-process for BOARD_TTL_MS so repeat navigation is instant.
 */
let _nameCache: { at: number; map: Map<number, string> } | null = null;
/** orderId -> real customer name, from the custom-order-list (carries the real
 *  order.tenant.name; the workflow previews lost customerName in the 2026-07-04
 *  backend refactor). Paged (endpoint caps ~50/page). Cached 5 min. */
async function getCustomerNameMap(token?: string): Promise<Map<number, string>> {
  if (_nameCache && Date.now() - _nameCache.at < 5 * 60 * 1000) return _nameCache.map;
  const map = new Map<number, string>();
  for (let page = 0; page < 40; page++) {
    const list = await getCustomOrderList({ pageNumber: page, pageSize: 50 }, token);
    if (!list.length) break;
    for (const o of list as Array<{ id?: number; name?: string }>) {
      if (o.id != null && o.name && o.name.trim()) map.set(Number(o.id), o.name.trim());
    }
    if (list.length < 50) break;
  }
  _nameCache = { at: Date.now(), map };
  return map;
}

export async function getOrderBoard(token?: string): Promise<OrderBoard> {
  if (_boardCache && Date.now() - _boardCache.at < BOARD_TTL_MS) return _boardCache.data;

  const now = Date.now();
  // 1. Live (non-completed) workflow previews — the real Loom endpoint has no
  //    "ALL" workflow status, so fetch the canonical active statuses and merge.
  const [active, pendingFb, nameMap] = await Promise.all([
    getWorkflowListMulti(ACTIVE_WORKFLOW_STATUSES, token),
    // Queue, not the parity list: the board groups custom orders too, so
    // counting only standard-order feedback would leave every custom job
    // showing "0 pending" while a reviewer actually has work queued on it.
    //
    // DEGRADES, and only this one does. The pending-feedback count is a BADGE on
    // a card, exactly like the comment count that /artisanflow/api/board already
    // degrades to zero for this same reason — but this call sat inside the board
    // fetch itself, so its failure took the ENTIRE board down instead of one
    // badge. Measured 2026-08-16: the sandbox backend answers
    // GET /get/element-feedback/queue with 503 kind:"isolated" (it is running
    // code that does not implement the route), and /artisanflow/api/board
    // therefore 502'd on every request, blanking the production board. Same on
    // the untouched main build, so the 503 is a BACKEND deployment problem, not
    // this function's — but a missing badge must not cost the board.
    //
    // The two siblings above are deliberately NOT wrapped: `active` IS the
    // board and `nameMap` labels every card, so a systemic failure there must
    // still 502 rather than render a confidently empty board.
    getWorkflowFeedbackQueue("PENDING", token)
      .then((q) => q.items)
      .catch((e) => {
        if (e instanceof BackendFetchError) return [] as WorkflowFeedbackItem[];
        throw e;
      }),
    getCustomerNameMap(token),
  ]);

  const fbByWorkflow = new Map<number, number>();
  for (const f of pendingFb) {
    fbByWorkflow.set(f.workflowId, (fbByWorkflow.get(f.workflowId) || 0) + 1);
  }

  // 2. Full detail for each active workflow (concurrency-limited).
  const details = await mapLimit(active, 15, (p) => getWorkflow(p.id, token));

  // 3. Per-item analysis.
  const items: BoardItem[] = active.map((p, idx) => {
    const it = analyzeInstance(details[idx], p, now);
    it.pendingFeedback = fbByWorkflow.get(p.id) || 0;
    return it;
  });

  // 4. Split off orderless jobs (started via the standalone "Start job" flow
  //    with no order picked -> orderId 0) BEFORE grouping. Otherwise every
  //    unrelated orderless job collapses into a single fake "order #0" card
  //    since the grouping key is orderId.
  // Standard orders and custom orders are separate id sequences in the
  // backend (each auto-increments its own table) -- orderId 154043112 as an
  // ORDER and orderId 154043112 as a CUSTOM_ORDER are unrelated entities that
  // merely share a number. Group by (workflowType, orderId), never orderId
  // alone, or an ORDER's jobs get folded into an unrelated CUSTOM_ORDER's card
  // (and vice versa) purely by numeric coincidence.
  const orderless: BoardItem[] = [];
  const byOrder = new Map<string, { preview: WorkflowInstancePreview; items: BoardItem[] }>();
  for (let idx = 0; idx < active.length; idx++) {
    const p = active[idx];
    if (!p.orderId) { orderless.push(items[idx]); continue; }
    const key = `${p.workflowType}:${p.orderId}`;
    let g = byOrder.get(key);
    if (!g) { g = { preview: p, items: [] }; byOrder.set(key, g); }
    g.items.push(items[idx]);
  }

  const cards: OrderBoardCard[] = [];
  for (const g of byOrder.values()) {
    const its = g.items;
    const orderId = g.preview.orderId;
    const workflowType = g.preview.workflowType;
    // The custom-order name map is keyed by the custom_order table's ids --
    // only consult it for CUSTOM_ORDER cards, or a same-numbered standard
    // order picks up a stranger's customer name.
    const customer = (workflowType === "CUSTOM_ORDER" ? nameMap.get(orderId) : undefined)
      || (g.preview.customerName && g.preview.customerName.trim() ? g.preview.customerName.trim() : deriveCustomer(g.preview.name, g.preview.description, orderId));
    const stepsDone = its.reduce((s, i) => s + i.stepsDone, 0);
    const stepsTotal = its.reduce((s, i) => s + i.stepsTotal, 0);
    const progressPct = stepsTotal ? Math.round((stepsDone / stepsTotal) * 100) : 0;

    const maxLateDays = its.reduce((m, i) => Math.max(m, i.lateDays), 0);
    const lateItems = its.filter((i) => i.lateDays > 0).length;
    const pendingFeedback = its.reduce((s, i) => s + i.pendingFeedback, 0);
    const unassignedItems = its.filter((i) => i.unassigned).length;
    const stalledItems = its.filter((i) => i.stalled).length;
    const maxStalledDays = its.reduce((m, i) => Math.max(m, i.stalledDays), 0);

    const reasons: { kind: AttentionKind; text: string }[] = [];
    if (maxLateDays > 0) {
      reasons.push({ kind: "late", text: `${maxLateDays} day${maxLateDays === 1 ? "" : "s"} late${lateItems > 1 ? ` · ${lateItems} items` : ""}` });
    }
    if (pendingFeedback > 0) {
      reasons.push({ kind: "feedback", text: `${pendingFeedback} update${pendingFeedback === 1 ? "" : "s"} awaiting review` });
    }
    if (unassignedItems > 0) {
      reasons.push({ kind: "unassigned", text: `${unassignedItems} item${unassignedItems === 1 ? " needs" : "s need"} an artisan` });
    }
    if (stalledItems > 0) {
      reasons.push({ kind: "stalled", text: `No progress in ${maxStalledDays} days` });
    }
    const needsAttention = reasons.length > 0;

    const names = Array.from(new Set(its.map((i) => i.productName).filter(Boolean)));
    const productSummary = names.length === 0 ? "—" : names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} more`;
    const heroImage = its.find((i) => i.productImage)?.productImage || "";

    // severity: late dominates, then feedback, then stalled, then unassigned.
    const severity = maxLateDays * 1000 + pendingFeedback * 100 + maxStalledDays * 10 + unassignedItems;

    // items sorted most-urgent first inside the card
    its.sort((a, b) => (b.lateDays - a.lateDays) || (b.pendingFeedback - a.pendingFeedback) || (b.stalledDays - a.stalledDays) || (Number(b.unassigned) - Number(a.unassigned)));

    cards.push({
      orderId,
      workflowType,
      customer,
      orderCreatedAt: g.preview.orderCreatedAt,
      deliveryDateTo: g.preview.orderDeliveryDateTo,
      items: its,
      itemCount: its.length,
      productSummary,
      heroImage,
      stepsDone,
      stepsTotal,
      progressPct,
      detailAvailable: its.some((i) => i.detailAvailable),
      needsAttention,
      maxLateDays,
      lateItems,
      pendingFeedback,
      unassignedItems,
      stalledItems,
      maxStalledDays,
      reasons,
      severity,
    });
  }

  // ── ABANDONED filter ───────────────────────────────────────────────────────
  // Hide dead orders so real production is not buried. An order is ABANDONED when
  // it is OLD (created more than ABANDONED_DAYS ago) AND has made ZERO progress
  // (no completed steps across ANY of its items). These stale 2025 test/dead
  // orders otherwise dominate the top of the board by lateness while nothing is
  // actually happening. They are dropped from the board AND from every KPI count
  // (all KPIs derive from the returned cards, so this one filter covers both).
  // We only hide when we KNOW the order is old: a missing / zero orderCreatedAt
  // is NEVER treated as abandoned. Tune the cutoff via ABANDONED_DAYS.
  const liveCards: OrderBoardCard[] = [];
  let hiddenAbandoned = 0;
  for (const card of cards) {
    const knownAge = !!card.orderCreatedAt && card.orderCreatedAt > 0;
    const isOld = knownAge && now - card.orderCreatedAt > ABANDONED_DAYS * DAY_MS;
    const noProgress = card.stepsDone === 0;
    if (isOld && noProgress) { hiddenAbandoned++; continue; }
    liveCards.push(card);
  }

  // Sort: needs-attention first, then by severity, then earliest delivery due.
  liveCards.sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
    if (b.severity !== a.severity) return b.severity - a.severity;
    const ad = a.deliveryDateTo || Infinity, bd = b.deliveryDateTo || Infinity;
    return ad - bd;
  });

  const board: OrderBoard = { cards: liveCards, hiddenAbandoned, orderless };
  _boardCache = { at: Date.now(), data: board };
  return board;
}


// ═══════════════════════════════════════════════════════════════════════════
//  DELAY TRACKING — per-node + per-workflow overdue analysis (read-only).
//  Every step/subprocess is judged against its estimatedEndDate (epoch-ms;
//  0/undefined = not set):
//    • COMPLETED after its estimate      → "late-done"
//    • incomplete, now past estimate     → "overdue"
//    • incomplete, due within N days     → "due-soon"
//    • incomplete, future estimate       → "on-track"
//    • done on time / no estimate        → "done" | "pending"
//  The summary counts LEAF nodes only (a step's subprocesses if it has any,
//  else the step itself) so a step and its last subprocess aren't double-counted.
// ═══════════════════════════════════════════════════════════════════════════
const DUE_SOON_DAYS = 3;

export type DelayState = "done" | "late-done" | "overdue" | "due-soon" | "on-track" | "pending";

export interface NodeDelay {
  state: DelayState;
  days: number; // overdue days | late days | days-until-due, per state
  label: string;
}

interface DelayNode {
  status?: string;
  estimatedDays?: number;
  estimatedEndDate?: number;
  actualStartDate?: number;
  actualEndDate?: number;
}

// The date a node SHOULD finish by. For an IN_PROGRESS node that has actually
// started, the truest "is this taking too long?" signal is start + estimatedDays;
// otherwise we fall back to the planned estimatedEndDate.
function effectiveDue(node: DelayNode, inProgress: boolean): number {
  const est = node.estimatedEndDate && node.estimatedEndDate > 0 ? node.estimatedEndDate : 0;
  const estDaysMs = node.estimatedDays && node.estimatedDays > 0 ? node.estimatedDays * DAY_MS : 0;
  const started = node.actualStartDate && node.actualStartDate > 0 ? node.actualStartDate : 0;
  if (inProgress && started && estDaysMs) return started + estDaysMs;
  return est;
}

export function nodeDelay(node: DelayNode, now: number): NodeDelay {
  const st = (node.status || "").toUpperCase();
  const done = st === "COMPLETED";
  const est = node.estimatedEndDate && node.estimatedEndDate > 0 ? node.estimatedEndDate : 0;
  const estDaysMs = node.estimatedDays && node.estimatedDays > 0 ? node.estimatedDays * DAY_MS : 0;
  if (done) {
    // Plan end, or work-based (start + estimatedDays) when no plan date exists.
    const planEnd = est || (node.actualStartDate && node.actualStartDate > 0 && estDaysMs ? node.actualStartDate + estDaysMs : 0);
    if (planEnd && node.actualEndDate && node.actualEndDate > planEnd) {
      const days = Math.max(1, Math.ceil((node.actualEndDate - planEnd) / DAY_MS));
      return { state: "late-done", days, label: `Finished ${days}d late` };
    }
    return { state: "done", days: 0, label: "On time" };
  }
  const inProgress = st === "IN_PROGRESS";
  const due = effectiveDue(node, inProgress);
  if (!due) return { state: "pending", days: 0, label: "" };
  if (now > due) {
    const days = Math.max(1, Math.floor((now - due) / DAY_MS));
    return { state: "overdue", days, label: `${days}d late` };
  }
  const daysToDue = Math.max(0, Math.ceil((due - now) / DAY_MS));
  if (daysToDue <= DUE_SOON_DAYS)
    return { state: "due-soon", days: daysToDue, label: daysToDue === 0 ? "Due today" : `Due in ${daysToDue}d` };
  return { state: "on-track", days: daysToDue, label: `Due in ${daysToDue}d` };
}

export interface WorkflowDelaySummary {
  onTrack: boolean;
  behindDays: number; // worst overdue among incomplete leaf nodes
  overdueCount: number;
  dueSoonCount: number;
  bottleneck?: string; // name of the most-overdue node
  nextDueLabel?: string; // soonest upcoming due (for non-overdue flows)
}

export function workflowDelaySummary(steps: WorkflowStep[], now: number): WorkflowDelaySummary {
  let behindDays = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let bottleneck: string | undefined;
  let soonestDue = 0;
  let nextDueLabel: string | undefined;
  const visit = (node: DelayNode, name: string) => {
    const d = nodeDelay(node, now);
    if (d.state === "overdue") {
      overdueCount++;
      if (d.days > behindDays) { behindDays = d.days; bottleneck = name; }
    } else if (d.state === "due-soon" || d.state === "on-track") {
      if (d.state === "due-soon") dueSoonCount++;
      const est = node.estimatedEndDate || 0;
      if (est && (!soonestDue || est < soonestDue)) { soonestDue = est; nextDueLabel = `${name} · ${d.label.toLowerCase()}`; }
    }
  };
  for (const s of (steps || []).filter((x) => !x.deleted)) {
    const subs = (s.subProcesses || []).filter((x) => !x.deleted);
    if (subs.length === 0) visit(s, s.name || "Step");
    else for (const sp of subs) visit(sp, `${s.name || "Step"} › ${sp.name || "Subprocess"}`);
  }
  return { onTrack: overdueCount === 0, behindDays, overdueCount, dueSoonCount, bottleneck, nextDueLabel };
}


// ── Overall delivery-window health (workflow level) ────────────────────────
// Compares the whole workflow against its planned delivery window
// (estimatedStartDate/estimatedEndDate) and projects a completion date. Used for
// the instance header so the delay is legible at a glance, not just per-stage.
export interface WorkflowSchedule {
  plannedStart?: number;
  plannedEnd?: number;   // workflow estimatedEndDate
  projectedEnd?: number; // best-effort projected completion (plan slipped by lateDays)
  actualEnd?: number;    // latest actual completion, when the workflow is done
  lateDays: number;      // days beyond the planned window (0 = on/before schedule)
  onSchedule: boolean;
  done: boolean;
}

export function workflowSchedule(
  inst: { estimatedStartDate?: number; estimatedEndDate?: number; status?: string; steps?: WorkflowStep[] },
  delay: WorkflowDelaySummary,
  now: number,
): WorkflowSchedule {
  const done = (inst.status || "").toUpperCase() === "COMPLETED";
  const plannedStart = inst.estimatedStartDate && inst.estimatedStartDate > 0 ? inst.estimatedStartDate : undefined;
  const plannedEnd = inst.estimatedEndDate && inst.estimatedEndDate > 0 ? inst.estimatedEndDate : undefined;

  // Latest actual completion across leaf nodes (for a finished workflow).
  let actualEnd = 0;
  for (const s of inst.steps || []) {
    if (s.actualEndDate && s.actualEndDate > actualEnd) actualEnd = s.actualEndDate;
    for (const sp of s.subProcesses || []) if (sp.actualEndDate && sp.actualEndDate > actualEnd) actualEnd = sp.actualEndDate;
  }

  if (done) {
    const lateDays = plannedEnd && actualEnd && actualEnd > plannedEnd ? Math.max(1, Math.ceil((actualEnd - plannedEnd) / DAY_MS)) : 0;
    return { plannedStart, plannedEnd, projectedEnd: actualEnd || plannedEnd, actualEnd: actualEnd || undefined, lateDays, onSchedule: lateDays === 0, done: true };
  }

  // Behind if we are past the delivery window now, or any incomplete stage is overdue.
  const windowLate = plannedEnd && now > plannedEnd ? Math.floor((now - plannedEnd) / DAY_MS) : 0;
  const lateDays = Math.max(windowLate, delay.behindDays);
  const projectedEnd = lateDays > 0 && plannedEnd ? plannedEnd + lateDays * DAY_MS : plannedEnd;
  return { plannedStart, plannedEnd, projectedEnd, lateDays, onSchedule: lateDays === 0, done: false };
}

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE USAGE — how many production jobs were created from a template.
//
// WHY THIS SHAPE. There is no "jobs for template N" endpoint: the two job LIST
// endpoints (/get/workflow-list/{status}, /get/custom-workflow-list/{status})
// return the 16-key preview, which carries no workflowTemplateId at all, and the
// only projection that does is the flat table-explorer row
// (/get/table-explorer/data/workflow -> workflowTableRow, which reads
// workflowTemplateId off the stored detail's workflowTemplate.id). That endpoint
// takes no filter, so the count means reading every job row once.
//
// COST, MEASURED on the sandbox 2026-08-17: 2,463 job rows, 939 KB, ~12-13 s
// (linear — 50 rows = 0.19 s, 500 = 2.9 s, 2500 = 11.7 s). The view it reads,
// relational.workflow_step_detail_full, rebuilds each job's whole JSONB detail
// including its step tree, and that is what costs.
//
// So this is CACHED for the process and computed for EVERY template at once,
// not once per template: opening ten different builders inside the TTL costs one
// backend read, not ten. _usageInflight collapses a concurrent stampede onto the
// same promise. The cache is a best-effort latency optimisation only — an
// expired or missing cache just re-reads, and a failure returns null so the
// caller renders nothing rather than an error.
// ═════════════════════════════════════════════════════════════════════════════

/** Job counts for ONE workflow template. */
export interface TemplateUsage {
  /** Every job ever created from this template, any status. */
  total: number;
  /** Jobs not finished yet: CREATED + INITIATED + HALTED (ACTIVE_WORKFLOW_STATUSES). */
  active: number;
  created: number;
  initiated: number;
  halted: number;
  completed: number;
}

interface TemplateUsageRow {
  workflowTemplateId?: number | null;
  status?: string | null;
}

const TEMPLATE_USAGE_TTL_MS = 10 * 60 * 1000;
/** One page big enough for the whole table; the endpoint has no "all" mode. */
const TEMPLATE_USAGE_PAGE_SIZE = 20000;

let _usageCache: { at: number; map: Record<number, TemplateUsage> } | null = null;
let _usageInflight: Promise<Record<number, TemplateUsage>> | null = null;

function blankUsage(): TemplateUsage {
  return { total: 0, active: 0, created: 0, initiated: 0, halted: 0, completed: 0 };
}

async function loadTemplateUsageMap(token?: string): Promise<Record<number, TemplateUsage>> {
  const j = await afGet<unknown>(
    `/get/table-explorer/data/workflow?page=0&size=${TEMPLATE_USAGE_PAGE_SIZE}`,
    token,
  );
  const rows = pickArray<TemplateUsageRow>(j, "workflowList");
  const map: Record<number, TemplateUsage> = {};
  for (const r of rows) {
    const tid = Number(r?.workflowTemplateId);
    if (!Number.isInteger(tid) || tid <= 0) continue;
    const u = (map[tid] ||= blankUsage());
    u.total += 1;
    switch (String(r?.status || "").toUpperCase()) {
      case "CREATED": u.created += 1; u.active += 1; break;
      case "INITIATED": u.initiated += 1; u.active += 1; break;
      case "HALTED": u.halted += 1; u.active += 1; break;
      case "COMPLETED": u.completed += 1; break;
      default: break;
    }
  }
  return map;
}

/**
 * Job counts for ONE template, or null when the read failed.
 *
 * Never throws: the caller renders an advisory banner, and a banner that cannot
 * be computed must simply not appear — it must never take the builder down.
 */
export async function getTemplateUsage(templateId: number, token?: string): Promise<TemplateUsage | null> {
  if (!Number.isInteger(templateId) || templateId <= 0) return null;
  const now = Date.now();
  if (_usageCache && now - _usageCache.at < TEMPLATE_USAGE_TTL_MS) {
    return _usageCache.map[templateId] ?? blankUsage();
  }
  if (!_usageInflight) {
    _usageInflight = loadTemplateUsageMap(token)
      .then((map) => {
        _usageCache = { at: Date.now(), map };
        return map;
      })
      .finally(() => {
        _usageInflight = null;
      });
  }
  try {
    const map = await _usageInflight;
    return map[templateId] ?? blankUsage();
  } catch (e) {
    console.error(
      "[artisanflow-api] template usage count unavailable:",
      e instanceof Error ? e.message : String(e),
    );
    return null;
  }
}

// ── ARTISAN ROSTER: bulk mapping reads ─────────────────────────────────────
//
// WHO is making each line, for the order-detail Artisan column. The column used
// to print the literal word "Assigned", because the only thing the workflow
// PREVIEW carries is the boolean `hasAssignedArtisan` — a flag, never a name.
//
// WHY BULK, AND NOT THE PER-NODE ENDPOINT the workflow-instance page uses:
// assignments live in THREE mapping tables (job / stage / task level — see
// WorkflowArtisanPanel's header for the measured multiplicity), and the only
// per-node reads are GET /get/{step,subprocess}-element/{id}/artisan-assignments,
// i.e. one request PER NODE. Order 132440539 alone has 24 workflows over 137
// distinct subprocess nodes, so resolving names that way costs ~160 upstream
// GETs for ONE page render. This module reads each mapping table ONCE through
// the table-explorer endpoints instead: 3 GETs, ~1,400 rows, ~150 KB total, and
// the workflow->node joins are then done in memory against the order's own
// workflow summaries, which the page has already fetched.
//
// Deliberately NOT cached. The three surfaces that could pay this cost do not:
// only the custom-order DETAIL page passes a renderArtisan slot, so the inline
// list expand — the hot path called out in getOrderWorkflowSummariesFresh — is
// untouched and issues none of these requests.
//
// AUTH: table-explorer paths sit behind the same admin tier as the rest of this
// module, i.e. getServiceToken(), not a session cookie.

export interface WorkflowArtisanMappingRow {
  id: number;
  workflowId: number;
  artisanId: number;
  quantityOfFabricInMeters?: number;
  quantityOfProducts?: number;
  basePayStatus?: string;
}
export interface StepElementArtisanMappingRow {
  id: number;
  stepElementId: number;
  artisanId: number;
  quantityOfFabricInMeters?: number;
  quantityOfProducts?: number;
}
export interface SubProcessElementArtisanMappingRow {
  id: number;
  subProcessElementId: number;
  artisanId: number;
  quantityOfFabricInMeters?: number;
  quantityOfProducts?: number;
}

/** Page through a table-explorer list endpoint. Capped so a runaway table can
 *  never turn one page render into an unbounded scan; the cap is disclosed by
 *  the caller rather than silently truncating a roster. */
async function afTablePages<T>(path: string, key: string, token?: string, maxPages = 12, size = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const j = await afGet<unknown>(`${path}?page=${page}&size=${size}`, token);
    const batch = pickArray<T>(j, key);
    out.push(...batch);
    if (batch.length < size) break;
  }
  return out;
}

export async function getWorkflowArtisanMappings(token?: string): Promise<WorkflowArtisanMappingRow[]> {
  try {
    return await afTablePages<WorkflowArtisanMappingRow>(
      `/get/table-explorer/data/workflow-artisan-mapping`, "workflowArtisanMappingList", token,
    );
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getStepElementArtisanMappings(token?: string): Promise<StepElementArtisanMappingRow[]> {
  try {
    return await afTablePages<StepElementArtisanMappingRow>(
      `/get/table-explorer/data/step-element-artisan-mapping`, "stepElementArtisanMappingList", token,
    );
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

export async function getSubProcessElementArtisanMappings(token?: string): Promise<SubProcessElementArtisanMappingRow[]> {
  try {
    return await afTablePages<SubProcessElementArtisanMappingRow>(
      `/get/table-explorer/data/subprocess-element-artisan-mapping`, "subProcessElementArtisanMappingList", token,
    );
  } catch (e) {
    rethrowIfSystemic(e);
    return [];
  }
}

/** GET /get/impact/custom-order/{id} — the CUSTOM-order impact summary.
 *  Custom orders have their OWN endpoint in Loom (request-mapper.service.ts
 *  keeps '/get/impact/order/' and '/get/impact/custom-order/' separate); calling
 *  the regular one with a custom order id returns a well-formed all-zero
 *  envelope, which is why this must never be folded into getOrderImpact. */
export async function getCustomOrderImpact(orderId: number, token?: string): Promise<OrderImpact | null> {
  try {
    const j = await afGet<{ impact?: OrderImpact }>(`/get/impact/custom-order/${orderId}`, token);
    return j.impact ?? null;
  } catch (e) {
    rethrowIfSystemic(e);
    return null;
  }
}
