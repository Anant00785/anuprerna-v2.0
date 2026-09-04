import { NextResponse } from 'next/server';
import { loomPut } from '@/lib/loom/client';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/profile/wishlist/set  body: { skus: string[] }
// Persists the whole wishlist. The native write route (PUT /manage/wishlist/{csv})
// REPLACES the list, so the client sends the full set it wants stored.
//
// This exists because the wishlist store used to sync through
// `update/customer/profile` with only a `wishlist` field — the wrong endpoint,
// so additions never reached the profile and the wishlist page (which reads the
// profile CSV back) stayed empty. Removal already used the native route; this is
// its add/replace counterpart.
export async function POST(request: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  if (!isWrapperToken(token)) {
    return NextResponse.json(
      { success: false, reauth: true, message: 'Your session has expired — please sign in again.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const raw = (body as { skus?: unknown })?.skus;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ success: false, message: 'skus must be an array.' }, { status: 400 });
  }
  const skus = Array.from(
    new Set(raw.map((s) => String(s ?? '').trim()).filter(Boolean)),
  );

  try {
    // The route path-param cannot be empty (PUT /manage/wishlist/ -> 501 route miss);
    // ' ' is the canonical "empty wishlist" value (stores " ", renders 0 items).
    const csv = skus.length ? skus.join(',') : ' ';
    const result = await loomPut('/manage/wishlist/' + encodeURIComponent(csv), undefined, { token });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Failed to update wishlist.' },
      { status: e?.status || 500 },
    );
  }
}
