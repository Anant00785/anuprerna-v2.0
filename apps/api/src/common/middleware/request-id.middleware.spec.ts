import { describe, it, expect } from "vitest";
import { RequestIdMiddleware } from "./request-id.middleware.js";

// EXAMPLE co-located unit test — every feature ships one of these next to its source.
describe("RequestIdMiddleware", () => {
  it("generates an id when none is provided", () => {
    const req: any = { headers: {} };
    const res: any = { setHeader: () => {} };
    new RequestIdMiddleware().use(req, res, () => {});
    expect(req.id).toBeTruthy();
  });
  it("preserves an incoming x-request-id", () => {
    const req: any = { headers: { "x-request-id": "abc" } };
    const res: any = { setHeader: () => {} };
    new RequestIdMiddleware().use(req, res, () => {});
    expect(req.id).toBe("abc");
  });
});
