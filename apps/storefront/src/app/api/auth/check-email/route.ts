import { NextResponse } from 'next/server';
import { loomPost } from '@/lib/loom/client';

export async function POST(req: Request) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
  }

  try {
    const data = await loomPost<{
      entity?: { registered?: boolean; emailVerified?: boolean; passwordless?: boolean };
      success?: boolean;
    }>('/check-email/tenant', { email });
    const entity = data?.entity ?? {};
    return NextResponse.json({
      success: true,
      registered: entity.registered === true,
      emailVerified: entity.emailVerified === true,
      passwordless: entity.passwordless === true,
    });
  } catch (e: unknown) {
    const body = (e as { body?: { message?: string } })?.body;
    const msg = body?.message || 'Could not verify the email. Please try again.';
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
