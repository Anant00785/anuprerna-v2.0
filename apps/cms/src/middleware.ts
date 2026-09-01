import { NextRequest, NextResponse } from "next/server";

/**
 * Weave session enforcement.
 *
 *  - Every PAGE except the login route requires a valid session cookie
 *    (redirect to /login otherwise).
 *  - Every /api/* route returns 401 JSON when the session cookie is
 *    absent/expired (this INTENTIONALLY also gates api routes other lanes are
 *    building).
 *
 * v1 limitation: we decode the JWT payload and check `exp` but do NOT verify
 * the signature here (the wrapper/Loom remains the cryptographic authority).
 * Presence + well-formed (3-part) + unexpired is the v1 bar. Tighten to a real
 * signature verify when the wrapper exposes a verification key.
 */
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

// Reachable WITHOUT a session (the login page + the login POST itself).
const PUBLIC_PATHS = new Set<string>(["/login", "/api/auth/login"]);

function tokenValid(token: string | undefined): boolean {
  if (!token) return false;
  // Sandbox super-user session token (opaque 64-char, not a JWT).
  if (token === process.env.SANDBOX_ADMIN_TOKEN) return true;
  const parts = token.split(".");
  if (parts.length !== 3) return false; // not a well-formed JWT
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const payload = JSON.parse(atob(b64 + pad)) as { exp?: number };
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return false; // expired
    }
    return true;
  } catch {
    return false; // malformed payload
  }
}

// Outer access gate — active ONLY where CMS_ACCESS_USER/PASS are set (the public
// Vercel deployment); unset on the VPS so localhost:3010 is unchanged. Sits IN
// FRONT of the v1 session gate because that gate does not verify JWT signatures
// and 69 screens read via a server-side service token — without this, a forged
// cookie could read private data on a public URL.
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

export function middleware(req: NextRequest): NextResponse {
  const gate = basicAuthGate(req);
  if (gate) return gate;
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (tokenValid(token)) {
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
