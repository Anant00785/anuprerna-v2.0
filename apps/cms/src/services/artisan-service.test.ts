import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { ArtisanService, type CreateArtisanRequest, type UpdateArtisanRequest } from "./artisan-service";

describe("ArtisanService.getArtisans", () => {
  it("sends includeInactive as a query param and normalizes tenant-nested fields", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/artisans", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(
          envelope("artisanList", [
            {
              id: 1,
              artisanRole: "WORKER",
              tenant: { name: "Meera", contactNumber: "9999", active: true, gender: "FEMALE" },
              skills: [{ id: 10, name: "Weaving" }],
            },
          ])
        );
      })
    );

    const [artisan] = await ArtisanService.getArtisans(false);

    expect(capturedUrl?.searchParams.get("includeInactive")).toBe("false");
    // name/contactNumber/active/gender fall back to the nested tenant object.
    expect(artisan).toMatchObject({ name: "Meera", contactNumber: "9999", active: true, gender: "FEMALE" });
    // skillIds is derived from skills[].id when not sent directly.
    expect(artisan.skillIds).toEqual([10]);
  });

  it("has no try/catch: a success:false envelope propagates as a thrown error", async () => {
    useHandlers(http.get("*/get/artisans", () => HttpResponse.json(errorEnvelope("forbidden"))));

    await expect(ArtisanService.getArtisans()).rejects.toThrow("forbidden");
  });
});

describe("ArtisanService.createArtisan", () => {
  it("nests name/contactNumber/gender/dob/active under tenant in the request body", async () => {
    let capturedBody: any;
    useHandlers(
      http.post("*/add/artisan", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload: CreateArtisanRequest = {
      name: "Kavya",
      contactNumber: "8888",
      artisanRole: "MASTER",
      gender: "FEMALE",
      dob: "15/06/1990",
      active: true,
    };
    await ArtisanService.createArtisan(payload);

    expect(capturedBody.name).toBeUndefined();
    expect(capturedBody.tenant).toEqual({
      name: "Kavya",
      contactNumber: "8888",
      gender: "FEMALE",
      dob: ArtisanService.coerceDob("15/06/1990"),
      active: true,
    });
  });
});

describe("ArtisanService.updateArtisan", () => {
  it("nulls masterArtisanId when artisanRole is MASTER", async () => {
    let capturedBody: any;
    useHandlers(
      http.post("*/update/artisan", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload: UpdateArtisanRequest = {
      id: 3,
      name: "Arjun",
      contactNumber: "7777",
      artisanRole: "MASTER",
      masterArtisanId: 99,
    };
    await ArtisanService.updateArtisan(payload);

    expect(capturedBody.masterArtisanId).toBeNull();
  });
});

describe("ArtisanService.coerceDob", () => {
  it("converts a dd/mm/yyyy string to an epoch timestamp, and passes numbers through", () => {
    expect(ArtisanService.coerceDob(null)).toBe(0);
    expect(ArtisanService.coerceDob(123456)).toBe(123456);
    expect(ArtisanService.coerceDob("15/06/1990")).toBe(new Date(1990, 5, 15).getTime());
  });
});
