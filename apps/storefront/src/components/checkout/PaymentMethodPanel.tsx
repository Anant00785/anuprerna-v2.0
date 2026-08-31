'use client';

// =====================================================================================
// PaymentMethodPanel — the PAYMENT step of a real checkout.
//
// WHAT CHANGED (2026-08-16, real-checkout lane). This panel used to be a static
// picture: Razorpay/Stripe logos, the caption "no session is started in TEST
// MODE", and a button labelled "Submit Enquiry" that only flipped local state.
//
// It now drives the real sequence. Clicking Pay runs, in order:
//   POST /api/checkout/order            create the order (status PENDING)
//   POST /api/checkout/payment-session  open a payment session via the provider
//   POST /api/checkout/sandbox-gateway  the MOCKED third party signs a callback
//   POST /api/checkout/payment-callback verify -> order PAID -> confirmation
//
// The provider shown is whatever the backend's PaymentProvider seam reports
// (`provider` prop, from the session response) — this panel never picks a
// gateway, it only describes the one the server chose:
//   'sandbox'  no third-party script, no egress; the sequence, the handles and
//              the signature check are still the real ones.
//   'razorpay' REAL Razorpay test mode (INR). Payment happens in Razorpay's own
//              modal, opened over this page.
//   'stripe'   REAL Stripe test mode (non-INR). Payment happens on Stripe's own
//              hosted page; the buyer is redirected there and back.
// In every case NO CARD FIELD EXISTS IN THIS APPLICATION, and the order is only
// marked paid after a server-side check against the gateway.
// =====================================================================================

interface Props {
  isINR: boolean;
  /** Amount to be collected now, already formatted for display. */
  amountLabel: string;
  /** Payment provider in force, as reported by the SERVER (payment-mode before
   *  the order, the order's recorded provider after it). '' = not yet known —
   *  render that as unknown, never as a default. */
  provider: string;
  busy: boolean;
  busyLabel: string;
  error: string;
  onPay: () => void;
}

export default function PaymentMethodPanel({ isINR, amountLabel, provider, busy, busyLabel, error, onPay }: Props) {
  const sandbox = provider === 'sandbox';
  const known = provider === 'sandbox' || provider === 'razorpay' || provider === 'stripe';
  // NAMED FROM THE PROVIDER, not inferred from the currency. `isINR` still picks
  // the payment-method list (a display nicety), but the gateway NAME — the thing
  // a buyer reads as a promise about who takes their card — comes from the
  // server's answer only.
  const gatewayName =
    provider === 'razorpay' ? 'Razorpay'
    : provider === 'stripe' ? 'Stripe'
    : 'Checking payment provider…';
  const gatewayMethods = isINR ? 'UPI | Card | Wallet | Net Banking' : 'MASTERCARD | VISA | AMEX';
  // How the buyer will actually be asked for payment, so the Pay button is not
  // a surprise. Razorpay opens over the page; Stripe navigates away and back.
  const handoff =
    provider === 'razorpay' ? 'Razorpay will open a secure window over this page to take your payment.'
    : provider === 'stripe' ? 'You will be taken to Stripe\u2019s secure payment page, then brought straight back here.'
    : '';

  return (
    <div className='space-y-5'>
      <h2 className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>Payment Method</h2>

      <div className='rounded-xl border border-clay/15 bg-[#f6f2ea] p-5'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-md border border-clay/15 bg-white'>
            <span className='text-[10px] font-bold leading-none text-blue-700'>{isINR ? 'RP' : 'ST'}</span>
          </div>
          <div>
            <p className='text-sm font-semibold text-clay' data-testid='gateway-name'>
              {sandbox ? 'Sandbox payment provider (offline mock)' : gatewayName}
            </p>
            <p className='text-xs text-clayd/70'>{gatewayMethods}</p>
          </div>
        </div>
        {sandbox && (
          <p className='mt-3 text-xs italic text-clayd/70'>
            Sandbox gateway: the order, the payment session, the signed callback and the paid
            order are all real and persisted — only the card network is simulated. No card is
            charged and no money moves.
          </p>
        )}
        {known && !sandbox && handoff && (
          <p className='mt-3 text-xs text-clayd/70' data-testid='gateway-handoff'>{handoff}</p>
        )}
      </div>

      {/* G7 — 4 policy links (Privacy / Return / T&C / International Orders) */}
      <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-clayd/60'>
        <a href='/content/policies/privacy-policy/173823' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Privacy Policy</a>
        <a href='/return-policy' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Return Policy</a>
        <a href='/content/policies/terms-conditions/174271' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Terms &amp; Conditions</a>
        <a href='/international-orders' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>International Orders</a>
      </div>

      {error && (
        <p role='alert' className='rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800'>
          {error}
        </p>
      )}

      <button
        type='button'
        onClick={onPay}
        disabled={busy}
        data-testid='pay-now'
        className='flex w-full items-center justify-center gap-2 rounded-md bg-clay/80 px-4 py-3.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay disabled:opacity-60'
      >
        {busy ? busyLabel : 'Pay ' + amountLabel}
        {!busy && <span className='material-symbols-outlined text-[18px]'>lock</span>}
      </button>

      <p className='flex items-center justify-center gap-1.5 text-center text-xs text-clayd/60'>
        <span className='material-symbols-outlined text-[15px]'>lock</span>
        Your details are handled securely.
      </p>
    </div>
  );
}
