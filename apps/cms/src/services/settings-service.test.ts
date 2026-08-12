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

  it("getSettings propagates a backend error instead of silently returning hardcoded fallback data", async () => {
    useHandlers(
      http.get("*/get/settings", () => new HttpResponse(null, { status: 500 }))
    );
    // The caller must be able to distinguish "real settings" from "backend is
    // down" -- see CLAUDE.md rule 2 (never fabricate data to fill a UI).
    await expect(SettingsService.getSettings()).rejects.toBeTruthy();
  });

  it("getSettings also falls back when the backend returns an empty settingsList array", async () => {
    useHandlers(
      http.get("*/get/settings", () => HttpResponse.json(envelope("settingsList", [])))
    );
    const result = await SettingsService.getSettings();
    expect(result.length).toBe(4);
  });

  it("updateSettingsItem propagates the failure instead of reporting false success", async () => {
    useHandlers(
      http.post("*/update/settings", () => new HttpResponse(null, { status: 500 }))
    );
    await expect(SettingsService.updateSettingsItem(1, "new-value")).rejects.toBeTruthy();
  });

  it("updateSettingsItem resolves true when the backend request succeeds", async () => {
    useHandlers(
      http.post("*/update/settings", () => HttpResponse.json({ success: true }))
    );
    await expect(SettingsService.updateSettingsItem(1, "new-value")).resolves.toBe(true);
  });
});
