import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { getArtisanList, getSkillList } from "./artisans-api";

describe("artisans-api", () => {
  it("normalizes tenant-nested fields on a valid envelope", async () => {
    useHandlers(
      http.get("*/get/artisans", () =>
        HttpResponse.json(
          envelope("artisanList", [
            {
              id: 1,
              artisanRole: "WORKER",
              tenant: { name: "Meera", contactNumber: "9999", active: true, gender: "FEMALE" },
              skills: [{ id: 10, name: "Weaving" }],
            },
          ]),
        ),
      ),
    );

    const [artisan] = await getArtisanList("tok");

    expect(artisan).toMatchObject({ name: "Meera", contactNumber: "9999", active: true });
    expect(artisan.skillIds).toEqual([10]);
  });

  it("rejects with the backend's message on {success:false} at HTTP 200", async () => {
    useHandlers(http.get("*/get/artisans", () => HttpResponse.json(errorEnvelope("forbidden"))));

    await expect(getArtisanList("tok")).rejects.toThrow("forbidden");
  });

  it("rejects on a 500", async () => {
    useHandlers(http.get("*/get/artisans", () => new HttpResponse(null, { status: 500 })));

    await expect(getArtisanList("tok")).rejects.toThrow(/500/);
  });

  it("getSkillList rejects rather than hiding a rejection as an empty skill list", async () => {
    useHandlers(http.get("*/get/skills", () => HttpResponse.json(errorEnvelope("skills offline"))));

    await expect(getSkillList("tok")).rejects.toThrow("skills offline");
  });
});
