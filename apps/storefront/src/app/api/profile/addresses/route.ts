import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { addAddress } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await loomGet('/get/address-list', { token });
    return NextResponse.json(data);
  } catch (e: unknown) {
    // Log the real Loom rejection instead of a bare 500 -- Loom accepts this JWT for
    // this exact call from the VPS but rejects it (401 Unauthorized) from Vercel's
    // serverless network (see 2026-07-04 investigation). Keeping this so the next
    // occurrence shows up in Vercel logs instead of a silent generic 500.
    console.error('[api/profile/addresses] error:', e instanceof Error ? e.message : String(e),
      (e as { status?: number })?.status, JSON.stringify((e as { body?: unknown })?.body));
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}


// POST -> save a new address for the logged-in customer (wrapper add/address,
// CODE_CU). Forwards the httpOnly loom_jwt so the wrapper scopes it to the
// caller. Handles the wrapper's { success, message } shape (message = new id on
// success) and its soft-denial (200 { success:false }) without faking success.
export async function POST(req: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    body = {};
  }
  try {
    const result = await addAddress(token, body);
    if (result?.success) {
      return NextResponse.json({ success: true, id: result.message ?? null });
    }
    // Wrapper answered but declined (validation / soft-denial) -> surface it.
    return NextResponse.json(
      { success: false, message: result?.message || 'Could not save address.' },
      { status: 400 },
    );
  } catch (e: unknown) {
    console.error('[api/profile/addresses POST] error:', e instanceof Error ? e.message : String(e),
      (e as { status?: number })?.status, JSON.stringify((e as { body?: unknown })?.body));
    return NextResponse.json({ success: false, error: 'Failed to save address' }, { status: 502 });
  }
}
