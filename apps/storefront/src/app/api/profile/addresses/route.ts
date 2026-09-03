import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { addAddress } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await loomGet<{ addressList?: unknown[] }>('/get/address-list', { token });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ addressList: [], success: false }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    body = {};
  }

  // The backend is the only store. A failure is reported, not hidden behind a
  // local write that the next request would never see.
  try {
    const saved = await addAddress(token, body);
    // The backend answers 200 with { success: false } for a rejected address
    // (missing fields, bad pin code). Reporting that as saved leaves the buyer
    // with a confirmation and no address, so relay its verdict, not just its
    // status code.
    if (saved?.success === false) {
      return NextResponse.json(
        { success: false, entity: saved, message: saved?.message || 'Could not save the address.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, entity: saved, message: 'Address saved successfully.' });
  } catch {
    return NextResponse.json({ success: false, message: 'Could not save the address.' }, { status: 502 });
  }
}
