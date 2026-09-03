/**
 * middleware.ts IS the CMS server-side auth gate — the only thing standing
 * between an unauthenticated request and 96 routes plus every /api/* handler,
 * so its exact accept/reject boundary is worth pinning.
 *
 * What these tests protect:
 *   - pages redirect, /api/* returns 401 JSON (a redirect would be parsed as a
 *     successful response body by a fetch caller),
 *   - only /login and /api/auth/login are reachable without a session,
 *   - an expired or malformed JWT does NOT count as a session,
 *   - a JWT is a session ONLY with the login-minted weave_session HMAC cookie
 *     binding that exact token — the CMS holds no key for the Loom JWT itself,
 *     so a bare well-formed token (the old "presence + shape" bar, which
 *     admitted forged tokens) is rejected,
 *   - with CMS_SESSION_SECRET unset the gate fails CLOSED for JWT sessions,
 *   - the basic-auth gate sits IN FRONT of the session gate,
 *   - the SANDBOX_ADMIN_TOKEN shortcut is real (pinned, see the login route
 *     test for why that matters).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { mintSessionCookie } from "./lib/session-hmac";

const SECRET = "test-session-secret";

function jwt(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${b64}.signature`;
}

const FUTURE = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
const EXPIRED = jwt({ exp: Math.floor(Date.now() / 1000) - 3600 });

async function session(token: string): Promise<string> {
  return mintSessionCookie(token, Date.now() + 3600_000, SECRET);
}

function req(
  pathname: string,
  opts: { token?: string; session?: string; authHeader?: string } = {},
): NextRequest {
  const r = new NextRequest(`http://localhost:3004${pathname}`, {
    headers: opts.authHeader ? { authorization: opts.authHeader } : undefined,
  });
  if (opts.token !== undefined) r.cookies.set("weave_token", opts.token);
  if (opts.session !== undefined) r.cookies.set("weave_session", opts.session);
  return r;
}

/** A request carrying a full, correctly-signed session pair. */
async function authedReq(pathname: string, opts: { authHeader?: string } = {}): Promise<NextRequest> {
  return req(pathname, { token: FUTURE, session: await session(FUTURE), ...opts });
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
    process.env.CMS_SESSION_SECRET = SECRET;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("redirects an unauthenticated page request to /login, preserving where it was going", async () => {
    const res = await middleware(req("/artisanflow/workflow"));

    expect(redirectTo(res)).toBe(
      "http://localhost:3004/login?next=%2Fartisanflow%2Fworkflow",
    );
  });

  it("returns 401 JSON — not a redirect — for an unauthenticated /api/* call", async () => {
    // A 307 to /login would be followed by fetch() and parsed as HTML, so the
    // caller would report a JSON parse error instead of 'not signed in'.
    const res = await middleware(req("/api/crud"));

    expect(res.status).toBe(401);
    expect(redirectTo(res)).toBeNull();
  });

  it("lets the login page and the login POST through without a session", async () => {
    expect((await middleware(req("/login"))).status).toBe(200);
    expect((await middleware(req("/api/auth/login"))).status).toBe(200);
  });

  it("does NOT treat /api/auth/me as public — it is only reachable with a session", async () => {
    expect((await middleware(req("/api/auth/me"))).status).toBe(401);
  });

  it("admits a well-formed, unexpired JWT accompanied by its login-minted session cookie", async () => {
    expect((await middleware(await authedReq("/dashboard"))).status).toBe(200);
  });

  it("REJECTS a well-formed, unexpired JWT without the session cookie — presence + shape is no longer a session", async () => {
    // This was the forged-token hole: any hand-crafted 3-part token with a
    // future exp used to be accepted as an admin session.
    expect(redirectTo(await middleware(req("/dashboard", { token: FUTURE })))).toContain("/login");
  });

  it("rejects a forged JWT even when a session cookie exists for a DIFFERENT token", async () => {
    const forged = jwt({ exp: 9e9 });
    const res = await middleware(req("/dashboard", { token: forged, session: await session(FUTURE) }));
    expect(redirectTo(res)).toContain("/login");
  });

  it("rejects a session cookie whose HMAC is wrong", async () => {
    const res = await middleware(
      req("/dashboard", { token: FUTURE, session: `${Date.now() + 3600_000}.${"0".repeat(64)}` }),
    );
    expect(redirectTo(res)).toContain("/login");
  });

  it("rejects an EXPIRED session cookie even for the right token", async () => {
    const stale = await mintSessionCookie(FUTURE, Date.now() - 1000, SECRET);
    expect(redirectTo(await middleware(req("/dashboard", { token: FUTURE, session: stale })))).toContain("/login");
  });

  it("fails CLOSED when CMS_SESSION_SECRET is unset — no JWT session verifies", async () => {
    const sessionCookie = await session(FUTURE);
    delete process.env.CMS_SESSION_SECRET;
    const res = await middleware(req("/dashboard", { token: FUTURE, session: sessionCookie }));
    expect(redirectTo(res)).toContain("/login");
  });

  it("rejects an EXPIRED JWT rather than accepting any non-empty string", async () => {
    const res = await middleware(req("/dashboard", { token: EXPIRED, session: await session(EXPIRED) }));
    expect(redirectTo(res)).toContain("/login");
  });

  it("rejects a token that is not a three-part JWT", async () => {
    const res = await middleware(req("/dashboard", { token: "not-a-jwt", session: await session("not-a-jwt") }));
    expect(redirectTo(res)).toContain("/login");
  });

  it("rejects a JWT whose payload is not decodable JSON", async () => {
    const res = await middleware(req("/dashboard", { token: "a.!!!!.c", session: await session("a.!!!!.c") }));
    expect(redirectTo(res)).toContain("/login");
  });

  it("admits a JWT with no exp claim when its session cookie binds it (the cookie carries the expiry)", async () => {
    const noExp = jwt({ sub: "42" });
    const res = await middleware(req("/dashboard", { token: noExp, session: await session(noExp) }));
    expect(res.status).toBe(200);
  });

  it("PINNED: the raw SANDBOX_ADMIN_TOKEN is accepted as a session token", () => {
    // Paired with /api/auth/login minting exactly this value only after the
    // sandbox credential check. See docs/KNOWN-GAPS.md, "CMS auth".
    process.env.SANDBOX_ADMIN_TOKEN = "opaque-64-char-service-secret";

    return middleware(req("/dashboard", { token: "opaque-64-char-service-secret" })).then((res) =>
      expect(res.status).toBe(200),
    );
  });

  it("does not accept ANY cookie value when SANDBOX_ADMIN_TOKEN is unset", async () => {
    // Guard against `token === undefined-env` style equality accidents.
    const res = await middleware(req("/dashboard", { token: "undefined" }));
    expect(redirectTo(res)).toContain("/login");
  });
});

