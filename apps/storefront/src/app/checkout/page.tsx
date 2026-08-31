import CheckoutShell from '@/components/checkout/CheckoutShell';

// Checkout — multi-step UI running the REAL checkout sequence: the terminal action
// creates a persisted order, opens a payment session through the backend's
// PaymentProvider seam, and confirms it. The default provider is the SANDBOX one
// (deterministic, no SDK, no key, no network egress), so the order and the payment
// record are real while the card network is simulated. Reachable logged out — a
// guest checks out without an account ever being created.
export const metadata = { title: 'Checkout — Anuprerna' };

export default function Page() {
  return <CheckoutShell />;
}
