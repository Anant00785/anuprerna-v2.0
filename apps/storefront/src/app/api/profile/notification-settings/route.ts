import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// MUTATION STUB — update WhatsApp opt-in/out. Wired but NOT called in test mode.
export async function PUT() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.log('[STUB] WhatsApp notification update requested — not executed (test mode).');
  return NextResponse.json({ success: false, message: 'Notification updates are disabled in demo mode.' }, { status: 403 });
}
