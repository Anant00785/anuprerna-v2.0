import { describe, it, expect } from "vitest";
import { sanitizeShipment } from "./shipment.sanitizer.js";
import { LocationType } from "../types/shipment.types.js";

const base = {
  name: "Standard",
  baseAmount: 10,
  baseQuantity: 1,
  additionalAmount: 0,
  estimatedFromDay: 1,
  estimatedToDay: 5,
  locationType: LocationType.DOMESTIC,
};

describe("sanitizeShipment", () => {
  it("trims and HTML-escapes the name", () => {
    const out = sanitizeShipment({ ...base, name: "  <b>Fast</b>  " });
    expect(out.name).toBe("&lt;b&gt;Fast&lt;/b&gt;");
  });

  it("leaves a falsy name untouched rather than throwing", () => {
    const out = sanitizeShipment({ ...base, name: "" });
    expect(out.name).toBe("");
  });
});
