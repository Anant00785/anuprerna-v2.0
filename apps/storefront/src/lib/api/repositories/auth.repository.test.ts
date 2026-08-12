import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { authRepository } from "./auth.repository";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";

describe("authRepository.loginEmail", () => {
  it("POSTs credentials to authenticate/email and returns the JWT", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/authenticate/email`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(envelope("jwt", "signed.jwt.token"));
      })
    );
    const res = await authRepository.loginEmail("user@test.com", "hunter2");
    expect(capturedBody).toEqual({ username: "user@test.com", password: "hunter2" });
    expect(res.jwt).toBe("signed.jwt.token");
  });

  it("throws on a 401 (bad credentials) rather than swallowing it", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/authenticate/email`, () =>
        HttpResponse.json({ success: false, message: "Bad credentials" }, { status: 401 })
      )
    );
    await expect(authRepository.loginEmail("user@test.com", "wrong")).rejects.toThrow(/API Error \[401\]/);
  });

  it("throws on a 500 error envelope", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/authenticate/email`, () =>
        HttpResponse.json({ success: false, message: "Server error" }, { status: 500 })
      )
    );
    await expect(authRepository.loginEmail("a@b.com", "x")).rejects.toThrow(/API Error \[500\]/);
  });
});

describe("authRepository.checkEmailTenant", () => {
  it("POSTs to check-email/tenant and returns the tenant status", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.post(`${PROXY_BASE}/check-email/tenant`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(envelope("registered", true));
      })
    );
    const res = await authRepository.checkEmailTenant("user@test.com");
    expect(capturedUrl).toBe(`${PROXY_BASE}/check-email/tenant`);
    expect(res.registered).toBe(true);
  });

  it("swallows a failing request and falls back to { registered: false } instead of throwing", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/check-email/tenant`, () => HttpResponse.json({ message: "down" }, { status: 500 }))
    );
    await expect(authRepository.checkEmailTenant("user@test.com")).resolves.toEqual({ registered: false });
  });
});

describe("authRepository.registerCustomer", () => {
  it("POSTs the full registration payload to customer/registration", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/customer/registration`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(envelope("jwt", "new-user-jwt"));
      })
    );
    const data = { email: "new@test.com", password: "pw", firstName: "A", lastName: "B" };
    const res = await authRepository.registerCustomer(data);
    expect(capturedBody).toEqual(data);
    expect(res.jwt).toBe("new-user-jwt");
  });
});

describe("authRepository.sendPasswordResetEmail", () => {
  it("POSTs the email and returns the success confirmation", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/send/password-reset/email`, () =>
        HttpResponse.json({ success: true, message: "Reset email sent" })
      )
    );
    const res = await authRepository.sendPasswordResetEmail("user@test.com");
    expect(res).toEqual({ success: true, message: "Reset email sent" });
  });
});
