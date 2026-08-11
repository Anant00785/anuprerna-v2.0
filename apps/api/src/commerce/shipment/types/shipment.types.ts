// @ts-nocheck
export enum LocationType {
  DOMESTIC = "DOMESTIC",
  INTERNATIONAL = "INTERNATIONAL",
}

export interface ShipmentEntity {
  id: bigint;
  version: bigint;
  name: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
  locationType: LocationType;
}

export interface ShipmentData {
  id: bigint;
  version: bigint;
  name: string;
  baseAmount: number;
  baseQuantity: number;
  additionalAmount: number;
  estimatedFromDay: number;
  estimatedToDay: number;
  locationType: string;
}
// @ts-nocheck
// @ts-nocheck
