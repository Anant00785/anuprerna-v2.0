/**
 * middleware.ts IS the CMS server-side auth gate. It did not exist when
 * apps/cms/CLAUDE.md and docs/KNOWN-GAPS.md were last written (both still say
 * "no middleware.ts anywhere in apps/cms"); it exists now and it is the only
 * thing standing between an unauthenticated request and 96 routes plus every
 * /api/* handler, so its exact accept/reject boundary is worth pinning.
 *
 * What these tests protect:
 *   - pages redirect, /api/* returns 401 JSON (a redirect would be parsed as a
 *     successful response body by a fetch caller),
 *   - only /login and /api/auth/login are reachable without a session,
 *   - an expired or malformed JWT does NOT count as a session,
 *   - the basic-auth gate sits IN FRONT of the session gate,
 *   - the SANDBOX_ADMIN_TOKEN shortcut is real (pinned, see the login route
 *     test for why that matters).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function jwt(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${b64}.signature`;
}

const FUTURE = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
const EXPIRED = jwt({ exp: Math.floor(Date.now() / 1000) - 3600 });

function req(
  pathname: string,
  opts: { token?: string; authHeader?: string } = {},
): NextRequest {
  const r = new NextRequest(`http://localhost:3004${pathname}`, {
    headers: opts.authHeader ? { authorization: opts.authHeader } : undefined,
  });
  if (opts.token !== undefined) r.cookies.set("weave_token", opts.token);
  return r;
}

/** Where a NextResponse.redirect points, or null when it is not a redirect. */
function redirectTo(res: Response): string | null {
  return res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
}

describe("middleware — session gate", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    delete process.env.CMS_ACCESS_USER;
    delete process.env.CMS_ACCESS_PASS;
    delete process.env.SANDBOX_ADMIN_TOKEN;
    delete process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("redirects an unauthenticated page request to /login, preserving where it was going", () => {
    const res = middleware(req("/artisanflow/workflow"));

    expect(redirectTo(res)).toBe(
      "http://localhost:3004/login?next=%2Fartisanflow%2Fworkflow",
    );
  });

  it("returns 401 JSON — not a redirect — for an unauthenticated /api/* call", () => {
    // A 307 to /login would be followed by fetch() and parsed as HTML, so the
    // caller would report a JSON parse error instead of 'not signed in'.
    const res = middleware(req("/api/crud"));

    expect(res.status).toBe(401);
    expect(redirectTo(res)).toBeNull();
  });

  it("lets the login page and the login POST through without a session", () => {
    expect(middleware(req("/login")).status).toBe(200);
    expect(middleware(req("/api/auth/login")).status).toBe(200);
  });

  it("does NOT treat /api/auth/me as public — it is only reachable with a session", () => {
    expect(middleware(req("/api/auth/me")).status).toBe(401);
  });

  it("admits a well-formed, unexpired JWT", () => {
    expect(middleware(req("/dashboard", { token: FUTURE })).status).toBe(200);
  });

  it("rejects an EXPIRED JWT rather than accepting any non-empty string", () => {
    // This is the defect AuthService.hasValidJWT still has client-side; the
    // server gate must not repeat it.
    expect(redirectTo(middleware(req("/dashboard", { token: EXPIRED })))).toContain("/login");
  });

  it("rejects a token that is not a three-part JWT", () => {
    expect(redirectTo(middleware(req("/dashboard", { token: "not-a-jwt" })))).toContain("/login");
  });

  it("rejects a JWT whose payload is not decodable JSON", () => {
    expect(redirectTo(middleware(req("/dashboard", { token: "a.!!!!.c" })))).toContain("/login");
  });

  it("admits a JWT with no exp claim — presence + shape is the v1 bar", () => {
    expect(middleware(req("/dashboard", { token: jwt({ sub: "42" }) })).status).toBe(200);
  });

  it("PINNED: the raw SANDBOX_ADMIN_TOKEN is accepted as a session token", () => {
    // Paired with /api/auth/login minting exactly this value for any password.
    // See docs/KNOWN-GAPS.md, "CMS auth".
    process.env.SANDBOX_ADMIN_TOKEN = "opaque-64-char-service-secret";

    expect(middleware(req("/dashboard", { token: "opaque-64-char-service-secret" })).status).toBe(
      200,
    );
  });

  it("does not verify the JWT signature — any signature segment is accepted", () => {
    // Documented v1 limitation, pinned so nobody assumes otherwise. Tighten
    // together with the wrapper exposing a verification key.
    const forged = `header.${Buffer.from(JSON.stringify({ exp: 9e9 })).toString("base64url")}.forged`;

    expect(middleware(req("/dashboard", { token: forged })).status).toBe(200);
  });
});

describe("middleware — outer basic-auth gate", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.CMS_ACCESS_USER = "ops";
    process.env.CMS_ACCESS_PASS = "s3cret";
    delete process.env.SANDBOX_ADMIN_TOKEN;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("challenges even the public login page — it sits IN FRONT of the session gate", () => {
    const res = middleware(req("/login"));

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
  });

  it("challenges a request holding a valid session but no basic-auth header", () => {
    expect(middleware(req("/dashboard", { token: FUTURE })).status).toBe(401);
  });

  it("passes a correct credential through to the session gate", () => {
    const header = "Basic " + Buffer.from("ops:s3cret").toString("base64");

    expect(middleware(req("/dashboard", { token: FUTURE, authHeader: header })).status).toBe(200);
    // …and the session gate still applies underneath it.
    expect(redirectTo(middleware(req("/dashboard", { authHeader: header })))).toContain("/login");
  });

  it("rejects a wrong password, and a password containing a colon is compared whole", () => {
    const wrong = "Basic " + Buffer.from("ops:nope").toString("base64");
    expect(middleware(req("/dashboard", { authHeader: wrong })).status).toBe(401);

    process.env.CMS_ACCESS_PASS = "a:b";
    const colon = "Basic " + Buffer.from("ops:a:b").toString("base64");
    expect(middleware(req("/dashboard", { token: FUTURE, authHeader: colon })).status).toBe(200);
  });

  it("is disabled entirely when the credentials are not configured (the VPS)", () => {
    delete process.env.CMS_ACCESS_USER;
    delete process.env.CMS_ACCESS_PASS;

    expect(middleware(req("/dashboard", { token: FUTURE })).status).toBe(200);
  });
});

describe("middleware — dev-tool routes on the public deployment", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    delete process.env.CMS_ACCESS_USER;
    delete process.env.CMS_ACCESS_PASS;
    process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS = "1";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("redirects the local-only tools to /dashboard so their server code never runs", () => {
    for (const p of ["/rebuild-map", "/journey-tests/runs", "/code-review"]) {
      expect(redirectTo(middleware(req(p, { token: FUTURE })))).toBe(
        "http://localhost:3004/dashboard",
      );
    }
  });

  it("leaves them reachable when the flag is unset", () => {
    delete process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS;

    expect(middleware(req("/rebuild-map", { token: FUTURE })).status).toBe(200);
  });
});
