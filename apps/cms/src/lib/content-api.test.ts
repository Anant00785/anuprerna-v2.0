import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { getStoryList, getFaqById } from "./content-api";

describe("content-api", () => {
  it("returns the parsed list on a valid envelope", async () => {
    useHandlers(
      http.get("*/get/story-content-list", () =>
        HttpResponse.json(envelope("storyContentList", [{ id: 3, heading: "Indigo" }])),
      ),
    );

    await expect(getStoryList("tok")).resolves.toEqual([{ id: 3, heading: "Indigo" }]);
  });

  it("rejects with the backend's message on {success:false} at HTTP 200", async () => {
    useHandlers(
      http.get("*/get/story-content-list", () => HttpResponse.json(errorEnvelope("stories unavailable"))),
    );

    await expect(getStoryList("tok")).rejects.toThrow("stories unavailable");
  });

  it("rejects on a 500", async () => {
    useHandlers(http.get("*/get/story-content-list", () => new HttpResponse(null, { status: 500 })));

    await expect(getStoryList("tok")).rejects.toThrow(/500/);
  });

  it("keeps 'refused' and 'no such record' distinct on a detail read", async () => {
    // A rejection throws...
    useHandlers(http.get("*/get/faq/7", () => HttpResponse.json(errorEnvelope("faq refused"))));
    await expect(getFaqById(7, "tok")).rejects.toThrow("faq refused");

    // ...while a genuinely absent record is still a plain null, not an error.
    useHandlers(http.get("*/get/faq/7", () => HttpResponse.json(envelope("faq", null))));
    await expect(getFaqById(7, "tok")).resolves.toBeNull();
  });
});
