/**
 * Port of Loom `impact/pojo/ImpactAssumptions.java` plus the validation that
 * `settings/dao/controller/SettingsDAOController.java` applies before handing
 * the value to the calculation engine.
 *
 * There is no default and no fallback. Loom's `retrieveImpactAssumptions()`
 * returns null when the setting is absent, unparseable, or incomplete, and the
 * engine then writes NOTHING and reports `IMPACT_ASSUMPTIONS_NOT_CONFIGURED`.
 * Substituting constants here would reproduce exactly the fabricated-impact bug
 * (5.00 m / 12.50 kg CO2) that was removed from this area.
 */

/** Loom: SETTINGS_ATTRIBUTE.IMPACT_ASSUMPTIONS. */
export const IMPACT_ASSUMPTIONS_ATTRIBUTE = "IMPACT_ASSUMPTIONS";

/** Loom: CustomImpactFactorDAOController.IMPACT_ASSUMPTIONS_NOT_CONFIGURED. */
export const IMPACT_ASSUMPTIONS_NOT_CONFIGURED = "IMPACT_ASSUMPTIONS_NOT_CONFIGURED";

export interface ImpactAssumptions {
  assumptionVersion: number;
  carbonDioxideSavedKgPerMeter: number;
  waterSavedLitersPerMeter: number;
  womenArtisanWorkPercentage: number;
  womenStitchingWorkPercentage: number;
}

/** Loom: SettingsDAOController.isNonNegative — present, finite, >= 0. */
function isNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Loom: SettingsDAOController.isPercentage — a decimal fraction in [0, 1]. */
function isPercentage(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

/**
 * Loom: SettingsDAOController.convertImpactAssumptions +
 * isValidImpactAssumptions. The stored `attribute_value` is jsonb, so it
 * arrives either already decoded or as a JSON string (Loom accepts both).
 * Anything incomplete is null, never a partially-populated object.
 */
export function parseImpactAssumptions(raw: unknown): ImpactAssumptions | null {
  let value: unknown = raw;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const version = candidate.assumptionVersion;

  if (typeof version !== "number" || !Number.isFinite(version) || version <= 0) return null;
  if (!isNonNegative(candidate.carbonDioxideSavedKgPerMeter)) return null;
  if (!isNonNegative(candidate.waterSavedLitersPerMeter)) return null;
  if (!isPercentage(candidate.womenArtisanWorkPercentage)) return null;
  if (!isPercentage(candidate.womenStitchingWorkPercentage)) return null;

  return {
    assumptionVersion: version,
    carbonDioxideSavedKgPerMeter: candidate.carbonDioxideSavedKgPerMeter,
    waterSavedLitersPerMeter: candidate.waterSavedLitersPerMeter,
    womenArtisanWorkPercentage: candidate.womenArtisanWorkPercentage,
    womenStitchingWorkPercentage: candidate.womenStitchingWorkPercentage,
  };
}
