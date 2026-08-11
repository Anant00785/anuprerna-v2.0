import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope } from "@/test/msw";
import { SettingsService } from "./settings-service";

describe("SettingsService", () => {
  it("getSettings unwraps 'settingsList' from a real envelope when the backend responds", async () => {
    useHandlers(
      http.get("*/get/settings", () => HttpResponse.json(envelope("settingsList", [{ id: 9, attributeName: "X", attributeType: "TEXT", attributeValue: "y" }])))
    );
    const result = await SettingsService.getSettings();
    expect(result).toEqual([{ id: 9, attributeName: "X", attributeType: "TEXT", attributeValue: "y" }]);
  });

  it("BUG-adjacent: getSettings swallows a backend error and silently returns hardcoded fallback data instead of propagating it", async () => {
    useHandlers(
      http.get("*/get/settings", () => new HttpResponse(null, { status: 500 }))
    );
    const result = await SettingsService.getSettings();
    // No error is thrown; the caller cannot distinguish "real settings" from
    // "backend is down, here are invented defaults" -- see CLAUDE.md rule 2
    // (never fabricate data to fill a UI) — this is exactly that pattern.
    expect(result.find((s) => s.attributeName === "DEFAULT_CURRENCY")?.attributeValue).toBe("INR");
  });

  it("getSettings also falls back when the backend returns an empty settingsList array", async () => {
    useHandlers(
      http.get("*/get/settings", () => HttpResponse.json(envelope("settingsList", [])))
    );
    const result = await SettingsService.getSettings();
    expect(result.length).toBe(4);
  });

  it("BUG: updateSettingsItem returns true even when the backend request fails, giving callers a false success signal", async () => {
    useHandlers(
      http.post("*/update/settings", () => new HttpResponse(null, { status: 500 }))
    );
    const ok = await SettingsService.updateSettingsItem(1, "new-value");
    expect(ok).toBe(true);
  });
});
