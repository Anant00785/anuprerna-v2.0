import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await loomGet('/get/customer/loyalty/info', { token });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch loyalty info' }, { status: 500 });
  }
}
