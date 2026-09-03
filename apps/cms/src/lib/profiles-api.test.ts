import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { getBadgeProfiles } from "./profiles-api";

describe("profiles-api", () => {
  it("returns the parsed list on a valid envelope", async () => {
    useHandlers(
      http.get("*/get/badge-profile-list", () =>
        HttpResponse.json(envelope("badgeProfileList", [{ id: 2, name: "Handmade" }])),
      ),
    );

    await expect(getBadgeProfiles("tok")).resolves.toEqual([{ id: 2, name: "Handmade" }]);
  });

  it("rejects with the backend's message on {success:false} at HTTP 200", async () => {
    useHandlers(
      http.get("*/get/badge-profile-list", () => HttpResponse.json(errorEnvelope("profiles unavailable"))),
    );

    await expect(getBadgeProfiles("tok")).rejects.toThrow("profiles unavailable");
  });

  it("rejects on a 500", async () => {
    useHandlers(http.get("*/get/badge-profile-list", () => new HttpResponse(null, { status: 500 })));

    await expect(getBadgeProfiles("tok")).rejects.toThrow(/500/);
  });
});
