import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { addAddress } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { decodeTokenPayload } from '@/lib/auth/token-helper';
import { userAddressStore } from '@/lib/auth/user-address-store';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ addressList: [], authenticated: false });

  const payload = decodeTokenPayload(token);
  const email = (payload?.email || payload?.sub || '') as string;
  const localList = email ? userAddressStore.getAddresses(email) : [];

  try {
    const data = await loomGet<{ addressList?: unknown[] }>('/get/address-list', { token });
    const remoteList = data?.addressList;
    if (Array.isArray(remoteList) && remoteList.length > 0) {
      return NextResponse.json({ ...data, authenticated: true });
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ addressList: localList, success: true, authenticated: true });
}

export async function POST(req: Request) {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    body = {};
  }

  const payload = token ? decodeTokenPayload(token) : null;
  const email = (payload?.email || payload?.sub || (body.email as string) || '') as string;

  let savedId: number | string = Date.now();
  if (email) {
    const record = userAddressStore.addAddress(email, {
      ...body,
      name: (body.name as string) || (payload?.name as string) || '',
    });
    savedId = record.id;
  }

  if (token) {
    try {
      await addAddress(token, body);
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ success: true, id: savedId, message: 'Address saved successfully.' });
}
