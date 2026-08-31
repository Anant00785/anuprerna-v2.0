import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// MUTATION STUB — cancel order. Wired but NOT called in test mode.
// Real call: POST /cancel/order/:id with token.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // STUB — never call the real endpoint in test mode
  console.log('[STUB] Cancel order requested for id:', id, '— not executed (test mode).');
  return NextResponse.json({ success: false, message: 'Order cancellation is disabled in demo mode.' }, { status: 403 });
}
