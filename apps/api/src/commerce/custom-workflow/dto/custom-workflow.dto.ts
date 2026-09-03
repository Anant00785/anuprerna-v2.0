/**
 * Request shapes and validation for POST /add/custom-workflow and
 * PATCH /update/custom-workflow.
 *
 * Ports, verbatim:
 *   nverse/validator/WorkflowAddRequestValidator.java
 *   nverse/validator/WorkflowUpdateRequestValidator.java
 *   nverse/validator/StepElementValidator.java
 *   nverse/validator/SubProcessElementValidator.java
 *   nverse/validator/ElementValidator.java
 *   nverse/validator/ElementPropertyValidator.java
 *   nverse/sanitizer/WorkflowSanitizer.java (and its step/subprocess/element
 *   collaborators) — which only trim the string fields.
 *
 * Loom rejects an invalid body BEFORE the DAO runs (`postEntity` takes the
 * validator), so every failure here is a 400, never a partial write.
 */
import { BadRequestException } from "@nestjs/common";

/** Loom: workflow/orm/WORKFLOW_STATUS. */
export const WORKFLOW_STATUSES = ["CREATED", "INITIATED", "HALTED", "COMPLETED"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/** Loom: workflow/orm/ELEMENT_STATUS. */
export const ELEMENT_STATUSES = ["PENDING", "IN_PROGRESS", "HALTED", "COMPLETED"] as const;
export type ElementStatus = (typeof ELEMENT_STATUSES)[number];

/** Loom: workflow/orm/ELEMENT_TYPE. */
export type ElementType = "STEP" | "SUBPROCESS";

export interface ElementInput {
  elementId: string;
  type: ElementType;
  posX: number;
  posY: number;
}

export interface SubProcessElementInput {
  element: ElementInput;
  name: string;
  parentSubProcessId: string;
  previousSubProcessId: string;
  nextSubProcessId: string;
  primarySubProcess: boolean;
  estimatedDays: number;
  status: ElementStatus;
  properties: unknown;
  feedbackRequired: boolean;
}

export interface StepElementInput {
  element: ElementInput;
  name: string;
  parentStepId: string;
  previousStepId: string;
  nextStepId: string;
  primaryStep: boolean;
  estimatedDays: number;
  status: ElementStatus;
  properties: unknown;
  feedbackRequired: boolean;
  subProcesses: SubProcessElementInput[];
}

/** Loom: workflow/pojo/WorkflowArtisanAssignment. */
export interface WorkflowArtisanAssignmentInput {
  artisanId: number;
  quantityOfFabricInMeters: number | null;
  quantityOfProducts: number | null;
  basePay: number | null;
}

export interface AddCustomWorkflowInput {
  name: string;
  description: string;
  note: string | null;
  workflowTemplateId: number;
  estimatedStartDate: number;
  referenceOrderId: number;
  referenceOrderItemId: number;
  referenceProductId: number | null;
  custom: boolean;
  avgArtisanWorkHoursPerMeter: number | null;
  avgWorkHoursPerProduct: number | null;
  fabricUsedPerProductInMeters: number | null;
  steps: StepElementInput[];
}

export interface UpdateCustomWorkflowInput {
  id: number;
  name: string;
  description: string;
  note: string | null;
  status: WorkflowStatus;
  avgArtisanWorkHoursPerMeter: number | null;
  avgWorkHoursPerProduct: number | null;
  fabricUsedPerProductInMeters: number | null;
  /** null means "not supplied" — Loom's synchronize() no-ops on null. */
  artisanAssignments: WorkflowArtisanAssignmentInput[] | null;
}

// ─── primitives ────────────────────────────────────────────────────────────

function reject(message: string): never {
  throw new BadRequestException(message);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) reject(`${field} must be an object.`);
  return value as Record<string, unknown>;
}

/** Loom's sanitizers trim; StringValidator then bounds the trimmed length. */
function requiredString(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") reject(`${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    reject(`${field} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

/** Loom: StringValidator.validate(value, min, max, true) — blank is allowed. */
function optionalString(value: unknown, field: string, max: number): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") reject(`${field} must be a string.`);
  const trimmed = value.trim();
  if (trimmed.length > max) reject(`${field} must be at most ${max} characters.`);
  return trimmed;
}

function positiveInt(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) reject(`${field} must be a positive integer.`);
  return n;
}

function optionalPositiveInt(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === 0 || value === "0") return null;
  return positiveInt(value, field);
}