describe("middleware — outer basic-auth gate", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.CMS_ACCESS_USER = "ops";
    process.env.CMS_ACCESS_PASS = "s3cret";
    process.env.CMS_SESSION_SECRET = SECRET;
    delete process.env.SANDBOX_ADMIN_TOKEN;
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("challenges even the public login page — it sits IN FRONT of the session gate", async () => {
    const res = await middleware(req("/login"));

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
  });

  it("challenges a request holding a valid session but no basic-auth header", async () => {
    expect((await middleware(await authedReq("/dashboard"))).status).toBe(401);
  });

  it("passes a correct credential through to the session gate", async () => {
    const header = "Basic " + Buffer.from("ops:s3cret").toString("base64");

    expect((await middleware(await authedReq("/dashboard", { authHeader: header }))).status).toBe(200);
    // …and the session gate still applies underneath it.
    expect(redirectTo(await middleware(req("/dashboard", { authHeader: header })))).toContain("/login");
  });

  it("rejects a wrong password, and a password containing a colon is compared whole", async () => {
    const wrong = "Basic " + Buffer.from("ops:nope").toString("base64");
    expect((await middleware(req("/dashboard", { authHeader: wrong }))).status).toBe(401);

    process.env.CMS_ACCESS_PASS = "a:b";
    const colon = "Basic " + Buffer.from("ops:a:b").toString("base64");
    expect((await middleware(await authedReq("/dashboard", { authHeader: colon }))).status).toBe(200);
  });

  it("is disabled entirely when the credentials are not configured (the VPS)", async () => {
    delete process.env.CMS_ACCESS_USER;
    delete process.env.CMS_ACCESS_PASS;

    expect((await middleware(await authedReq("/dashboard"))).status).toBe(200);
  });
});

describe("middleware — dev-tool routes on the public deployment", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    delete process.env.CMS_ACCESS_USER;
    delete process.env.CMS_ACCESS_PASS;
    process.env.CMS_SESSION_SECRET = SECRET;
    process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS = "1";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("redirects the local-only tools to /dashboard so their server code never runs", async () => {
    for (const p of ["/rebuild-map", "/journey-tests/runs", "/code-review"]) {
      expect(redirectTo(await middleware(await authedReq(p)))).toBe(
        "http://localhost:3004/dashboard",
      );
    }
  });

  it("leaves them reachable when the flag is unset", async () => {
    delete process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS;

    expect((await middleware(await authedReq("/rebuild-map"))).status).toBe(200);
  });
});
