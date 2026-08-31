'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import LoginModal from '@/components/auth/LoginModal';
import * as guestCart from '@/lib/guest-cart';
import type { GuestCartItem } from '@/lib/guest-cart';
import CartItemCard from './CartItemCard';
import OrderSummary from './OrderSummary';
import type { CartItem } from './types';

// =====================================================================================
// GUEST CART VIEW / GUEST CHECKOUT — the /checkout experience for NOT-logged-in
// visitors. Sources lines from the client-side guest cart (lib/guest-cart) and mirrors
// the logged-in cart layout (CartItemCard + OrderSummary).
//
// WHAT CHANGED (2026-08-16, real-checkout lane): submitting the email popup used to
// SILENTLY CREATE A REAL ACCOUNT — register with a random 24-char password the buyer
// could never know, log it in, migrate the cart, then hand off to the logged-in
// checkout. The buyer left with credentials they never asked for.
//
// NOW (the Shopify pattern): the popup only IDENTIFIES the buyer. POST
// /api/auth/guest-checkout records { email, name } in a short-lived httpOnly cookie
// and creates NOTHING. onGuestReady() then flips the parent CheckoutShell into its
// GUEST mode, which runs the same steps (shipping -> payment -> confirm) against the
// localStorage cart and an inline address form. The order attaches to an email-keyed
// guest customer record that cannot be logged into, and the buyer gets an unguessable
// order-status link plus an OPTIONAL post-purchase account invite.
//
// ── WHAT CHANGED AGAIN (2026-08-16): THE RETURNING BUYER IS NEVER REFUSED ───────────
// This view used to read a 409 { exists: true } off /api/auth/guest-checkout and turn
// the email popup into a "sign in to continue" wall. That wall could not be climbed by
// the two populations most likely to hit it — the 42 PASSWORDLESS accounts this system's
// own code lane creates, and the 165 live-migrated-only addresses — because the modal
// behind it offered a password box neither can satisfy. It also meant the popup's
// behaviour ANSWERED "does this address have an account?" for anyone who cared to type
// one in.
//
// Now the popup behaves identically for every address: no probe, no branch, no refusal.
// Sign-in sits beside the form as a PERMANENT suggestion ("Already have an account?"),
// shown to everybody whatever we know, and the modal it opens can now sign a
// passwordless buyer in with an emailed code without leaving checkout (LoginModal ->
// CodeSignIn). The guest order attaches to the guest_customer record and is claimed
// later by the adoption path, which requires PROOF OF THE MAILBOX.
// =====================================================================================

// Map a stored guest line to the CartItem shape CartItemCard / OrderSummary render.
function toCartItem(g: GuestCartItem, i: number): CartItem {
  return {
    id: i,
    quantity: g.quantity,
    unit: g.unit,
    makingCharge: g.makingCharge,
    orderType: g.orderType,
    productGroup: g.productGroup,
    fabricProductPreview: {
      product: {
        name: g.name,
        slug: g.slug,
        heroImage: g.image,
        price: g.price,
        productGroup: g.productGroup,
      },
    },
  };
}

interface Props {
  /** Called once the guest has identified themselves — the parent CheckoutShell
   *  then renders the guest checkout steps. No account exists at this point. */
  onGuestReady: (guest: { email: string; name: string }) => void;
}

