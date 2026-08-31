import { NextResponse } from 'next/server';
import { loomPost } from '@/lib/loom/client';

// POST { email } -> Loom /check-email/tenant
// Mirrors the live Angular tenant-verification step (TenantVerificationTransmissionService.verifyTenant).
// Returns the branching flags the email-first auth flow needs:
//   registered:    an account exists for this email
//   emailVerified: that account has a verified email
// Loom response shape: { entity: { registered, emailVerified }, success }.
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
      // ADDITIVE, and it was being dropped here: AuthShell branches on it to send
      // a PASSWORDLESS account straight to the code step instead of a password box
      // it can never satisfy. The backend has returned it since the code lane
      // shipped; this route simply never forwarded it, so the branch was dead.
      passwordless: entity.passwordless === true,
    });
  } catch (e: unknown) {
    const body = (e as { body?: { message?: string } })?.body;
    const msg = body?.message || 'Could not verify the email. Please try again.';
    const status = (e as { status?: number })?.status ?? 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
