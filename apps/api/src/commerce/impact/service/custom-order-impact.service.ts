/**
 * Port of Loom `CustomImpactFactorDAOController.calculateCustomOrderImpact`
 * — the custom-order impact engine behind
 * `POST /trigger/impact/custom-order/{customOrderId}`.
 *
 * Order of operations, verbatim from the Java:
 *
 *   1. Load the order (non-deleted, tenant-scoped). Absent -> a zeroed result,
 *      no writes.
 *   2. Load ImpactAssumptions from settings. Absent/invalid -> every order item
 *      is reported skipped with reason IMPACT_ASSUMPTIONS_NOT_CONFIGURED and
 *      NOTHING is written. There is no default set of assumptions.
 *   3. Index the order's workflows by custom order item.
 *   4. For each order item, in id order:
 *        a. resolve the effective product group ('custom' resolves through the
 *           customization to the custom product's own group);
 *        b. an unsupported group is skipped (UNSUPPORTED_PRODUCT_GROUP);
 *        c. a fabric swatch is skipped (SWATCH_PRODUCT_EXCLUDED) AND any stale
 *           impact row for it is deleted;
 *        d. otherwise calculate and upsert, counting created/updated and
 *           complete/partial.
 *
 * The whole of step 4 runs in ONE transaction, matching the Java's
 * `@Transactional` on the method: a failure part-way cannot leave an order with
 * some items recalculated against the new assumptions and the rest stale.
 */
import { Injectable } from "@nestjs/common";
import { CustomImpactRepository, type ImpactOrderItem } from "../repository/custom-impact.repository.js";
import {
  CustomImpactCalculationService,
  SWATCH_PRODUCT_EXCLUDED,
  UNSUPPORTED_PRODUCT_GROUP,
} from "./custom-impact-calculation.service.js";
import { IMPACT_ASSUMPTIONS_NOT_CONFIGURED } from "../dto/impact-assumptions.js";
import { emptyCalculationResult, type ImpactCalculationResult } from "../dto/impact-calculation.js";

type Executor = Parameters<Parameters<CustomImpactRepository["inTransaction"]>[0]>[0];

/** Loom: CustomOrderCustomization, the fields the engine reads. */
interface Customization {
  customProductId?: number | null;
  customProduct?: { productGroup?: string | null } | null;
  fabricProductPreview?: { product?: { name?: string | null } | null } | null;
}

/** Loom: convertCustomization — jsonb arrives decoded or as a JSON string. */
function asCustomization(raw: unknown): Customization | null {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Customization;
}

@Injectable()
export class CustomOrderImpactService {
  constructor(
    private readonly repo: CustomImpactRepository,
    private readonly calculator: CustomImpactCalculationService,
  ) {}

  /**
   * Loom: resolveEffectiveProductGroup. A 'custom' item carries its real group
   * on the embedded custom product, or on the custom product it references.
   * Unresolvable means null, which step 4b then skips — it never guesses.
   */
  private async resolveEffectiveProductGroup(item: ImpactOrderItem, tx: Executor): Promise<string | null> {
    const productGroup = item.productGroup;
    if (productGroup === null || productGroup.toLowerCase() !== "custom") return productGroup;

    const customization = asCustomization(item.customization);
    if (customization === null) return null;

    if (customization.customProduct != null) {
      return customization.customProduct.productGroup ?? null;
    }
    const customProductId = Number(customization.customProductId ?? 0);
    if (Number.isFinite(customProductId) && customProductId > 0) {
      return this.repo.findCustomProductGroup(customProductId, tx);
    }
    return null;
  }

  /** Loom: isSwatchProductItem — the product name lives on the fabric preview. */
  private isSwatchItem(item: ImpactOrderItem, productGroup: string | null): boolean {
    const customization = asCustomization(item.customization);
    const productName = customization?.fabricProductPreview?.product?.name ?? null;
    return this.calculator.isSwatchProduct(productGroup, productName);
  }

  /**
   * Loom: calculateCustomOrderImpact(customOrderId, tenantScope).
   *
   * `tenantScopeId` is null for a super user. The live route is CODE_SU, so it
   * passes null exactly as Loom's controller does; the parameter exists so the
   * scoped form stays available and no caller can smuggle in a client id.
   */
  async calculateCustomOrderImpact(customOrderId: number, tenantScopeId: number | null): Promise<ImpactCalculationResult> {
    return this.repo.inTransaction(async (tx) => {
      const order = await this.repo.findOrderForImpact(customOrderId, tenantScopeId, tx);
      if (order === null) return emptyCalculationResult(customOrderId);

      const assumptions = await this.repo.findImpactAssumptions(tx);
      const items = await this.repo.findOrderItems(order.id, tx);

      if (assumptions === null) {
        // Loom: buildMissingAssumptionsResult — every item skipped, no writes.
        const result = emptyCalculationResult(order.id);
        result.configurationError = IMPACT_ASSUMPTIONS_NOT_CONFIGURED;
        result.skippedItems = items.map((item) => ({
          orderItemId: item.id,
          reason: IMPACT_ASSUMPTIONS_NOT_CONFIGURED,
        }));
        result.skipped = result.skippedItems.length;
        return result;
      }

      const workflows = await this.repo.findWorkflowMetricsByOrderItem(order.id, tx);
      const result = emptyCalculationResult(order.id);
      const now = Date.now();

      for (const item of items) {
        const productGroup = await this.resolveEffectiveProductGroup(item, tx);

        if (!this.calculator.supportsCustomImpact(productGroup)) {
          result.skippedItems.push({ orderItemId: item.id, reason: UNSUPPORTED_PRODUCT_GROUP });
          continue;
        }

        if (this.isSwatchItem(item, productGroup)) {
          result.skippedItems.push({ orderItemId: item.id, reason: SWATCH_PRODUCT_EXCLUDED });
          await this.repo.deleteImpactByOrderItem(item.id, tx);
          continue;
        }

        const workflow = workflows.get(item.id) ?? null;
        const existing = await this.repo.findImpactByOrderItem(item.id, tx);
        if (existing === null) result.created += 1;
        else result.updated += 1;

        const { productType, metrics } = this.calculator.calculateCustomImpact(
          productGroup,
          item.quantity,
          workflow,
          assumptions,
        );

        await this.repo.saveImpact(
          existing?.id ?? null,
          {
            workflowId: workflow?.id ?? null,
            tenantId: order.tenantId,
            customOrderId: order.id,
            customOrderItemId: item.id,
            productType,
            metrics,
            assumptions,
            now,
          },
          tx,
        );

        if (metrics.calculationStatus === "COMPLETE") result.complete += 1;
        else result.partial += 1;
      }

      result.skipped = result.skippedItems.length;
      return result;
    });
  }
}
