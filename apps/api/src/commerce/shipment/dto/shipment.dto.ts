// @ts-nocheck
import { LocationType } from "../types/shipment.types.js";

export interface ShipmentInput {
  id?: bigint;
  name: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
  locationType: LocationType;
}

export function parseShipmentInput(raw: unknown): ShipmentInput {
  const obj = raw as Record<string, unknown>;
  
  return {
    id: typeof obj.id === "number" || typeof obj.id === "bigint" || typeof obj.id === "string" ? BigInt(obj.id) : undefined,
    name: typeof obj.name === "string" ? obj.name : "",
    baseAmount: typeof obj.baseAmount === "number" ? obj.baseAmount : 0,
    baseQuantity: typeof obj.baseQuantity === "number" ? obj.baseQuantity : 0,
    additionalAmount: typeof obj.additionalAmount === "number" ? obj.additionalAmount : 0,
    estimatedFromDay: typeof obj.estimatedFromDay === "number" ? obj.estimatedFromDay : 0,
    estimatedToDay: typeof obj.estimatedToDay === "number" ? obj.estimatedToDay : 0,
    locationType: typeof obj.locationType === "string" && Object.values(LocationType).includes(obj.locationType as LocationType) 
      ? (obj.locationType as LocationType) 
      : LocationType.DOMESTIC,
  };
}
// @ts-nocheck
// @ts-nocheck
