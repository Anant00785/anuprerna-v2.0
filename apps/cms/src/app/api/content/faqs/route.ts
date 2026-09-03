/**
 * GET /api/content/faqs
 *
 * Read-only proxy — forwards GET /get/faqs to the Loom backend.
 * Auth: session cookie falling back to server-minted SANDBOX_ADMIN_TOKEN.
 * No mutation exports; GET only.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceToken } from '@/lib/loom-service-token';
import { getBackendCallToken } from '@/lib/backend-call-token';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';
const COOKIE = process.env.AUTH_COOKIE_NAME ?? 'weave_token';

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);

  // fetch() REJECTS when the backend is unreachable (connection refused, DNS,
  // timeout) -- it does not return a non-ok Response. That rejection was
  // unhandled, so Next answered with an opaque HTML 500 and the caller's
  // r.json() died on "Unexpected token '<'". Every sibling proxy route answers
  // JSON on an outage; this one was the outlier.
  let res: Response;
  try {
    res = await fetch(`${BACKEND}/get/faqs`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: 'localhost',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Can't reach the backend at ${BACKEND}/get/faqs — is it running, and is BACKEND_URL correct?`,
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { error: `Backend ${res.status}`, detail: text.slice(0, 200) },
      { status: res.status },
    );
  }

  const data = await res.json().catch(() => null);
  if (data === null) {
    return NextResponse.json({ error: 'Backend returned a non-JSON body.' }, { status: 502 });
  }
  return NextResponse.json(data);
}
