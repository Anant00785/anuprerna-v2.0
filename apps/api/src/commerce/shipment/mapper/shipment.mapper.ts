// @ts-nocheck
import { ShipmentInput } from "../dto/shipment.dto.js";
import { ShipmentEntity, ShipmentData } from "../types/shipment.types.js";

export function mapToEntity(input: ShipmentInput): Partial<ShipmentEntity> {
  return {
    name: input.name,
    baseAmount: input.baseAmount,
    baseQuantity: input.baseQuantity,
    additionalAmount: input.additionalAmount,
    estimatedFromDay: input.estimatedFromDay,
    estimatedToDay: input.estimatedToDay,
    locationType: input.locationType,
  };
}

export function mapToData(entity: ShipmentEntity): ShipmentData {
  return {
    ...entity,
    locationType: entity.locationType as string,
  };
}
// @ts-nocheck
// @ts-nocheck