function nonNegativeNumberOrNull(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) reject(`${field} must be a non-negative number.`);
  return n;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    reject(`${field} must be one of ${allowed.join(", ")}.`);
  }
  return value as T;
}

// ─── ElementPropertyValidator ──────────────────────────────────────────────

const DATATYPES = ["string", "boolean", "number"];
const VALUETYPES = ["required", "optional", "deferred"];

/**
 * Loom: ElementPropertyValidator.validatePropertiesWithValue.
 * `validateDeferred` is true when the element is IN_PROGRESS — a deferred
 * property must have a value by then.
 *
 * Anything that is not a list of property objects is treated as "no properties"
 * (Loom's convertValue produces an empty list, and an empty list passes).
 */
export function validateElementProperties(properties: unknown, validateDeferred: boolean, field: string): void {
  if (!Array.isArray(properties) || properties.length === 0) return;

  for (const raw of properties) {
    const property = record(raw, `${field} entry`);
    const key = property.key;
    const datatype = property.datatype;
    const valuetype = property.valuetype;

    if (
      key === null ||
      key === undefined ||
      typeof datatype !== "string" ||
      typeof valuetype !== "string" ||
      !DATATYPES.includes(datatype.toLowerCase()) ||
      !VALUETYPES.includes(valuetype.toLowerCase())
    ) {
      reject(`${field} contains a property with an invalid key, datatype or valuetype.`);
    }

    const value = property.value;
    const kind = valuetype.toLowerCase();
    const mustHaveValue = kind === "required" || (kind === "deferred" && validateDeferred);

    if (value === null || value === undefined) {
      if (mustHaveValue) reject(`${field} property "${String(key)}" requires a value.`);
      continue;
    }

    const type = datatype.toLowerCase();
    const typeOk =
      (type === "string" && typeof value === "string") ||
      (type === "boolean" && typeof value === "boolean") ||
      (type === "number" && typeof value === "number");
    if (!typeOk) reject(`${field} property "${String(key)}" is not a ${type}.`);
  }
}

// ─── ElementValidator ──────────────────────────────────────────────────────

/**
 * Loom: ElementValidator.isElementIdPatternValid — a STEP element id carries
 * exactly 3 hyphens, a SUBPROCESS id exactly 4. That is the whole check; the
 * canvas generates the ids and the count is how Loom tells the two apart.
 */
function parseElement(raw: unknown, expectedType: ElementType, field: string): ElementInput {
  const source = record(raw, field);
  const type = enumValue<ElementType>(source.type, ["STEP", "SUBPROCESS"], `${field}.type`);
  if (type !== expectedType) reject(`${field}.type must be ${expectedType}.`);

  const elementId = requiredString(source.elementId, `${field}.elementId`, 1, 255);
  const hyphens = elementId.split("-").length - 1;
  const expectedHyphens = type === "STEP" ? 3 : 4;
  if (hyphens !== expectedHyphens) {
    reject(`${field}.elementId must contain exactly ${expectedHyphens} hyphens for a ${type} element.`);
  }

  const posX = Number(source.posX ?? 0);
  const posY = Number(source.posY ?? 0);
  if (!Number.isFinite(posX) || !Number.isFinite(posY)) reject(`${field}.posX/posY must be numbers.`);

  return { elementId, type, posX: Math.trunc(posX), posY: Math.trunc(posY) };
}

// ─── step / sub-process ────────────────────────────────────────────────────

function parseSubProcess(raw: unknown, index: number, stepIndex: number): SubProcessElementInput {
  const field = `steps[${stepIndex}].subProcesses[${index}]`;
  const source = record(raw, field);

  const status = enumValue<ElementStatus>(source.status ?? "PENDING", ELEMENT_STATUSES, `${field}.status`);
  const estimatedDays = Number(source.estimatedDays);
  if (!Number.isInteger(estimatedDays) || estimatedDays <= 0) {
    reject(`${field}.estimatedDays must be a positive integer.`);
  }
  validateElementProperties(source.properties, status === "IN_PROGRESS", `${field}.properties`);

  return {
    element: parseElement(source.element, "SUBPROCESS", `${field}.element`),
    name: requiredString(source.name, `${field}.name`, 1, 255),
    // NOT NULL DEFAULT '' in the schema — Loom's ORM defaults these to "".
    parentSubProcessId: optionalString(source.parentSubProcessId, `${field}.parentSubProcessId`, 255),
    previousSubProcessId: optionalString(source.previousSubProcessId, `${field}.previousSubProcessId`, 255),
    nextSubProcessId: optionalString(source.nextSubProcessId, `${field}.nextSubProcessId`, 255),
    primarySubProcess: source.primarySubProcess === true,
    estimatedDays,
    status,
    properties: Array.isArray(source.properties) ? source.properties : {},
    feedbackRequired: source.feedbackRequired === true,
  };
}

