/**
 * Ports of Loom `impact/pojo/ImpactCalculationResult.java` and
 * `impact/pojo/ImpactSkippedItem.java`, serialized under
 * ResponseParameter.IMPACT_CALCULATION (`impactCalculation`).
 */

export interface ImpactSkippedItem {
  orderItemId: number;
  reason: string;
}

export interface ImpactCalculationResult {
  orderId: number;
  created: number;
  updated: number;
  skipped: number;
  complete: number;
  partial: number;
  configurationError: string | null;
  skippedItems: ImpactSkippedItem[];
}

/** Loom's @Builder.Default values: every counter starts at 0, skippedItems empty. */
export function emptyCalculationResult(orderId: number): ImpactCalculationResult {
  return {
    orderId,
    created: 0,
    updated: 0,
    skipped: 0,
    complete: 0,
    partial: 0,
    configurationError: null,
    skippedItems: [],
  };
}
