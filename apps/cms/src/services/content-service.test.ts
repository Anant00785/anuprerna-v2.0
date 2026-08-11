import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { ContentService, type BlogPost } from "./content-service";

describe("ContentService.getBlogTypes", () => {
  it("hits /get/blog-content-types and unwraps blogContentTypeList", async () => {
    const fixture = [{ id: 1, name: "Craft" }];
    useHandlers(http.get("*/get/blog-content-types", () => HttpResponse.json(envelope("blogContentTypeList", fixture))));

    const result = await ContentService.getBlogTypes();

    expect(result).toEqual(fixture);
  });
});

describe("ContentService.createBlog / getBlogById", () => {
  it("createBlog posts the partial payload as-is", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post("*/add/blog-content", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload: Partial<BlogPost> = { title: "Weaving 101", body: "..." };
    await ContentService.createBlog(payload);

    expect(capturedBody).toEqual(payload);
  });

  it("getBlogById sends the id in the path and unwraps the single-object blogContent key", async () => {
    let capturedPath = "";
    const fixture: Partial<BlogPost> = { id: 7, title: "Indigo Dyeing" };
    useHandlers(
      http.get("*/get/blog-content/:id", ({ request, params }) => {
        capturedPath = new URL(request.url).pathname;
        expect(params.id).toBe("7");
        return HttpResponse.json(envelope("blogContent", fixture));
      })
    );

    const result = await ContentService.getBlogById(7);

    expect(capturedPath).toBe("/api/backend/get/blog-content/7");
    expect(result).toEqual(fixture);
  });
});

describe("ContentService error propagation", () => {
  it("has no try/catch: a success:false envelope on getStories propagates as a thrown error", async () => {
    useHandlers(http.get("*/get/story-content-list", () => HttpResponse.json(errorEnvelope("locked"))));

    await expect(ContentService.getStories()).rejects.toThrow("locked");
  });
});

describe("ContentService.getFaqs", () => {
  // No page in apps/cms currently calls getFaqs() — grepped for callers, none found.
  // It is real, wired to a real endpoint, and will be used shortly per the CMS team.
  it("hits /get/faqs and unwraps faqList, even though no page calls it yet", async () => {
    const fixture = [{ id: 1, question: "Do you ship internationally?", answer: "Yes" }];
    useHandlers(http.get("*/get/faqs", () => HttpResponse.json(envelope("faqList", fixture))));

    const result = await ContentService.getFaqs();

    expect(result).toEqual(fixture);
  });
});
