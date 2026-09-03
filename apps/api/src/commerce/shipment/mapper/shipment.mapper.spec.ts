import { describe, it, expect } from "vitest";
import { mapToEntity, mapToData } from "./shipment.mapper.js";
import { ShipmentInput } from "../dto/shipment.dto.js";
import { LocationType, ShipmentEntity } from "../types/shipment.types.js";

describe("mapToEntity", () => {
  it("maps input fields, dropping id (not part of ShipmentEntity's writable fields)", () => {
    const input: ShipmentInput = {
      id: 5n,
      name: "Standard",
      baseAmount: 150,
      baseQuantity: 1,
      additionalAmount: 50,
      estimatedFromDay: 3,
      estimatedToDay: 7,
      locationType: LocationType.DOMESTIC,
    };
    const out = mapToEntity(input);
    expect(out).toEqual({
      name: "Standard",
      baseAmount: 150,
      baseQuantity: 1,
      additionalAmount: 50,
      estimatedFromDay: 3,
      estimatedToDay: 7,
      locationType: LocationType.DOMESTIC,
    });
    expect(out).not.toHaveProperty("id");
  });
});

describe("mapToData", () => {
  it("spreads the entity and casts locationType to string", () => {
    const entity: ShipmentEntity = {
      id: 1n,
      version: 1n,
      name: "Standard",
      baseAmount: 150,
      baseQuantity: 1,
      additionalAmount: 50,
      estimatedFromDay: 3,
      estimatedToDay: 7,
      locationType: LocationType.INTERNATIONAL,
    };
    const out = mapToData(entity);
    expect(out).toEqual({
      id: 1n,
      version: 1n,
      name: "Standard",
      baseAmount: 150,
      baseQuantity: 1,
      additionalAmount: 50,
      estimatedFromDay: 3,
      estimatedToDay: 7,
      locationType: "INTERNATIONAL",
    });
  });
});
