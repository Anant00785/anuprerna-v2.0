import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { ReviewService, type IReview } from "./review-service";

describe("ReviewService.fetchReviewList", () => {
  it("sends the exact path and query params, and unwraps the reviewList envelope", async () => {
    let capturedUrl: URL | undefined;
    const fixture: IReview[] = [
      { id: 1, name: "Asha", city: "Pune", country: "IN", rating: 5, description: "Lovely", status: "PENDING" },
    ];

    useHandlers(
      http.get("*/get/super-user/review", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("reviewList", fixture));
      })
    );

    const result = await ReviewService.fetchReviewList("PENDING", 2, 25);

    expect(capturedUrl?.pathname).toBe("/api/backend/get/super-user/review");
    expect(capturedUrl?.searchParams.get("pageNumber")).toBe("2");
    expect(capturedUrl?.searchParams.get("pageSize")).toBe("25");
    expect(capturedUrl?.searchParams.get("status")).toBe("PENDING");
    expect(result).toEqual(fixture);
  });

  it("has no try/catch: a success:false envelope propagates as a thrown error", async () => {
    useHandlers(
      http.get("*/get/super-user/review", () => HttpResponse.json(errorEnvelope("nope")))
    );

    await expect(ReviewService.fetchReviewList()).rejects.toThrow("nope");
  });
});

describe("ReviewService mutations", () => {
  it("addReview posts the payload as-is to /add/review", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post("*/add/review", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload: IReview = { name: "Ravi", city: "Delhi", country: "IN", rating: 4, description: "Good" };
    await ReviewService.addReview(payload);

    expect(capturedBody).toEqual(payload);
  });

  it("updateReview issues a PATCH to /update/super-user/review with the payload", async () => {
    let method = "";
    let capturedBody: unknown;
    useHandlers(
      http.patch("*/update/super-user/review", async ({ request }) => {
        method = request.method;
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload: IReview = { id: 9, name: "Ravi", city: "Delhi", country: "IN", rating: 3, description: "Ok", status: "APPROVED" };
    await ReviewService.updateReview(payload);

    expect(method).toBe("PATCH");
    expect(capturedBody).toEqual(payload);
  });
});

describe("ReviewService.fetchReviewList defaults", () => {
  it("defaults to status=PENDING, pageNumber=0, pageSize=50 when called with no args", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/super-user/review", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("reviewList", []));
      })
    );

    await ReviewService.fetchReviewList();

    expect(capturedUrl?.searchParams.get("status")).toBe("PENDING");
    expect(capturedUrl?.searchParams.get("pageNumber")).toBe("0");
    expect(capturedUrl?.searchParams.get("pageSize")).toBe("50");
  });
});

describe("ReviewService.uploadReviewImage", () => {
  it("does not manually set Content-Type on the FormData body, so the request resolves instead of hanging", async () => {
    let capturedContentType: string | null = null;
    useHandlers(
      http.post("*/upload/image", async ({ request }) => {
        capturedContentType = request.headers.get("content-type");
        return HttpResponse.json({ imageUrl: "https://cdn.example.com/reviews/1.jpg" });
      })
    );

    const file = new File(["fake-image-bytes"], "photo.jpg", { type: "image/jpeg" });

    // Previously, manually forcing Content-Type: multipart/form-data (with no
    // boundary parameter) on a FormData body broke server-side multipart
    // parsing -- reproduced as an indefinite hang. Letting the platform set
    // the header resolves promptly and never produces the broken bare
    // "multipart/form-data" (no boundary=) value that caused it.
    const url = await ReviewService.uploadReviewImage(file);

    expect(capturedContentType).not.toBe("multipart/form-data");
    expect(url).toBe("https://cdn.example.com/reviews/1.jpg");
  });
});
