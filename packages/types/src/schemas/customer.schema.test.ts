import { describe, it, expect } from "vitest";
import { CustomerSchema } from "./customer.schema.js";

// EXAMPLE schema test — every schema in @anuprerna/types ships one so the contract is enforced.
describe("CustomerSchema", () => {
  it("accepts a valid customer", () => {
    const ok = CustomerSchema.safeParse({ id: 1, name: "Ayan", email: "a@b.com", provider: "GOOGLE" });
    expect(ok.success).toBe(true);
  });
  it("rejects a bad email and unknown provider", () => {
    expect(CustomerSchema.safeParse({ id: 1, name: "x", email: "nope", provider: "GOOGLE" }).success).toBe(false);
    expect(CustomerSchema.safeParse({ id: 1, name: "x", email: "a@b.com", provider: "TWITTER" }).success).toBe(false);
  });
});
