/**
 * payment-mode.ts — THE SINGLE PLACE THAT DECIDES WHAT WE SAY ABOUT MONEY.
 *
 * This module exists because the checkout page used to make two contradictory
 * claims on the SAME screen: the top banner said the payment had been "taken
 * through the Razorpay test gateway" while the confirmation box, whose sentence
 * was hardcoded, said "This is a sandbox payment provider ... no card was
 * charged". Both cannot be true of one order.
 *
 * THE RULE, encoded here rather than left to whoever edits the JSX next:
 *   a claim about whether money moved is only ever derived from a PROVIDER NAME
 *   THE SERVER GAVE US -- before the order, `GET /api/checkout/payment-mode`
 *   (the same getPaymentProvider() routing order creation uses); after the
 *   order, `paymentProvider` off the order_checkout sidecar, recorded when the
 *   order was created. Never from the currency, never from an env guess, never
 *   from a default value in a useState.
 *
 * And when the provider is NOT known, both functions say so and claim NOTHING.
 * A missing provider must read as "we do not know", never as "sandbox".
 */

export type ProviderName = 'sandbox' | 'razorpay' | 'stripe' | '';

/** Display name of a gateway. Unknown stays unknown. */
export function providerLabel(provider: string | undefined | null): string {
  if (provider === 'razorpay') return 'Razorpay';
  if (provider === 'stripe') return 'Stripe';
  if (provider === 'sandbox') return 'the offline sandbox provider';
  return '';
}

/**
 * The banner shown BEFORE the money is taken. `provider` is what the server
 * says will handle this currency; '' means we have not heard back yet.
 */
export function paymentModeBanner(provider: string | undefined | null): string {
  if (provider === 'sandbox') {
    return 'Sandbox checkout — the order is really placed and stored, and the payment is settled by an offline mock. No card is presented to any gateway and nothing is charged.';
  }
  if (provider === 'razorpay' || provider === 'stripe') {
    return 'Test-mode checkout — the order is real and the payment is taken by the real ' +
      providerLabel(provider) + ' TEST gateway. A test card is presented to it; no real money moves.';
  }
  // UNKNOWN. Say what is certainly true and claim nothing about charging.
  return 'Test environment — the order you place here is really stored. Checking which payment gateway will handle it…';
}

/**
 * The line on the CONFIRMATION screen. `provider` must be the value recorded on
 * the order (order_checkout.payment_provider), returned by the payment-callback
 * response — i.e. the gateway that ACTUALLY handled this order, not the one the
 * page happened to be configured for when it rendered.
 */
export function paymentModeConfirm(provider: string | undefined | null): string {
  if (provider === 'sandbox') {
    return 'Settled by the offline sandbox provider: the order and the payment record are really stored, but no card was presented to any gateway and nothing was charged.';
  }
  if (provider === 'razorpay' || provider === 'stripe') {
    return 'Paid through the real ' + providerLabel(provider) +
      ' TEST gateway — a test card was presented and the payment was verified server-side with ' +
      providerLabel(provider) + ' before this order was marked paid. No real money moved.';
  }
  // We did not learn which gateway settled it, so we say nothing about it. This
  // branch is the whole point of the module: silence beats a confident guess.
  return 'Your order and its payment record are stored. We could not read back which gateway settled it, so nothing is claimed here about how the payment was taken.';
}
