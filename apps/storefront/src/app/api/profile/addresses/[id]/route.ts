import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// MUTATION STUBS — update/delete address. Wired but NOT executed in test mode.
export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.log('[STUB] Update address requested for id:', id, '— not executed (test mode).');
  return NextResponse.json({ success: false, message: 'Address updates are disabled in demo mode.' }, { status: 403 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.log('[STUB] Delete address requested for id:', id, '— not executed (test mode).');
  return NextResponse.json({ success: false, message: 'Address deletion is disabled in demo mode.' }, { status: 403 });
}
