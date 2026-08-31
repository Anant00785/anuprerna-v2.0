/**
 * Server-only identity resolver for the storefront Page-Feedback widget.
 *
 * Reuses the storefront's OWN NextAuth-style session: the httpOnly `loom_jwt`
 * cookie holds the Loom customer JWT. We resolve the caller by fetching the Loom
 * customer profile with that token (exactly like /api/auth/me does) — so email /
 * name come from the storefront session, NOT from Weave's weave_token/weave_user
 * cookie scheme. Presence of a valid token + resolvable profile = "logged in".
 * Owner = amit@anuprerna.com.
 *
 * The Loom profile is nested: { customer: { tenant: { email, name } } }. We dig
 * that out (with root/entity fallbacks) so submitter + owner detection work.
 */
import { cookies } from 'next/headers';
import { getCustomerProfile } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export const OWNER_EMAIL = 'amit@anuprerna.com';

export interface Identity {
  authenticated: boolean;
  email: string;
  name: string;
  isOwner: boolean;
}

const ANON: Identity = { authenticated: false, email: '', name: '', isOwner: false };

export async function getIdentity(): Promise<Identity> {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return ANON;
  try {
    const res = (await getCustomerProfile(token)) as Record<string, any>;
    // Real Loom shape: { customer: { tenant: {...} } }; fall back to entity/root.
    const tenant: Record<string, any> =
      res?.customer?.tenant ?? res?.entity ?? res ?? {};
    const email = String(tenant?.email ?? res?.email ?? '').trim();
    if (!email) return ANON; // token valid but no resolvable customer -> logged-out
    const name =
      (typeof tenant?.name === 'string' && tenant.name) ||
      [tenant?.firstName, tenant?.lastName].filter(Boolean).join(' ') ||
      email ||
      'Customer';
    const isOwner = email.toLowerCase() === OWNER_EMAIL;
    return { authenticated: true, email, name, isOwner };
  } catch {
    // Token rejected / expired / Loom unreachable -> treat as logged-out.
    return ANON;
  }
}
