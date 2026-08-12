import { describe, it, expect } from "vitest";
import { validateShipment } from "./shipment.validator.js";
import { LocationType } from "../types/shipment.types.js";
import { ShipmentInput } from "../dto/shipment.dto.js";

function makeShipment(overrides: Partial<ShipmentInput> = {}): ShipmentInput {
  return {
    name: "Standard",
    baseAmount: 10,
    baseQuantity: 1,
    additionalAmount: 0,
    estimatedFromDay: 1,
    estimatedToDay: 5,
    locationType: LocationType.DOMESTIC,
    ...overrides,
  };
}

describe("validateShipment", () => {
  it("accepts a valid shipment", () => {
    expect(validateShipment(makeShipment())).toBeNull();
  });

  it("rejects a blank name", () => {
    expect(validateShipment(makeShipment({ name: "  " }))).toMatch(/Name must be/);
  });

  it("rejects a name over 255 chars", () => {
    expect(validateShipment(makeShipment({ name: "a".repeat(256) }))).toMatch(/Name must be/);
  });

  it("rejects a non-positive baseAmount", () => {
    expect(validateShipment(makeShipment({ baseAmount: 0 }))).toMatch(/Base amount/);
  });

  it("rejects a non-positive baseQuantity", () => {
    expect(validateShipment(makeShipment({ baseQuantity: 0 }))).toMatch(/Base quantity/);
  });

  it("rejects a negative additionalAmount", () => {
    expect(validateShipment(makeShipment({ additionalAmount: -1 }))).toMatch(/Additional amount/);
  });

  it("rejects an estimatedFromDay below 1", () => {
    expect(validateShipment(makeShipment({ estimatedFromDay: 0 }))).toMatch(/Estimated from day/);
  });

  it("rejects estimatedToDay not strictly greater than estimatedFromDay", () => {
    expect(validateShipment(makeShipment({ estimatedFromDay: 5, estimatedToDay: 5 }))).toMatch(/Estimated to day/);
  });

  it("rejects a falsy locationType", () => {
    expect(validateShipment(makeShipment({ locationType: "" as LocationType }))).toMatch(/location type/);
  });
});
