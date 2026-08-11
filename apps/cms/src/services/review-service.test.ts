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

// NOTE: uploadReviewImage is not covered by a network round-trip test here.
// It calls apiClient.post(..., formData, { headers: { 'Content-Type':
// 'multipart/form-data' } }) — manually setting Content-Type on a FormData
// body without a boundary parameter. Browsers normally auto-generate this
// header (including the required boundary) when Content-Type is left unset;
// overriding it like this is a known anti-pattern that can strip the
// boundary and break multipart parsing server-side. Reproducing this call
// through axios+jsdom's XHR in this test environment hangs indefinitely
// (confirmed: identical call without the header override completes in
// under 100ms). Flagging as a likely real bug, not fixed here per the
// "characterize, don't fix" rule — see docs/TESTING.md.
