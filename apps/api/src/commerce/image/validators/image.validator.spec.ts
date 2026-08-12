import { describe, it, expect } from "vitest";
import { validateImageFile, validateImageUrl } from "./image.validator.js";

describe("validateImageFile", () => {
  it("accepts an allowed mime type within the size limit", () => {
    expect(validateImageFile("image/png", 1024)).toBeNull();
  });

  it("rejects a missing mimetype", () => {
    expect(validateImageFile(undefined, 1024)).toMatch(/Invalid file type/);
  });

  it("rejects a disallowed mime type", () => {
    expect(validateImageFile("application/pdf", 1024)).toMatch(/Invalid file type/);
  });

  it("rejects a file over the 10 MB limit", () => {
    expect(validateImageFile("image/png", 10 * 1024 * 1024 + 1)).toMatch(/too large/);
  });

  it("accepts exactly the 10 MB boundary", () => {
    expect(validateImageFile("image/png", 10 * 1024 * 1024)).toBeNull();
  });

  it("does not size-check when size is undefined", () => {
    expect(validateImageFile("image/png", undefined)).toBeNull();
  });
});

describe("validateImageUrl", () => {
  it("accepts a non-empty url", () => {
    expect(validateImageUrl("https://example.com/x.png")).toBeNull();
  });

  it("rejects an undefined url", () => {
    expect(validateImageUrl(undefined)).toMatch(/required/);
  });

  it("rejects a whitespace-only url", () => {
    expect(validateImageUrl("   ")).toMatch(/required/);
  });
});
