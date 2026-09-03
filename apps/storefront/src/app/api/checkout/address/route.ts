import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { addAddress } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ addressList: [], authenticated: false });

  try {
    const data = await loomGet<{ addressList?: unknown[] }>('/get/address-list', { token });
    return NextResponse.json({ ...data, authenticated: true });
  } catch {
    return NextResponse.json({ addressList: [], success: false, authenticated: true }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    body = {};
  }

  if (!token) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const saved = await addAddress(token, body);
    return NextResponse.json({ success: true, entity: saved, message: 'Address saved successfully.' });
  } catch {
    return NextResponse.json({ success: false, message: 'Could not save the address.' }, { status: 502 });
  }
}
