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
  // Loom really answers `{entity: {registered, emailVerified}, success}` — reading
  // `registered` off the top level made every existing customer look unregistered,
  // which sent them to the signup form instead of the login form.
  it("unwraps the {entity} envelope Loom actually returns", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.post(`${PROXY_BASE}/check-email/tenant`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(
          envelope("entity", { registered: true, emailVerified: false })
        );
      })
    );
    const res = await authRepository.checkEmailTenant("user@test.com");
    expect(capturedUrl).toBe(`${PROXY_BASE}/check-email/tenant`);
    expect(res).toEqual({ registered: true, emailVerified: false });
  });

  it("swallows a failing request and falls back to { registered: false } instead of throwing", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/check-email/tenant`, () => HttpResponse.json({ message: "down" }, { status: 500 }))
    );
    await expect(authRepository.checkEmailTenant("user@test.com")).resolves.toEqual({ registered: false });
  });
});

describe("authRepository.validateProvider", () => {
  it("reports a Google account as invalid for BASIC and names the real provider", async () => {
    // Observed live for a GOOGLE-provider tenant: {"success":false,"provider":2}
    useHandlers(
      http.post(`${PROXY_BASE}/validate/provider`, () =>
        HttpResponse.json({ success: false, provider: 2 })
      )
    );
    await expect(authRepository.validateProvider("g@test.com")).resolves.toEqual({
      valid: false,
      actualProvider: "GOOGLE",
    });
  });

  it("reports a password account as valid", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/validate/provider`, () =>
        HttpResponse.json({ success: true, provider: -1 })
      )
    );
    await expect(authRepository.validateProvider("b@test.com")).resolves.toEqual({
      valid: true,
      actualProvider: "BASIC",
    });
  });

  it("fails open to the password form rather than stranding the user on a network error", async () => {
    useHandlers(
      http.post(`${PROXY_BASE}/validate/provider`, () => HttpResponse.json({}, { status: 500 }))
    );
    await expect(authRepository.validateProvider("x@test.com")).resolves.toEqual({
      valid: true,
      actualProvider: "BASIC",
    });
  });
});

describe("authRepository.registerCustomer", () => {
  // `/customer/registration` 404s on Loom, and a flat body is rejected 406
  // ("A minion wasn't in the right place at the right time. [NPX]") because the
  // controller binds a Customer whose tenant fields sit under a `tenant` key.
  it("POSTs a tenant-wrapped payload to customer/registration/email", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/customer/registration/email`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "The request is successfully added to database." });
      })
    );
    const res = await authRepository.registerCustomer({
      email: "new@test.com",
      password: "pw",
      firstName: "A",
      lastName: "B",
    });
    expect(capturedBody).toEqual({
      tenant: {
        name: "A B",
        email: "new@test.com",
        password: "pw",
        emailVerified: false,
        provider: "BASIC",
        gender: "",
      },
    });
    expect(res.success).toBe(true);
  });
});

describe("authRepository.registerSocial", () => {
  it("wraps the Auth0 ID token as the tenant password under `tenant`", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post(`${PROXY_BASE}/customer/registration/social`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, message: "" });
      })
    );
    await authRepository.registerSocial("g@test.com", "auth0.id.token", "GOOGLE");
    expect(capturedBody).toEqual({
      tenant: { email: "g@test.com", password: "auth0.id.token", provider: "GOOGLE" },
    });
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
