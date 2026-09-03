import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionCookie } from "./lib/session-hmac";

/**
 * Weave session enforcement.
 *
 *  - Every PAGE except the login route requires a valid session (redirect to
 *    /login otherwise).
 *  - Every /api/* route returns 401 JSON when the session is absent/expired
 *    (this INTENTIONALLY also gates api routes other lanes are building).
 *
 * The CMS holds no key for the Loom JWT in `weave_token`, so it cannot verify
 * that signature — and it must not accept any well-formed unexpired JWT as a
 * session (the old "presence + shape" bar admitted a hand-crafted token). A
 * JWT session is admitted only when the `weave_session` cookie, minted by
 * /api/auth/login after a REAL credential check and HMAC-bound to this exact
 * token with CMS_SESSION_SECRET, verifies. No secret configured = no JWT
 * session — fail closed. See src/lib/session-hmac.ts.
 */
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

// Reachable WITHOUT a session (the login page + the login POST itself).
const PUBLIC_PATHS = new Set<string>(["/login", "/api/auth/login"]);

async function tokenValid(token: string | undefined, sessionCookie: string | undefined): Promise<boolean> {
  if (!token) return false;
  // Sandbox super-user session token (opaque 64-char, not a JWT) — an exact
  // match against a server-held secret is a real credential in itself.
  if (process.env.SANDBOX_ADMIN_TOKEN && token === process.env.SANDBOX_ADMIN_TOKEN) return true;
  const parts = token.split(".");
  if (parts.length !== 3) return false; // not a well-formed JWT
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const payload = JSON.parse(atob(b64 + pad)) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return false; // expired
    }
  } catch {
    return false; // malformed payload
  }
  // The CMS cannot verify the Loom JWT signature; it verifies its own
  // login-time HMAC binding instead. Unset secret → fail closed.
  const secret = process.env.CMS_SESSION_SECRET;
  if (!secret) return false;
  return verifySessionCookie(sessionCookie, token, secret);
}

// Outer access gate — active ONLY where CMS_ACCESS_USER/PASS are set (the public
// Vercel deployment); unset on the VPS so localhost:3010 is unchanged. Sits IN
// FRONT of the session gate as defence in depth: 69 screens read via a
// server-side service token, so the page gate is the only check for them.
function basicAuthGate(req: NextRequest): NextResponse | null {
  const user = process.env.CMS_ACCESS_USER;
  const pass = process.env.CMS_ACCESS_PASS;
  if (!user || !pass) return null; // gate disabled (VPS)
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (i >= 0 && decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) {
        return null; // authorized
      }
    } catch { /* fall through to challenge */ }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Anuprerna CMS (sandbox)"' },
  });
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const gate = basicAuthGate(req);
  if (gate) return gate;
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await tokenValid(token, sessionCookie)) {
    // Dev-only tools (Rebuild Map, QA Center, Code Review) are local-only —
    // Rebuild Map reads VPS-local files and throws server-side on Vercel's
    // serverless FS. Redirect instead of letting the page code execute.
    // NEXT_PUBLIC_HIDE_DEV_TOOLS=1 is set ONLY on Vercel; unset on the VPS
    // (:3010), so local nav + routes are unaffected.
    if (
      process.env.NEXT_PUBLIC_HIDE_DEV_TOOLS === "1" &&
      (pathname.startsWith("/rebuild-map") ||
        pathname.startsWith("/journey-tests") ||
        pathname.startsWith("/code-review"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "unauthorized", message: "Session required" },
      { status: 401 },
    );
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "?next=" + encodeURIComponent(pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals + static asset files. The /login and
  // /api/auth/login exemptions are handled inside middleware().
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|css|js)$).*)",
  ],
};
