import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet, loomPut } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { isWrapperToken } from '@/lib/loom/token';

// POST /api/profile/wishlist/remove  body: { sku }
// The wishlist is a per-tenant comma-separated-SKU column; the native write route
// (PUT /manage/wishlist/{csv}) REPLACES the whole list. We read the current CSV,
// drop the given sku, and PUT the remainder — keeping the CSV logic server-side so
// the client only sends the one sku to remove.
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
  const sku = String((body as { sku?: unknown })?.sku ?? '').trim();
  if (!sku) {
    return NextResponse.json({ success: false, message: 'A product SKU is required.' }, { status: 400 });
  }
  try {
    const profile = await loomGet<{ customer?: { wishlist?: string } }>('/get/customer/profile', { token });
    const current = (profile?.customer?.wishlist || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.filter((s) => s !== sku);
    // The route path-param cannot be empty (PUT /manage/wishlist/ -> 501 route miss);
    // ' ' is the canonical "empty wishlist" value (stores " ", renders 0 items).
    const csv = next.length ? next.join(',') : ' ';
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