export default function GuestCartView({ onGuestReady }: Props) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Email-capture popup state (the ONLY thing the guest fills before handoff).
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Hydrate from localStorage AFTER mount (SSR-safe) and stay in sync with adds/removes.
  useEffect(() => {
    const sync = () => setItems(guestCart.list());
    sync();
    setReady(true);
    return guestCart.subscribe(sync);
  }, []);

  // Auto-open the email popup ONCE when a guest lands on /checkout with items in the
  // cart (Amit: "start the pop-up once on the checkout page"). Guarded by a ref so a
  // dismiss does NOT re-nag; 'Continue To Checkout' can still reopen it manually.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!ready || autoOpenedRef.current || items.length === 0) return;
    autoOpenedRef.current = true;
    setError('');
    setEmailOpen(true);
  }, [ready, items.length]);

  const cartItems = items.map(toCartItem);
  const qtyMap = Object.fromEntries(items.map((g, i) => [i, g.quantity]));

  function openEmailPrompt() {
    setError('');
    setEmailOpen(true);
  }

  async function submitGuest() {
    setError('');
    if (!email.trim() || !name.trim()) {
      setError('Please enter your email and name.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/guest-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      // NO existing-account branch. Whether this address already has an account is
      // not asked and not answered — the route behaves identically either way, and
      // a returning buyer is offered sign-in below as a suggestion, never a wall.
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Could not start checkout. Please try again.');
        setBusy(false);
        return;
      }

      // Identified as a GUEST. NOTHING was created: no account, no password, no
      // login. Hand off to the parent, which renders the guest checkout steps
      // against this same localStorage cart.
      onGuestReady({ email: email.trim(), name: name.trim() });
      // This component unmounts on the swap — leave busy=true through it.
    } catch {
      setError('Could not start checkout. Please try again.');
      setBusy(false);
    }
  }

  const BackLink = (
    <Link href='/products/fabric' className='inline-flex items-center gap-1 text-sm font-medium text-clay'>
      <span className='material-symbols-outlined text-[18px]'>chevron_left</span>
      Back To Shopping
    </Link>
  );

  // Avoid a hydration flash: render nothing meaningful until localStorage is read.
  if (!ready) {
    return (
      <main className='min-h-[70vh] bg-white'>
        <div className='mx-auto max-w-screen-xl px-5 py-10'>
          <div className='flex h-64 items-center justify-center text-clay/50'>
            <span className='material-symbols-outlined animate-spin text-3xl'>progress_activity</span>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className='min-h-[70vh] bg-white'>
        <div className='mx-auto max-w-screen-xl px-5 py-16 text-center'>
          <p className='text-clay/70'>Your cart is empty.</p>
          <Link href='/products/fabric' className='mt-4 inline-block rounded-md bg-clay/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-clay'>
            Browse fabric
          </Link>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------------
  // CART (guest cart review) — clicking 'Continue To Checkout' opens the email popup.
  // -------------------------------------------------------------------------------
  const Banner = (
    <div className='mb-6 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900'>
      <span className='material-symbols-outlined'>info</span>
      <span className='font-medium'>Your cart is saved on this device. Continue to checkout as a guest — no account needed.</span>
    </div>
  );

  return (
    <main className='min-h-[70vh] bg-white'>
      <div className='mx-auto max-w-screen-xl px-5 py-8'>
        {Banner}
        <div className='mb-4'>{BackLink}</div>
        <h1 className='mb-6 text-xl font-semibold uppercase tracking-[.08em] text-clay'>Your Cart</h1>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* ITEMS */}
          <div className='space-y-6 lg:col-span-2'>
            {items.map((g, i) => (
              <CartItemCard
                key={g.key}
                item={cartItems[i]}
                qty={g.quantity}
                onQtyChange={(q) => guestCart.updateQty(g.key, q)}
                onRemove={() => guestCart.removeItem(g.key)}
              />
            ))}
          </div>

          {/* SUMMARY */}
          <aside className='order-first lg:order-none lg:col-span-1'>
            <div className='rounded-xl border border-clay/15 bg-[#f6f2ea] p-5 lg:sticky lg:top-24'>
              <OrderSummary
                items={cartItems}
                shipment={null}
                discounts={[]}
                qtyMap={qtyMap}
                ctaLabel='Continue To Checkout'
                onCta={openEmailPrompt}
              />
              <p className='mt-3 text-center text-xs text-clayd/70'>
                Already have an account?{' '}
                <button type='button' onClick={() => setLoginOpen(true)} className='font-semibold text-clay underline underline-offset-2'>
                  Sign in
                </button>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* EMAIL CAPTURE POPUP — email + name only. Addresses come from the existing
          logged-in checkout after handoff. */}
      {emailOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => { if (!busy) setEmailOpen(false); }}
            aria-hidden
          />
          <div className='relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 sm:p-8'>
            <button
              aria-label='Close'
              onClick={() => { if (!busy) setEmailOpen(false); }}
              className='absolute right-4 top-4 text-black/50 hover:text-black'
            >
              <span className='material-symbols-outlined'>close</span>
            </button>

            <h2 className='mb-1 text-2xl font-medium text-clay'>Enter your email</h2>
            <p className='mb-6 text-sm text-black/60'>
              Checkout as a guest — nothing to create. We use your email for the order
              confirmation and to give you a private link to track it.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); submitGuest(); }} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-black/70'>Email *</label>
                <input
                  type='email'
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
                  placeholder='you@example.com'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm text-black/70'>Full name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full rounded-lg border border-bark/40 px-3 py-2 outline-none focus:border-clay'
                  placeholder='Your name'
                />
              </div>

              {error && (
                <div className='rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                  <p>{error}</p>
                </div>
              )}

              <button
                type='submit'
                disabled={busy}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-clay px-4 py-2.5 font-medium text-white transition hover:bg-clayd disabled:opacity-60'
              >
                {busy ? 'Setting up your checkout…' : 'Continue To Checkout'}
              </button>
            </form>

            {/* A PERMANENT suggestion, rendered for every buyer before anything is
                typed. It is deliberately not conditional on anything we know about
                the address — that is what keeps the popup from answering "does this
                address have an account?" — and it is deliberately not a blocker. */}
            <p className='mt-5 text-center text-xs text-black/50'>
              Already have an account?{' '}
              <button
                type='button'
                data-testid='guest-popup-signin'
                onClick={() => { setEmailOpen(false); setLoginOpen(true); }}
                className='font-semibold text-clay underline underline-offset-2'
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} defaultEmail={email} />
    </main>
  );
}
