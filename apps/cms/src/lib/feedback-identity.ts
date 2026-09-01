/**
 * Server-only identity resolver.
 *
 * Weave auth = an httpOnly `weave_token` cookie holding a Loom JWT. That JWT
 * carries no email/name (only an opaque `sub`), and the login response returns
 * only { jwt }. So the sole place the user's email is known is the login form.
 * On login we stash a `weave_user` cookie (base64 JSON {email,name}); this
 * helper reads it. Presence of the token cookie = "logged in".
 *
 * Both cookies are httpOnly — `weave_user` became httpOnly on 2026-08-16 once
 * /api/crud started deriving workflow-comment attribution from this function.
 * Every consumer is server-side (this file, /api/auth/me, /api/crud, the
 * feedback routes); nothing in the browser reads it.
 *
 * SCOPE OF THE GUARANTEE. This resolves WHO THE SESSION SAYS IT IS, which is not
 * the same as an authenticated identity: /api/auth/login writes this cookie from
 * the email typed into the login form without checking a credential, because the
 * sandbox backend has no credential store (see that route's own note). So callers
 * may rely on this being stable and server-controlled for the life of a session,
 * and may NOT treat it as proof of identity until the auth cutover lands.
 */
import { cookies } from "next/headers";

// Registry of emails allowed to moderate ANY feedback row (resolve/edit/delete),
// not just their own submissions. Amit logs in as either address depending on
// context; the team's shared admin login (support@) needs the same rights.
export const OWNER_EMAILS = ["amit@anuprerna.com", "support@anuprerna.com"];
// Back-compat alias (unused elsewhere as of 2026-07-20 — grep confirmed no other
// importers — kept in case future code wants "the" owner email for display).
export const OWNER_EMAIL = OWNER_EMAILS[0];
const TOKEN_COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";
const USER_COOKIE = "weave_user";

export interface Identity {
  authenticated: boolean;
  email: string;
  name: string;
  isOwner: boolean;
}

export async function getIdentity(): Promise<Identity> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return { authenticated: false, email: "", name: "", isOwner: false };

  let email = "";
  let name = "Team member";
  const raw = store.get(USER_COOKIE)?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as {
        email?: string;
        name?: string;
      };
      if (parsed.email) email = String(parsed.email);
      if (parsed.name) name = String(parsed.name);
    } catch {
      /* malformed cookie — fall back to anonymous logged-in user */
    }
  }
  const isOwner =
    !!email && OWNER_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
  return { authenticated: true, email, name, isOwner };
}