function parseStep(raw: unknown, index: number): StepElementInput {
  const field = `steps[${index}]`;
  const source = record(raw, field);

  const status = enumValue<ElementStatus>(source.status ?? "PENDING", ELEMENT_STATUSES, `${field}.status`);
  const estimatedDays = Number(source.estimatedDays);
  if (!Number.isInteger(estimatedDays) || estimatedDays <= 0) {
    reject(`${field}.estimatedDays must be a positive integer.`);
  }
  validateElementProperties(source.properties, status === "IN_PROGRESS", `${field}.properties`);

  const rawSubProcesses = source.subProcesses;
  if (rawSubProcesses !== undefined && rawSubProcesses !== null && !Array.isArray(rawSubProcesses)) {
    reject(`${field}.subProcesses must be an array.`);
  }
  const subProcesses = (Array.isArray(rawSubProcesses) ? rawSubProcesses : []).map((sub, i) =>
    parseSubProcess(sub, i, index),
  );

  // Loom: StepElementValidator.hasUniquePrimarySubProcess — an empty list is
  // fine, a non-empty one must name exactly one primary.
  if (subProcesses.length > 0 && subProcesses.filter((s) => s.primarySubProcess).length !== 1) {
    reject(`${field}.subProcesses must contain exactly one primary sub-process.`);
  }

  return {
    element: parseElement(source.element, "STEP", `${field}.element`),
    name: requiredString(source.name, `${field}.name`, 1, 255),
    parentStepId: optionalString(source.parentStepId, `${field}.parentStepId`, 255),
    previousStepId: optionalString(source.previousStepId, `${field}.previousStepId`, 255),
    nextStepId: optionalString(source.nextStepId, `${field}.nextStepId`, 255),
    primaryStep: source.primaryStep === true,
    estimatedDays,
    status,
    properties: Array.isArray(source.properties) ? source.properties : {},
    feedbackRequired: source.feedbackRequired === true,
    subProcesses,
  };
}

// ─── artisan assignments ───────────────────────────────────────────────────

/** Loom: WorkflowUpdateRequestValidator.areArtisanAssignmentsValid. */
function parseArtisanAssignments(raw: unknown): WorkflowArtisanAssignmentInput[] | null {
  if (raw === null || raw === undefined) return null;
  if (!Array.isArray(raw)) reject("artisanAssignments must be an array.");
  if (raw.length === 0) return [];

  const seen = new Set<number>();
  return raw.map((entry, index) => {
    const field = `artisanAssignments[${index}]`;
    const source = record(entry, field);
    const artisanId = positiveInt(source.artisanId, `${field}.artisanId`);
    if (seen.has(artisanId)) reject(`${field}.artisanId is duplicated.`);
    seen.add(artisanId);

    const quantityOfFabricInMeters = nonNegativeNumberOrNull(
      source.quantityOfFabricInMeters,
      `${field}.quantityOfFabricInMeters`,
    );
    const quantityOfProducts = nonNegativeNumberOrNull(source.quantityOfProducts, `${field}.quantityOfProducts`);
    if (quantityOfFabricInMeters !== null && quantityOfProducts !== null) {
      reject(`${field} may carry a fabric quantity or a product quantity, not both.`);
    }

    return {
      artisanId,
      quantityOfFabricInMeters,
      quantityOfProducts,
      basePay: nonNegativeNumberOrNull(source.basePay, `${field}.basePay`),
    };
  });
}

/**
 * Loom: WorkflowUpdateRequestValidator.hasValidMetrics — a workflow is either a
 * FABRIC job (per-metre hours) or a FINISHED job (per-product hours), never
 * both, and the artisan quantities must agree with whichever it is.
 */
function validateMetrics(
  metrics: { avgArtisanWorkHoursPerMeter: number | null; avgWorkHoursPerProduct: number | null; fabricUsedPerProductInMeters: number | null },
  assignments: WorkflowArtisanAssignmentInput[] | null,
): void {
  const hasFabricMetrics = metrics.avgArtisanWorkHoursPerMeter !== null;
  const hasFinishedMetrics = metrics.avgWorkHoursPerProduct !== null || metrics.fabricUsedPerProductInMeters !== null;
  const hasFabricQuantities = (assignments ?? []).some((a) => a.quantityOfFabricInMeters !== null);
  const hasFinishedQuantities = (assignments ?? []).some((a) => a.quantityOfProducts !== null);

  if (hasFabricMetrics && hasFinishedMetrics) reject("A workflow cannot carry both fabric and finished metrics.");
  if (hasFabricQuantities && hasFinishedQuantities) {
    reject("Artisan assignments cannot mix fabric and product quantities.");
  }
  if (hasFabricMetrics && hasFinishedQuantities) reject("Fabric metrics cannot be paired with product quantities.");
  if (hasFinishedMetrics && hasFabricQuantities) reject("Finished metrics cannot be paired with fabric quantities.");
}

