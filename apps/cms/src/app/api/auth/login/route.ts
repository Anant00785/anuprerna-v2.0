import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, mintSessionCookie } from "@/lib/session-hmac";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const USER_COOKIE = "weave_user";

/** Derive a readable display name from an email local-part. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || email;
}

/**
 * Ask the Loom backend to verify the credential. Returns its JWT, or undefined
 * when the credential is rejected or no endpoint could be reached. It never
 * falls back to a token of its own — "could not verify" and "verified" must not
 * produce the same result.
 */
async function authenticateWithLoom(
  email: string,
  password: string,
): Promise<string | undefined> {
  // BACKEND_URL only. The legacy loom-v2 host used to be tried FIRST here, so
  // every CMS admin login authenticated against the Java backend even after the
  // cutover. Our API serves the same route (loom-legacy-auth.controller.ts) with
  // the same bcrypt(pepper+password) check and 401s a bad credential.
  const authEndpoints = [`${BACKEND}/authenticate/email`];

  for (const endpoint of authEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "localhost",
        },
        body: JSON.stringify({
          username: email,
          email,
          password,
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const jwt =
          (data.jwt as string | undefined) ??
          (data.bearerToken as string | undefined) ??
          (data.token as string | undefined);
        if (jwt) return jwt;
      }
    } catch {
      // Try the next endpoint. Falling out of the loop means "not verified".
    }
  }
  return undefined;
}

/** True only in an explicitly-declared, non-production sandbox. */
function sandboxLoginEnabled(): boolean {
  return (
    process.env.CMS_SANDBOX_LOGIN === "true" &&
    process.env.NODE_ENV !== "production" &&
    !!process.env.SANDBOX_ADMIN_TOKEN
  );
}

/**
 * Compare against the ONE configured sandbox credential. Both halves must be
 * set — an unset password must never match an empty submission.
 *
 * ponytail: plain string compare, matching the basic-auth gate in
 * src/middleware.ts. Move both to crypto.timingSafeEqual together if a timing
 * oracle on a locally-configured dev secret ever becomes worth closing.
 */
function sandboxCredentialMatches(email: string, password: string): boolean {
  const wantEmail = process.env.CMS_SANDBOX_LOGIN_EMAIL;
  const wantPassword = process.env.CMS_SANDBOX_LOGIN_PASSWORD;
  if (!wantEmail || !wantPassword) return false;
  return email.trim().toLowerCase() === wantEmail.trim().toLowerCase() && password === wantPassword;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
  }

  // ── Credential check ──────────────────────────────────────────────────────
  //
  // FAILS CLOSED. This block used to read:
  //
  //     let token = process.env.SANDBOX_ADMIN_TOKEN;
  //     for (const endpoint of authEndpoints) { ...maybe overwrite token... }
  //     if (!token) return 401;
  //
  // i.e. the sandbox service token was seeded BEFORE any credential was
  // checked and nothing cleared it when every auth endpoint refused — so with
  // SANDBOX_ADMIN_TOKEN set, ANY email and ANY password minted a session
  // cookie holding that token, which middleware.tokenValid() explicitly
  // accepts. Password auth was decorative: an authentication bypass on an
  // admin CMS. Now the credential check runs first and its RESULT decides.
  let token: string | undefined = await authenticateWithLoom(email, password);

  // The sandbox fallback is an ADDITIONAL credential, never a bypass of the
  // check above. It requires all four of:
  //   - CMS_SANDBOX_LOGIN=true                (explicit opt-in)
  //   - NODE_ENV !== "production"             (impossible to enable in prod)
  //   - CMS_SANDBOX_LOGIN_EMAIL/_PASSWORD set (an actual configured credential)
  //   - the submitted email+password matching them exactly
  // Mirrors the PAYMENTS_LIVE_MODE guard in apps/api's env schema: an explicit
  // flag AND NODE_ENV, both required, defaulting to off.
  if (!token && sandboxLoginEnabled() && sandboxCredentialMatches(email, password)) {
    token = process.env.SANDBOX_ADMIN_TOKEN;
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 },
    );
  }

  // The middleware cannot verify the Loom JWT's signature (the CMS holds no
  // key for it), so it verifies the HMAC session cookie minted HERE — after a
  // real credential check — instead. Without the secret we cannot issue a
  // verifiable session: fail loudly rather than mint one nothing will accept.
  const sessionSecret = process.env.CMS_SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json(
      { success: false, message: "CMS_SESSION_SECRET is not configured; sessions cannot be issued." },
      { status: 500 },
    );
  }

  {
    const maxAgeSeconds = 60 * 60 * 8; // 8 hours session
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });
    cookieStore.set(SESSION_COOKIE, await mintSessionCookie(token, Date.now() + maxAgeSeconds * 1000, sessionSecret), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    // Identity cookie (the token JWT carries no email/name).
    //
    // httpOnly since 2026-08-16. The old comment here said "NOT httpOnly so the
    // widget flow can resolve it", but that stopped being true: nothing reads
    // this cookie from the browser. `grep -rn 'document.cookie' src/` returns
    // nothing, and PageFeedbackWidget resolves identity over /api/auth/me, which
    // reads it SERVER-side via getIdentity(). Every consumer is server-side, and
    // httpOnly does not affect server reads.
    //
    // It matters now because /api/crud derives workflow-comment attribution from
    // getIdentity() instead of trusting a client-supplied authorName. If a page
    // script could still rewrite this cookie, that derivation would just be the
    // same spoof one step removed.
    const userPayload = Buffer.from(
      JSON.stringify({ email, name: nameFromEmail(email) }),
    ).toString("base64");
    cookieStore.set(USER_COOKIE, userPayload, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  return NextResponse.json({ success: true, message: "Signed in" });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(USER_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ success: true, message: "Signed out" });
}
