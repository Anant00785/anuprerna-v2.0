import { NextResponse } from 'next/server';
import { loomPost } from '@/lib/loom/client';

// POST { name, email, password, buyerChoice? }
//
// THE PASSWORD REGISTRATION LANE. It creates a real account in the SANDBOX
// wrapper (LOOM_BASE_URL is pinned to 127.0.0.1:8090 for every storefront
// process and harness run) and nothing else: the wrapper writes only its own
// native tables, never live Loom, and the verification email is COMPOSED AND
// RECORDED in outbound_email with delivered=false because EMAIL_DELIVERY_ENABLED
// is unset. No real inbox is touched.
//
// This used to be a hard stub that created nothing, which made the password lane
// untestable end to end and left the buyer-type declaration below unreachable on
// this route. The wrapper endpoint it calls is already on the client's POST
// allowlist ('/customer/registration/email').
//
// ── THE DECLARATION ────────────────────────────────────────────────────────
// buyerChoice carries the answer to "Who do you buy for?" — 'myself' |
// 'business' | 'skip' — asked once, inside the registration form, because that
// is the moment this lane creates the account. OMITTING it is meaningful and
// supported: the wrapper records provenance 'default' (never asked) rather than
// silently recording retail, so the question is still owed and will be asked
// elsewhere. Registration NEVER adopts guest orders (mailbox proof does) — that
// boundary is untouched by this change.
export async function POST(req: Request) {
  let name = '';
  let email = '';
  let password = '';
  let buyerChoice = '';
  // The optional sourcing hint, and whether the screen actually PUT the business
  // opt-in in front of the buyer. The second matters even when they said nothing:
  // signup no longer offers a retail option, so "did not tick it" has to leave the
  // account undeclared AND not be asked again, and only the asked-stamp can say both.
  let sourcing = '';
  let buyerTypeAsked = false;
  try {
    const body = await req.json();
    // ONE name, collapsed to single spaces. There is one column behind this.
    name = String(body?.name ?? '').trim().replace(/\s+/g, ' ');
    email = String(body?.email ?? '').trim();
    password = String(body?.password ?? '');
    buyerChoice = String(body?.buyerChoice ?? '').trim().toLowerCase();
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
  const choice =
    buyerChoice === 'myself' || buyerChoice === 'business' || buyerChoice === 'skip'
      ? buyerChoice
      : undefined;
  // Anything unrecognised is dropped rather than forwarded, so a malformed
  // client can never widen what this writes.
  const src =
    sourcing === 'fabric' || sourcing === 'finished' || sourcing === 'both' ? sourcing : undefined;

  try {
    // Loom's Customer request body shape: everything under `tenant`.
    const result = await loomPost<{ success?: boolean; message?: string }>(
      '/customer/registration/email',
      {
        tenant: { name, email, password },
        ...(choice ? { buyerChoice: choice } : {}),
        ...(src ? { sourcing: src } : {}),
        ...(buyerTypeAsked ? { buyerTypeAsked: true } : {}),
      },
    );
    if (result?.success) {
      return NextResponse.json({ success: true, message: result.message ?? '' });
    }
    return NextResponse.json(
      { success: false, message: result?.message || 'Registration failed. Please try again.' },
      { status: 200 },
    );
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { success: false, message: e?.message || 'Registration failed. Please try again.' },
      { status: e?.status && e.status < 500 ? e.status : 502 },
    );
  }
}
