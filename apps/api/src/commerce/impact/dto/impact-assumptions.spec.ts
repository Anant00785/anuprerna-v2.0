/**
 * Loom SettingsDAOController.isValidImpactAssumptions: an incomplete or
 * out-of-range configuration is NOT usable, and the engine must see null rather
 * than a partially-filled object. This is the check that stops invented impact
 * figures reaching the CMS as measured data.
 */
import { describe, it, expect } from "vitest";
import { parseImpactAssumptions } from "./impact-assumptions.js";

const valid = {
  assumptionVersion: 2,
  carbonDioxideSavedKgPerMeter: 2.5,
  waterSavedLitersPerMeter: 90,
  womenArtisanWorkPercentage: 0.75,
  womenStitchingWorkPercentage: 0.8,
};

describe("parseImpactAssumptions", () => {
  it("accepts a complete configuration", () => {
    expect(parseImpactAssumptions(valid)).toEqual(valid);
  });

  it("accepts the same configuration stored as a JSON string", () => {
    expect(parseImpactAssumptions(JSON.stringify(valid))).toEqual(valid);
  });

  it("rejects a missing or non-positive version", () => {
    expect(parseImpactAssumptions({ ...valid, assumptionVersion: undefined })).toBeNull();
    expect(parseImpactAssumptions({ ...valid, assumptionVersion: 0 })).toBeNull();
  });

  it("rejects negative or non-finite formula values", () => {
    expect(parseImpactAssumptions({ ...valid, carbonDioxideSavedKgPerMeter: -1 })).toBeNull();
    expect(parseImpactAssumptions({ ...valid, waterSavedLitersPerMeter: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it("rejects percentages outside [0, 1] — they are decimal fractions, not 0-100", () => {
    expect(parseImpactAssumptions({ ...valid, womenArtisanWorkPercentage: 75 })).toBeNull();
    expect(parseImpactAssumptions({ ...valid, womenStitchingWorkPercentage: -0.1 })).toBeNull();
  });

  it("rejects anything that is not an object", () => {
    expect(parseImpactAssumptions(null)).toBeNull();
    expect(parseImpactAssumptions("not json")).toBeNull();
    expect(parseImpactAssumptions([valid])).toBeNull();
  });
});
