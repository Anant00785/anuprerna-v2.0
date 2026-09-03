import { describe, it, expect } from "vitest";
import { mapSettingsRowToDTO, mapSettingsRowListToDTOList } from "./settings.mapper.js";

describe("mapSettingsRowToDTO", () => {
  it("maps every field straight through, casting the enum-typed fields", () => {
    const out = mapSettingsRowToDTO({
      id: 1n,
      version: 2n,
      attributeName: "CASH_ON_DELIVERY",
      attributeType: "BOOLEAN",
      attributeValue: true,
      attributeLink: "",
    });
    expect(out).toEqual({
      id: 1n,
      version: 2n,
      attributeName: "CASH_ON_DELIVERY",
      attributeType: "BOOLEAN",
      attributeValue: true,
      attributeLink: "",
    });
  });
});

describe("mapSettingsRowListToDTOList", () => {
  it("maps each row in the list", () => {
    const rows = [
      { id: 1n, version: 1n, attributeName: "CASH_ON_DELIVERY", attributeType: "BOOLEAN", attributeValue: true, attributeLink: "" },
      { id: 2n, version: 1n, attributeName: "SWATCH_PRICE_PERCENTAGE", attributeType: "NUMBER", attributeValue: 10, attributeLink: "" },
    ];
    const out = mapSettingsRowListToDTOList(rows);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe(1n);
    expect(out[1].attributeValue).toBe(10);
  });

  it("returns an empty array for an empty list", () => {
    expect(mapSettingsRowListToDTOList([])).toEqual([]);
  });
});
