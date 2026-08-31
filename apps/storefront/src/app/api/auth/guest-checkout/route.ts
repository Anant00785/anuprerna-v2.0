import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  GUEST_CHECKOUT_COOKIE, GUEST_CHECKOUT_MAX_AGE, EMAIL_RE, encodeGuest, decodeGuest,
} from '@/lib/checkout-session';

// =====================================================================================
// POST /api/auth/guest-checkout — START A GUEST CHECKOUT (the Shopify pattern).
//
// WHAT CHANGED (2026-08-16, real-checkout lane). This route used to SILENTLY
// REGISTER A REAL ACCOUNT: it generated a 24-char random password the buyer could
// never know, called /customer/registration/email, logged the new account in, and
// hardcoded ap_buyer_mode=b2c. A buyer who only wanted to check out walked away
// with credentials they never asked for and could not use.
//
// NOW: NO account is created and NO password is generated. We record the buyer's
// email + name in a short-lived httpOnly cookie and let them proceed. The order
// itself attaches to an email-keyed GUEST CUSTOMER RECORD minted by the backend
// (relational.guest_customer) that has NO credential row and therefore cannot be
// logged into. After the purchase the buyer receives an unguessable order-status
// link, and an OPTIONAL "create an account" invite — never a forced one.
//
// ap_buyer_mode is NOT touched any more: the buyer did not log in, so their
// storefront mode (and the buyer-mode homepage ordering that reads it) is left
// exactly as they had it.
//
// ── WHAT CHANGED AGAIN (2026-08-16, the existing-email dead end) ────────────────
// THE EXISTENCE PROBE IS GONE. This route used to call /check-email/tenant and
// answer 409 { exists: true } when the address already had an account. Two things
// were wrong with that, and they compounded:
//
//   1. IT WAS AN ENUMERATION ORACLE. An unauthenticated caller could POST any
//      address here and read "does Anuprerna have an account for this person?"
//      straight off the status code. Nothing else on the sign-in surface leaks
//      that — /auth/email-code/request goes to deliberate lengths not to — so
//      this one route undid the whole property.
//   2. IT BLOCKED REAL BUYERS FROM BUYING. 42 passwordless accounts (created by
//      this system's own code sign-in lane) and 165 live-migrated-only addresses
//      have an account row and NO usable password. "Sign in to continue" sent
//      them to a password box that can never be satisfied — a door with no
//      handle, and no way to buy at all.
//
// The rule now is DO NOT BLOCK AND DO NOT REVEAL: every syntactically valid
// address gets the same 200 and the same cookie, whatever we do or do not know
// about it. Sign-in is offered beside the form as a permanent, identical
// suggestion, never as a refusal, so the response carries no signal either way.
//
// This is safe ONLY because guest orders are no longer handed to whoever
// registers the address first: adoption now requires PROOF OF THE MAILBOX
// (backend RegistrationService.adoptForProvenMailbox / EmailCodeService.verifyCode).
// The order stays on the guest_customer row until then.
//
// GET returns the current guest identity (if any) so a page reload keeps the
// checkout going.
// =====================================================================================

export async function GET() {
  const raw = (await cookies()).get(GUEST_CHECKOUT_COOKIE)?.value;
  const guest = decodeGuest(raw);
  return NextResponse.json(guest ? { guest, active: true } : { active: false });
}

export async function POST(req: Request) {
  let email = '';
  let name = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim();
    name = String(body?.name ?? '').trim();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  // The ONLY refusals left are properties of the REQUEST — a malformed address is
  // not an email for anybody, and a missing name is a missing field. Neither says
  // anything about our customer table.
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, message: 'A valid email is required.' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ success: false, message: 'Your name is required.' }, { status: 400 });
  }

  const res = NextResponse.json({ success: true, guest: { email, name }, created: false });
  res.cookies.set(GUEST_CHECKOUT_COOKIE, encodeGuest({ email, name }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_CHECKOUT_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(GUEST_CHECKOUT_COOKIE, '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
  });
  return res;
}
