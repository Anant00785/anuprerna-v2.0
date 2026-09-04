/**
 * Request -> `workflow` row mapping for POST /add/workflow.
 *
 * WHY THIS EXISTS: `parseWorkflowInput` returned `{ templateId, orderId, status }`.
 * The column is `workflowTemplateId`, not `templateId`, so Drizzle silently
 * dropped it — as it dropped every other field the CMS sends. The generated
 * INSERT bound exactly ONE parameter (order_id) and passed `default` for all
 * eighteen other columns, so Postgres rejected it on the first NOT NULL without
 * a default and "Create job" answered 500:
 *
 *   insert into "workflow" (...) values (default, default, ..., $1, default, ...)
 *
 * Columns that are NOT NULL with no default, verified against the live schema:
 *   workflow_template_id, name, tenant_id,
 *   estimated_start_date, estimated_end_date, created_at, updated_at
 * `description` defaults to '', `status` to 'CREATED', `type` to 'ORDER'.
 */
import { BadRequestException } from "@nestjs/common";

export const WORKFLOW_STATUSES = ["CREATED", "INITIATED", "COMPLETED", "HALTED"] as const;
export const WORKFLOW_TYPES = ["ORDER", "CUSTOM_ORDER"] as const;

export interface WorkflowInsertValues {
  workflowTemplateId: number;
  name: string;
  description: string;
  tenantId: number;
  productId: number | null;
  status: (typeof WORKFLOW_STATUSES)[number];
  estimatedStartDate: number;
  estimatedEndDate: number;
  createdAt: number;
  updatedAt: number;
  orderId: number | null;
  orderItemId: number | null;
  type: (typeof WORKFLOW_TYPES)[number];
  note: string | null;
}

/** Accepts epoch millis, epoch seconds, or a 'YYYY-MM-DD' / ISO date string. */
function toEpochMillis(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    // A plain 'YYYY-MM-DD' parsed elsewhere can arrive in seconds; widen it.
    return value < 1e11 ? Math.round(value * 1000) : Math.round(value);
  }
  const s = String(value).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return n < 1e11 ? n * 1000 : n;
  }
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param actingTenantId the AUTHENTICATED super-user's id. Every existing
 *   workflow row's tenant_id belongs to a ROLE_SUPER_USER — it records who
 *   started the job, not the customer and not the template owner (checked
 *   against 2,071 production rows: 0 match the order's tenant). It must come
 *   from the token, never the body, or a caller could file a job under someone
 *   else's name.
 */
export function parseWorkflowInsert(body: any, actingTenantId: number): WorkflowInsertValues {
  if (!body || typeof body !== "object") throw new BadRequestException("A request body is required.");

  const templateId = optionalId(body.workflowTemplateId ?? body.templateId);
  if (!templateId) throw new BadRequestException("workflowTemplateId is required.");

  const name = String(body.name ?? "").trim();
  if (!name) throw new BadRequestException("name is required.");

  if (!Number.isFinite(actingTenantId) || actingTenantId <= 0) {
    throw new BadRequestException("Could not determine who is creating this job.");
  }

  const type = WORKFLOW_TYPES.includes(body.type) ? body.type : "ORDER";
  const status = WORKFLOW_STATUSES.includes(body.status) ? body.status : "CREATED";

  const now = Date.now();
  const start = toEpochMillis(body.estimatedStartDate) ?? now;
  // Loom stores both; the CMS sends only a start for an ORDER job. Falling back
  // to the start keeps the NOT NULL satisfied without inventing a duration.
  const end = toEpochMillis(body.estimatedEndDate) ?? start;

  return {
    workflowTemplateId: templateId,
    name,
    description: String(body.description ?? "").trim(),
    tenantId: actingTenantId,
    productId: optionalId(body.productId ?? body.referenceProductId),
    status,
    estimatedStartDate: start,
    estimatedEndDate: end,
    createdAt: now,
    updatedAt: now,
    orderId: optionalId(body.orderId ?? body.referenceOrderId),
    orderItemId: optionalId(body.orderItemId ?? body.referenceOrderItemId),
    type,
    note: body.note ? String(body.note) : null,
  };
}

/**
 * PATCH /update/workflow — only the fields actually supplied, mapped to real
 * columns. The old parseWorkflowInput sent `templateId` (not a column), so an
 * update silently changed nothing while reporting success.
 * tenant_id and created_at are deliberately NOT updatable: they record who
 * created the job and when.
 */
export function parseWorkflowUpdate(body: any): Record<string, unknown> {
  if (!body || typeof body !== "object") throw new BadRequestException("A request body is required.");
  const out: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) throw new BadRequestException("name cannot be empty.");
    out.name = name;
  }
  if (body.description !== undefined) out.description = String(body.description).trim();
  if (body.status !== undefined) {
    if (!WORKFLOW_STATUSES.includes(body.status)) {
      throw new BadRequestException(`status must be one of ${WORKFLOW_STATUSES.join(", ")}.`);
    }
    out.status = body.status;
  }
  if (body.type !== undefined) {
    if (!WORKFLOW_TYPES.includes(body.type)) {
      throw new BadRequestException(`type must be one of ${WORKFLOW_TYPES.join(", ")}.`);
    }
    out.type = body.type;
  }
  const start = toEpochMillis(body.estimatedStartDate);
  if (start !== null) out.estimatedStartDate = start;
  const end = toEpochMillis(body.estimatedEndDate);
  if (end !== null) out.estimatedEndDate = end;
  if (body.note !== undefined) out.note = body.note ? String(body.note) : null;

  const templateId = optionalId(body.workflowTemplateId ?? body.templateId);
  if (templateId) out.workflowTemplateId = templateId;

  if (Object.keys(out).length === 0) {
    throw new BadRequestException("No updatable fields were supplied.");
  }
  out.updatedAt = Date.now();
  return out;
}
