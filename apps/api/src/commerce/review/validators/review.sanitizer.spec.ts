import { describe, it, expect } from "vitest";
import { sanitizeReview, sanitizeReviewStatus } from "./review.sanitizer.js";

describe("sanitizeReview", () => {
  it("trims and HTML-escapes every optional string field", () => {
    const out = sanitizeReview({
      name: "  <b>N</b>  ",
      city: " C&C ",
      country: ' "IN" ',
      description: " it's <great> ",
      link: " http://a&b ",
      productImages: " <img> ",
    });
    expect(out.name).toBe("&lt;b&gt;N&lt;/b&gt;");
    expect(out.city).toBe("C&amp;C");
    expect(out.country).toBe("&quot;IN&quot;");
    expect(out.description).toBe("it&#x27;s &lt;great&gt;");
    expect(out.link).toBe("http://a&amp;b");
    expect(out.productImages).toBe("&lt;img&gt;");
  });

  it("leaves missing optional fields undefined", () => {
    const out = sanitizeReview({});
    expect(out.name).toBeUndefined();
    expect(out.city).toBeUndefined();
    expect(out.country).toBeUndefined();
  });
});

describe("sanitizeReviewStatus", () => {
  it("trims the status field only", () => {
    expect(sanitizeReviewStatus({ status: "  APPROVED  ", name: "kept" }).status).toBe("APPROVED");
  });
});
