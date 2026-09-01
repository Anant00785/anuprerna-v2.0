import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

  let token: string | undefined = process.env.SANDBOX_ADMIN_TOKEN;

  // 1. Authenticate with Loom backend
  const authEndpoints = [
    "https://loom-v2.anuprerna.com/authenticate/email",
    `${BACKEND}/authenticate/email`,
  ];

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
        if (jwt) {
          token = jwt;
          break;
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Invalid email or password" },
      { status: 401 },
    );
  }

  {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // 8 hours session
      maxAge: 60 * 60 * 8,
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
  return NextResponse.json({ success: true, message: "Signed out" });
}