// ─── the two request parsers ───────────────────────────────────────────────

/** Loom: WorkflowAddRequestValidator + WorkflowSanitizer. */
export function parseAddCustomWorkflow(body: unknown): AddCustomWorkflowInput {
  const source = record(body, "body");

  const rawSteps = source.steps;
  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    reject("steps must contain at least one step.");
  }
  const steps = rawSteps.map((step, index) => parseStep(step, index));
  // Loom: hasUniquePrimaryStep — exactly one, always.
  if (steps.filter((s) => s.primaryStep).length !== 1) {
    reject("steps must contain exactly one primary step.");
  }

  // Loom validates `status` is a member of WORKFLOW_STATUS but the DAO then
  // overwrites it with CREATED unconditionally, so the value is checked and
  // discarded — reproduced here so a malformed body still 400s.
  enumValue<WorkflowStatus>(source.status ?? "CREATED", WORKFLOW_STATUSES, "status");

  const estimatedStartDate = Number(source.estimatedStartDate);
  if (!Number.isFinite(estimatedStartDate) || estimatedStartDate <= 0) {
    reject("estimatedStartDate must be a positive epoch-millisecond timestamp.");
  }

  const metrics = {
    avgArtisanWorkHoursPerMeter: nonNegativeNumberOrNull(
      source.avgArtisanWorkHoursPerMeter,
      "avgArtisanWorkHoursPerMeter",
    ),
    avgWorkHoursPerProduct: nonNegativeNumberOrNull(source.avgWorkHoursPerProduct, "avgWorkHoursPerProduct"),
    fabricUsedPerProductInMeters: nonNegativeNumberOrNull(
      source.fabricUsedPerProductInMeters,
      "fabricUsedPerProductInMeters",
    ),
  };
  validateMetrics(metrics, null);

  return {
    name: requiredString(source.name, "name", 1, 255),
    description: optionalString(source.description, "description", 500),
    note: source.note === null || source.note === undefined ? null : optionalString(source.note, "note", 5000),
    workflowTemplateId: positiveInt(source.workflowTemplateId, "workflowTemplateId"),
    estimatedStartDate,
    referenceOrderId: positiveInt(source.referenceOrderId, "referenceOrderId"),
    referenceOrderItemId: positiveInt(source.referenceOrderItemId, "referenceOrderItemId"),
    referenceProductId: optionalPositiveInt(source.referenceProductId, "referenceProductId"),
    custom: source.custom === true,
    ...metrics,
    steps,
  };
}

/** Loom: WorkflowUpdateRequestValidator + WorkflowSanitizer. */
export function parseUpdateCustomWorkflow(body: unknown): UpdateCustomWorkflowInput {
  const source = record(body, "body");
  const artisanAssignments = parseArtisanAssignments(source.artisanAssignments);

  const metrics = {
    avgArtisanWorkHoursPerMeter: nonNegativeNumberOrNull(
      source.avgArtisanWorkHoursPerMeter,
      "avgArtisanWorkHoursPerMeter",
    ),
    avgWorkHoursPerProduct: nonNegativeNumberOrNull(source.avgWorkHoursPerProduct, "avgWorkHoursPerProduct"),
    fabricUsedPerProductInMeters: nonNegativeNumberOrNull(
      source.fabricUsedPerProductInMeters,
      "fabricUsedPerProductInMeters",
    ),
  };
  validateMetrics(metrics, artisanAssignments);

  return {
    id: positiveInt(source.id ?? source.workflowId, "id"),
    name: requiredString(source.name, "name", 1, 255),
    description: optionalString(source.description, "description", 500),
    note: source.note === null || source.note === undefined ? null : optionalString(source.note, "note", 5000),
    // Loom: isTypeValid(entity.getStatus()) — a null or unknown status is a 400,
    // NOT a silently-ignored field.
    status: enumValue<WorkflowStatus>(source.status, WORKFLOW_STATUSES, "status"),
    ...metrics,
    artisanAssignments,
  };
}
