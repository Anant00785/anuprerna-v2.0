import { redirect } from 'next/navigation';

// /cart — the cart itself is a header drawer; the full cart lives at /checkout.
// This route existed as a 404. Redirect it to the real cart/checkout surface so
// the URL works and is shareable.
export default function CartPage() {
  redirect('/checkout');
}
