import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { authenticateEmail } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function POST(req: Request) {
  let name = '';
  let email = '';
  let password = '';
  let phone = '';
  let buyerChoice = '';
  let companyName = '';
  let gstNumber = '';
  let sourcing = '';
  let buyerTypeAsked = false;

  try {
    const body = await req.json();
    name = String(body?.name ?? '').trim().replace(/\s+/g, ' ');
    email = String(body?.email ?? '').trim().toLowerCase();
    password = String(body?.password ?? '');
    phone = String(body?.phone ?? body?.contactNumber ?? '').trim();
    buyerChoice = String(body?.buyerChoice ?? '').trim().toLowerCase();
    companyName = String(body?.companyName ?? '').trim();
    gstNumber = String(body?.gstNumber ?? '').trim();
    sourcing = String(body?.sourcing ?? '').trim().toLowerCase();
    buyerTypeAsked = body?.buyerTypeAsked === true;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, message: 'Name, email and password are required.' },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'Password must be at least 6 characters.' },
      { status: 400 },
    );
  }

  const buyerType = buyerChoice === 'business' ? 'b2b' : 'b2c';

  // The BACKEND owns the account. Nothing about this registration — least of
  // all the password — is persisted by the storefront.
  try {
    await loomPost('/customer/registration/email', {
      tenant: { name, email, password, contactNumber: phone },
      buyerChoice: buyerChoice || (buyerType === 'b2b' ? 'business' : 'myself'),
      companyName,
      gstNumber,
    });
  } catch (e: unknown) {
    const msg = (e as { body?: { message?: string } })?.body?.message || 'Could not create the account.';
    const status = (e as { status?: number })?.status ?? 502;
    return NextResponse.json({ success: false, message: msg }, { status });
  }

  // Session comes from a real backend authentication, not a locally minted token.
  const result = await authenticateEmail(email, password);
  if (result.ok) {
    const store = await cookies();
    store.set(LOOM_JWT_COOKIE, result.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  return NextResponse.json({ success: true, message: 'Account created successfully.' });
}
