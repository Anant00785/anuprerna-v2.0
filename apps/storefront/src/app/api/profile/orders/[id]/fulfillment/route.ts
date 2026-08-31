import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await loomGet('/get/customer/order/' + id + '/fulfillment-list', { token });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fulfillment' }, { status: 500 });
  }
}
