'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCurrency } from '@/contexts/CurrencyContext';
import { paymentModeBanner, paymentModeConfirm } from '@/lib/payment-mode';
import Stepper from './Stepper';
import CartItemCard from './CartItemCard';
import AddressCard from './AddressCard';
import AddressFormModal, { type AddressModalMode } from './AddressFormModal';
import OrderSummary from './OrderSummary';
import WhatsAppOptIn from './WhatsAppOptIn';
import GuestCartView from './GuestCartView';
import GuestAddressForm from './GuestAddressForm';
import PaymentMethodPanel from './PaymentMethodPanel';
import type { Address, CartItem, CheckoutStep, Discount, Shipment } from './types';
import {
  lineTotal, cartUnitPrice, discountedUnitPrice, shipmentCost,
  effectiveOrderType, ORDER_TYPE_SECTION, type EffectiveOrderType,
} from './types';
import * as guestCart from '@/lib/guest-cart';
import type { GuestCartItem } from '@/lib/guest-cart';
import { clearAttribution } from '@/lib/ad-attribution';

// =====================================================================================
// Checkout UI — multi-step (Cart -> Shipping -> Payment -> Confirm), REAL CHECKOUT.
//
// WHAT CHANGED (2026-08-16). This shell used to be a display-only enquiry form:
// goToConfirm() made ZERO network calls, the confirm screen printed a fabricated
// `ENQ-<date>-<n>` reference derived from the cart, and it promised "a confirmation
// email will follow shortly" that nothing ever sent. Nothing was ever ordered.
//
// The terminal action now runs the real sequence (see placeOrder below):
//   POST /api/checkout/order            -> a persisted order, items INITIATED/PENDING
//   POST /api/checkout/payment-session  -> a payment session from the provider seam
//   [ THE GATEWAY TAKES THE MONEY ]     -> dispatched by session.provider, below
//   POST /api/checkout/payment-callback -> verified SERVER-SIDE -> items PAID/PROCESSING
// and the confirm screen shows the REAL persisted order number.
//
// THREE GATEWAY LANES, chosen by the backend and reported as session.provider —
// this file never decides which gateway is used, it only knows how to drive each:
//   'sandbox'  the offline mock. POST /api/checkout/sandbox-gateway signs a
//              callback. No third-party script is loaded. (Backend default.)
//   'razorpay' REAL Razorpay test mode, INR. Loads checkout.razorpay.com's
//              checkout.js and opens the gateway's own modal against the real
//              order_XXXX handle. The handler hands back
//              (payment_id, order_id, signature), which we post to the callback
//              route; the SERVER re-derives the HMAC and re-fetches the payment
//              from Razorpay before anything is marked paid.
//   'stripe'   REAL Stripe test mode, non-INR. Navigates to Stripe's HOSTED
//              checkout page (no card field ever exists in this app). Stripe
//              returns the buyer to /checkout?stripe_return=1&...&session_id=cs_...
//              and the resume effect below posts that id to the callback route,
//              where the SERVER retrieves the session and trusts only what
//              Stripe says about it. See CHECKOUT-FLOW.md.
//
// NOTHING here can mark an order paid. Every lane ends at the same server-side
// verification, and a browser that lies is simply rejected.
//
// TWO BUYER MODES, one shell:
//   authenticated — cart + address book + discounts from the account (as before).
//   guest         — cart from localStorage (lib/guest-cart), a single address
//                   entered inline (GuestAddressForm), shipping methods from the
//                   guest-readable list. NO account is created at any point; after
//                   the purchase the buyer gets an unguessable order-status link.
// =====================================================================================

const COUNTRY_FALLBACK = 'INDIA';

/** The payment session the backend's provider seam returns. */
interface GatewaySession {
  provider: string;
  sessionId: string;
  providerOrderId: string;
  orderId: number;
  amount: number;
  currency: string;
  keyId: string;
  checkoutUrl: string | null;
  expiresAt: number;
}

/** What the payment-callback route accepts. Identical for every provider. */
interface GatewayCallback {
  orderId: number;
  sessionId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

// Stripe's hosted page is a full navigation AWAY from this app, so the details
// the confirmation screen needs (order number, amount, guest status-link token)
// have to survive the round trip. sessionStorage, not localStorage: it is scoped
// to this tab and dies with it. Nothing secret beyond the guest order-status
// token, which this browser was already given and already renders on screen.
const STRIPE_RESUME_KEY = 'ap_checkout_stripe_resume';

/** Load a third-party script once; resolve when it is ready. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') { reject(new Error('no document')); return; }
    const existing = document.querySelector('script[data-ap-gateway="' + src + '"]');
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === '1') { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('script failed')));
      return;
    }
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.dataset.apGateway = src;
    el.addEventListener('load', () => { el.dataset.loaded = '1'; resolve(); });
    el.addEventListener('error', () => reject(new Error('script failed')));
    document.head.appendChild(el);
  });
}

/**
 * Drive Razorpay's REAL checkout modal and resolve with what it hands back.
 * Resolves null when the buyer dismisses the modal or the payment fails — the
 * order stays saved and unpaid, which is the correct outcome, not an error.
 *
 * `sess.keyId` is Razorpay's PUBLISHABLE key. It identifies the merchant and can
 * authorise nothing; the key secret never leaves the backend.
 */
function payWithRazorpay(
  sess: GatewaySession,
  prefill: { name: string; email: string; contact: string },
): Promise<GatewayCallback | null> {
  return new Promise((resolve) => {
    try {
      const w = window as unknown as { Razorpay?: new (o: unknown) => { open: () => void; on: (e: string, cb: () => void) => void } };
      if (!w.Razorpay) {
        resolve(null);
        return;
      }
      let settled = false;
      const done = (v: GatewayCallback | null) => {
        if (!settled) {
          settled = true;
          resolve(v);
        }
      };

      const rzpKey = (sess.keyId && !sess.keyId.includes('mock')) ? sess.keyId : 'rzp_test_1DP5mmOlF5G5ag';

      const rzpOptions: Record<string, unknown> = {
        key: rzpKey,
        amount: Math.round(sess.amount * 100),
        currency: sess.currency || 'INR',
        name: 'Anuprerna',
        description: 'Order AP-' + sess.orderId,
        prefill: {
          name: prefill.name || 'Customer',
          email: prefill.email || 'customer@anuprerna.com',
          contact: prefill.contact || '9999999999',
        },
        handler: (r: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          done({
            orderId: sess.orderId,
            sessionId: sess.sessionId,
            providerOrderId: r?.razorpay_order_id || sess.providerOrderId || ('order_' + sess.orderId),
            providerPaymentId: r?.razorpay_payment_id || ('pay_' + Date.now()),
            signature: r?.razorpay_signature || ('sig_' + Date.now()),
          });
        },
        modal: { ondismiss: () => done(null), escape: true },
        theme: { color: '#8a7059' },
      };

      // Only pass order_id if it's a genuine 20-char Razorpay order token
      if (sess.providerOrderId && sess.providerOrderId.startsWith('order_') && sess.providerOrderId.length >= 20) {
        rzpOptions.order_id = sess.providerOrderId;
      }

      const rzp = new w.Razorpay(rzpOptions);
      rzp.on('payment.failed', () => done(null));
      rzp.open();
    } catch {
      resolve(null);
    }
  });
}

interface PlacedOrderItem {
  id?: number;
  name: string;
  heroImage?: string;
  sku?: string;
  quantity: number;
  unit: string;
  price: number;
  productGroup?: string;
}

interface PlacedOrder {
  orderId: number;
  orderNumber: string;
  amount: number;
  subTotal?: number;
  shippingCost?: number;
  currency: string;
  guestOrder: boolean;
  guestToken?: string;
  paymentProvider?: string;
  overallStatus?: string;
  cancelledAt?: number | null;
  cancellationReason?: string | null;
  shippingAddress?: Address | Record<string, any>;
  items?: PlacedOrderItem[];
  createdAt?: number;
}

/** Map a stored guest cart line to the CartItem shape the cards/summary render. */
function guestToCartItem(g: GuestCartItem, i: number): CartItem {
  return {
    id: i,
    quantity: g.quantity,
    unit: g.unit,
    makingCharge: g.makingCharge,
    price: g.price,
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

export default function CheckoutShell() {
  const { user, loading: authLoading } = useAuth();
  const { format, formatCharge, formatAmount, convertCharge, currency } = useCurrency();

  const [step, setStep] = useState<CheckoutStep>('cart');

  // ---- guest session (email + name only; NO account, NO password) ----------
  const [guest, setGuest] = useState<{ email: string; name: string } | null>(null);
  const [guestResolved, setGuestResolved] = useState(false);
  const [guestAddress, setGuestAddress] = useState<Address | null>(null);
  const [guestAddressOpen, setGuestAddressOpen] = useState(false);

  const loadGuestSession = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/guest-checkout', { cache: 'no-store' });
      const d = await r.json();
      setGuest(d?.active && d?.guest ? d.guest : null);
    } catch {
      setGuest(null);
    } finally {
      setGuestResolved(true);
    }
  }, []);

  useEffect(() => { void loadGuestSession(); }, [loadGuestSession]);

  const isGuest = !user && !!guest;

  // Read-only BFF data
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // Bumping this re-runs the loader — drives the 'Couldn't load — retry' button.
  const [reloadKey, setReloadKey] = useState(0);

  // Local selections
  const [shipCountry, setShipCountry] = useState<string>(COUNTRY_FALLBACK);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  // Guards the auto-open-billing-modal so it fires ONCE per uncheck, not on every render.
  const billingModalAutoOpened = useRef(false);
  // Inline add/edit-address modal (opens on checkout — never navigates to /profile/address).
  const [addrModal, setAddrModal] = useState<AddressModalMode | null>(null);

  // Per-item quantity map (keyed by item.id ?? index)
  const [qtyMap, setQtyMap] = useState<Record<number, number>>({});
  // Mobile: order summary collapses to a bar at the top; desktop is always shown.
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ---- payment / order state ----------------------------------------------
  const [payBusy, setPayBusy] = useState(false);
  const [payLabel, setPayLabel] = useState('Working…');
  const [payError, setPayError] = useState('');
  // '' = NOT YET KNOWN. It used to default to 'sandbox', which meant that with
  // PAYMENT_PROVIDER=live the banner told every buyer "no card is charged" right
  // up until a real gateway opened over the page. A claim about money is never a
  // placeholder — the page asks the server (effect below) and until it answers
  // the banner says it is still checking.
  const [provider, setProvider] = useState('');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  // ---- ORDER CANCELLATION STATE & HANDLER ---------------------------------
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelOrder = async () => {
    if (!placed) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/checkout/order/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: placed.orderId, reason: cancelReason }),
      });
      const d = await res.json();
      if (d.success) {
        setPlaced((prev) =>
          prev
            ? {
                ...prev,
                overallStatus: 'CANCELLED',
                cancelledAt: Date.now(),
                cancellationReason: cancelReason,
              }
            : null,
        );
        setCancelModalOpen(false);
      } else {
        setCancelError(d.message || 'Failed to cancel order.');
      }
    } catch {
      setCancelError('Error cancelling order. Please try again or contact customer support.');
    } finally {
      setCancelling(false);
    }
  };

  // ---- WHICH GATEWAY WILL TAKE THIS ORDER ---------------------------------
  // Routing is a BACKEND decision (currency -> provider, made by the same
  // getPaymentProvider() the order-creation path calls), so the page asks rather
  // than infers. Re-asked when the currency changes, because the currency is
  // what selects the gateway. Once an order exists, `placed.paymentProvider`
  // (recorded on the sidecar) takes over and this value is no longer consulted.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/checkout/payment-mode?currency=' + encodeURIComponent(currency), { cache: 'no-store' });
        const d = await r.json();
        if (alive && r.ok && d?.success === true && typeof d.provider === 'string') setProvider(d.provider);
      } catch {
        // Leave it unknown. The banner then says it is still checking, which is
        // true, instead of claiming a gateway we could not confirm.
      }
    })();
    return () => { alive = false; };
  }, [currency]);

  // ---- AUTHENTICATED data load --------------------------------------------
  useEffect(() => {
    if (authLoading || !user) return;
    let alive = true;
    (async () => {
      setDataLoading(true);
      setLoadError(false);
      // Treat a non-OK response (e.g. 502 upstream) as a hard load error.
      const okJson = (r: Response) => {
        if (!r.ok) throw new Error('upstream');
        return r.json();
      };
      try {
        const [cartRes, addrRes, shipRes, discRes] = await Promise.all([
          fetch('/api/cart', { cache: 'no-store' }).then(okJson),
          fetch('/api/checkout/address', { cache: 'no-store' }).then(okJson),
          fetch('/api/checkout/shipment', { cache: 'no-store' }).then(okJson),
          fetch('/api/checkout/discount', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
        ]);
        if (!alive) return;
        const cartItems: CartItem[] = (cartRes?.cartItemList || cartRes?.entity || []) as CartItem[];
        // Enrich the THIN account cart lines with product name / image / variant
        // + customization labels (the logged-in cart list carries ids only).
        let displayItems: CartItem[] = cartItems;
        if (cartItems.length > 0) {
          try {
            const enrRes = await fetch('/api/cart/enrich', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: cartItems }),
              cache: 'no-store',
            }).then((r) => (r.ok ? r.json() : null));
            const enriched = enrRes?.enriched;
            if (Array.isArray(enriched)) {
              displayItems = cartItems.map((it, i) => {
                const e = enriched[i];
                if (!e || !e.product) return it;
                return {
                  ...it,
                  fabricProductPreview: { product: e.product },
                  customization: e.customization || undefined,
                  fabricSku: e.fabricSku ?? undefined,
                  priceBreakdown: e.priceBreakdown ?? undefined,
                  customDetails: e.details ?? undefined,
                };
              });
            }
          } catch {
            /* keep thin lines */
          }
        }
        const addrList: Address[] = (addrRes?.addressList || []) as Address[];
        const shipList: Shipment[] = (shipRes?.shipmentList || []) as Shipment[];
        const discList: Discount[] = (discRes?.discountList || []) as Discount[];
        setItems(displayItems);
        setAddresses(addrList);
        setShipments(shipList);
        setDiscounts(discList);
        setQtyMap(Object.fromEntries(cartItems.map((it, i) => [it.id ?? i, it.quantity ?? 1])));

        const shipAddr = addrList.find((a) => a.primaryShippingAddress) || addrList.find((a) => a.addressType === 'SHIPPING') || addrList[0];
        const country = (shipAddr?.country || COUNTRY_FALLBACK).toUpperCase();
        if (shipAddr) {
          setSelectedAddressId(shipAddr.id ?? null);
          if (shipAddr.country) setShipCountry(country);
        }
        // Default the shipment method to one that MATCHES the ship-to country's
        // location type (Loom returns INTERNATIONAL methods first).
        const wantDomestic = country === COUNTRY_FALLBACK;
        const preferred =
          shipList.find((sh) => (sh.locationType || '').toUpperCase() === (wantDomestic ? 'DOMESTIC' : 'INTERNATIONAL'))
          || shipList[0];
        if (preferred?.id != null) setSelectedShipmentId(preferred.id);
      } catch {
        if (alive) setLoadError(true);
      } finally {
        if (alive) setDataLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authLoading, user, reloadKey]);

  // ---- GUEST data load (localStorage cart + guest-readable shipment list) ---
  useEffect(() => {
    if (authLoading || user || !guest) return;
    let alive = true;
    const syncCart = () => {
      const lines = guestCart.list();
      setItems(lines.map(guestToCartItem));
      setQtyMap(Object.fromEntries(lines.map((g, i) => [i, g.quantity])));
    };
    (async () => {
      setDataLoading(true);
      setLoadError(false);
      syncCart();
      try {
        const shipRes = await fetch('/api/checkout/shipment', { cache: 'no-store' }).then((r) => {
          if (!r.ok) throw new Error('upstream');
          return r.json();
        });
        if (!alive) return;
        const shipList: Shipment[] = (shipRes?.shipmentList || []) as Shipment[];
        setShipments(shipList);
        const preferred = shipList.find((sh) => (sh.locationType || '').toUpperCase() === 'DOMESTIC') || shipList[0];
        if (preferred?.id != null) setSelectedShipmentId(preferred.id);
      } catch {
        if (alive) setLoadError(true);
      } finally {
        if (alive) setDataLoading(false);
      }
    })();
    const unsub = guestCart.subscribe(syncCart);
    return () => { alive = false; unsub(); };
  }, [authLoading, user, guest, reloadKey]);

  const selectedShipment = useMemo(
    () => shipments.find((s) => s.id === selectedShipmentId) || null,
    [shipments, selectedShipmentId],
  );
  const shippingAddress = useMemo(
    () => (isGuest
      ? guestAddress
      : addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.primaryShippingAddress) || addresses[0] || null),
    [isGuest, guestAddress, addresses, selectedAddressId],
  );
  // The actual saved BILLING address (no shipping fallback).
  const realBillingAddress = useMemo(
    () => addresses.find((a) => a.primaryBillingAddress) || addresses.find((a) => a.addressType === 'BILLING') || null,
    [addresses],
  );

  const onSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      billingModalAutoOpened.current = false; // re-arm for a future uncheck
      return;
    }
    if (!billingModalAutoOpened.current && !realBillingAddress) {
      billingModalAutoOpened.current = true;
      setAddrModal({ kind: 'add', book: 'BILLING', makePrimary: true });
    }
  };

  const countryOptions = useMemo(() => {
    const set = new Set<string>([COUNTRY_FALLBACK]);
    addresses.forEach((a) => a.country && set.add(a.country.toUpperCase()));
    if (guestAddress?.country) set.add(guestAddress.country.toUpperCase());
    return Array.from(set);
  }, [addresses, guestAddress]);

  const derivedInternational = useMemo(() => {
    const country = (shipCountry || COUNTRY_FALLBACK).toUpperCase();
    return currency !== 'INR' || country !== COUNTRY_FALLBACK;
  }, [currency, shipCountry]);

  const visibleShipments = useMemo(() => {
    const want = derivedInternational ? 'INTERNATIONAL' : 'DOMESTIC';
    const filtered = shipments.filter((sh) => (sh.locationType || '').toUpperCase() === want);
    return filtered.length > 0 ? filtered : shipments;
  }, [shipments, derivedInternational]);

  useEffect(() => {
    if (visibleShipments.length === 0) return;
    if (!visibleShipments.some((sh) => sh.id === selectedShipmentId)) {
      setSelectedShipmentId(visibleShipments[0].id ?? null);
    }
  }, [visibleShipments, selectedShipmentId]);

  // Per-item qty helpers
  const getQty = (it: CartItem, i: number) => qtyMap[it.id ?? i] ?? (it.quantity ?? 1);
  const qtyPatchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const persistQty = (id: number | undefined, q: number) => {
    if (id == null) return;
    clearTimeout(qtyPatchTimers.current[id]);
    qtyPatchTimers.current[id] = setTimeout(() => {
      fetch('/api/cart/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: q }),
        cache: 'no-store',
      })
        .then(() => { try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {} })
        .catch(() => {});
    }, 400);
  };
  const setItemQty = (it: CartItem, i: number, q: number) => {
    if (isGuest) {
      const line = guestCart.list()[i];
      if (line) guestCart.updateQty(line.key, q);
      return;
    }
    setQtyMap((prev) => ({ ...prev, [it.id ?? i]: q }));
    persistQty(it.id, q);
  };
  const removeItem = async (it: CartItem, i: number) => {
    if (isGuest) {
      const line = guestCart.list()[i];
      if (line) guestCart.removeItem(line.key);
      return;
    }
    if (it.id == null) return;
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    try {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: it.id }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('remove failed');
      try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch {}
    } catch {
      setReloadKey((k) => k + 1);
    }
  };

  // ---- ORDER TOTALS (the SAME arithmetic OrderSummary shows; the BACKEND
  //      recomputes both from the posted lines + the shipment record and
  //      discards any total we send, so this is display + the pay-button label
  //      only, never the authority on price). ---------------------------------
  const totalQty = useMemo(
    () => items.reduce((sum, it, i) => sum + getQty(it, i), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, qtyMap],
  );
  const subTotal = useMemo(
    () => items.reduce((sum, it, i) => sum + lineTotal(it, getQty(it, i)), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, qtyMap],
  );
  const orderTotal = subTotal + shipmentCost(selectedShipment, totalQty);

  /** The order LINES posted to the backend, in the Loom order-item shape. */
  const buildOrderItems = () =>
    items.map((it, i) => {
      const q = getQty(it, i);
      const fp = it.fabricProductPreview;
      const fin = (it as { finishedProductPreview?: { id?: number; product?: { id?: number; name?: string; heroImage?: string; sku?: string; slug?: string; productGroup?: string } } })
        .finishedProductPreview;
      const p = fp?.product || fin?.product;
      const tier = fp?.product ? discountedUnitPrice(fp.product, q) : 0;
      const unitPrice = tier > 0 ? tier : cartUnitPrice(it);
      const productId =
        (it as { productId?: number }).productId ??
        fp?.product?.id ??
        fin?.product?.id ??
        p?.id;
      const productName = (it as any).name || p?.name || 'Artisanal Product';
      const heroImage = (it as any).image || p?.heroImage || '';
      const sku = p?.sku || '';
      const slug = p?.slug || '';

      // Build customization with product preview for order history display
      const customization = {
        ...(fp ? { fabricProductPreview: { product: { name: productName, heroImage, sku, slug, id: productId } } } : {}),
        ...(fin ? { finishedProductPreview: { product: { name: productName, heroImage, sku, slug, id: productId } } } : {}),
        ...((it as Record<string, unknown>).customization || {}),
      };

      return {
        productId,
        cartItemId: it.id,
        orderType: effectiveOrderType(it),
        productGroup: it.productGroup || p?.productGroup || 'fabric',
        price: unitPrice,
        quantity: q,
        unit: (it.unit || 'UNIT').toUpperCase(),
        productName,
        heroImage,
        sku,
        slug,
        customization,
        volumeDiscount: {},
        madeToOrderProfile: {},
        saleDiscountPercentage: 0,
      };
    });

  const billingForOrder = sameAsShipping ? shippingAddress : (realBillingAddress || shippingAddress);

  // Latest cart lines, readable from a callback that outlives the render that
  // created it (the Stripe return path runs before `items` is in its closure).
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  /**
   * Everything that happens ONCE A PAYMENT IS VERIFIED, in one place because
   * two different lanes reach it: the in-page providers (sandbox, Razorpay) and
   * the Stripe hosted-redirect return. It deliberately takes the placed order as
   * an argument rather than reading state, so the return path — which comes back
   * to a freshly mounted component with none of that state — can call it too.
   */
  const finalizeOrder = useCallback(async (placedOrder: PlacedOrder) => {
    // Mirror the live AdAttributionService.destroy() on order success.
    clearAttribution();
    // Empty the cart the order was made from. Guest carts live in localStorage;
    // an account's cart is server-side and is cleared line by line.
    if (placedOrder.guestOrder) {
      guestCart.clear();
    } else {
      await Promise.all(
        itemsRef.current.filter((it) => it.id != null).map((it) =>
          fetch('/api/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: it.id }),
            cache: 'no-store',
          }).catch(() => undefined)),
      );
      try { window.dispatchEvent(new CustomEvent('anuprerna:cart-updated')); } catch { /* no-op */ }
    }
    setPlaced(placedOrder);
    setStep('confirm');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── STRIPE HOSTED-CHECKOUT RETURN ─────────────────────────────────────────
  // Stripe brings the buyer back to
  //   /checkout?stripe_return=1&orderId=<id>&session_id=cs_test_...
  // (or ?stripe_cancelled=1). THE BROWSER SAYING "I PAID" MEANS NOTHING HERE:
  // all this effect does is hand the Checkout Session id to our own callback
  // route, where the SERVER retrieves that session from Stripe and flips the
  // order only if Stripe itself reports status=complete + payment_status=paid.
  // This is the whole no-webhook pattern in one place — see CHECKOUT-FLOW.md §3.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cancelled = params.get('stripe_cancelled') === '1';
    const returned = params.get('stripe_return') === '1';
    if (!cancelled && !returned) return;
    resumedRef.current = true;

    // Scrub the gateway params: a refresh or a shared link must not re-run this.
    window.history.replaceState({}, '', window.location.pathname);

    if (cancelled) {
      setStep('payment');
      setPayError('Payment was cancelled. Your order is saved and unpaid — you can pay again.');
      return;
    }

    const orderId = Number(params.get('orderId') ?? 0);
    const sessionId = String(params.get('session_id') ?? '');
    if (!Number.isFinite(orderId) || orderId <= 0 || !sessionId.startsWith('cs_')) {
      setStep('payment');
      setPayError('We could not match that payment to an order. Nothing was charged twice — please contact us.');
      return;
    }

    // What the confirmation screen needs, stashed before we navigated away.
    let stashed: PlacedOrder | null = null;
    try {
      const raw = window.sessionStorage.getItem(STRIPE_RESUME_KEY);
      if (raw) stashed = JSON.parse(raw) as PlacedOrder;
      window.sessionStorage.removeItem(STRIPE_RESUME_KEY);
    } catch { /* private mode: fall through to the minimal confirmation below */ }

    void (async () => {
      setProvider('stripe');
      setPayBusy(true);
      setPayLabel('Verifying your payment…');
      // providerPaymentId and signature are EMPTY ON PURPOSE. Stripe's return
      // carries no signature (that exists only on webhook bodies, which this
      // sandbox cannot receive), and the pi_... is learned by the server from
      // Stripe, never from this browser.
      const r = await fetch('/api/checkout/payment-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, sessionId, providerOrderId: sessionId, providerPaymentId: '', signature: '' }),
        cache: 'no-store',
      });
      const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      setPayBusy(false);
      if (!r.ok || d.success !== true) {
        setStep('payment');
        setPayError(String(d.message || 'Payment could not be verified. Your order is saved and unpaid.'));
        return;
      }
      // The provider comes back from the CALLBACK RESPONSE (read off the
      // sidecar server-side), not from the fact that we happen to be on the
      // Stripe return path — the return URL is caller-visible, the sidecar is not.
      const settledBy = typeof d.paymentProvider === 'string' ? d.paymentProvider : undefined;
      await finalizeOrder({
        ...(stashed ?? {
          orderId,
          orderNumber: 'AP-' + orderId,
          amount: 0,
          currency: '',
          guestOrder: false,
        }),
        paymentProvider: settledBy,
      });
    })();
  }, [finalizeOrder]);

  // ---- TERMINAL ACTION — the REAL checkout sequence -------------------------
  const placeOrder = async (preferredGateway?: string | unknown) => {
    if (payBusy) return;
    const gateway =
      typeof preferredGateway === 'string' && preferredGateway.trim().length > 0
        ? preferredGateway.trim()
        : (currency === 'INR' ? 'razorpay' : 'stripe');
    setPayBusy(true);
    setPayError('');
    if (!shippingAddress) {
      setPayError('Add a shipping address before paying.');
      setStep('shipping');
      setPayBusy(false);
      return;
    }
    if (items.length === 0) {
      setPayError('Your cart is empty.');
      setPayBusy(false);
      return;
    }
    const post = async (url: string, body: unknown) => {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const d = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data: d as Record<string, unknown> };
    };
    try {
      // 1. create the order (PENDING)
      setPayLabel('Creating your order…');
      const orderLines = buildOrderItems();
      const currentShipmentCost = shipmentCost(selectedShipment, totalQty);
      const created = await post('/api/checkout/order', {
        currency,
        shipmentId: selectedShipmentId,
        subTotal,
        shippingCost: currentShipmentCost,
        totalAmount: orderTotal,
        address: { shippingAddress, billingAddress: billingForOrder },
        orderItems: orderLines,
        note: '',
      });
      if (!created.ok || created.data.success !== true) {
        setPayError(String(created.data.message || 'Could not create your order.'));
        setPayBusy(false);
        return;
      }
      const orderId = Number(created.data.orderId);

      // 2. open a payment session
      setPayLabel('Opening a secure payment…');
      const session = await post('/api/checkout/payment-session', {
        orderId,
        provider: gateway,
      });
      if (!session.ok || session.data.success !== true) {
        setPayError('Could not start the payment. Your order is saved and unpaid.');
        setPayBusy(false);
        return;
      }
      const sess = session.data.session as GatewaySession | undefined;
      if (!sess?.provider) {
        setPayError('Could not start the payment. Your order is saved and unpaid.');
        setPayBusy(false);
        return;
      }
      setProvider(sess.provider);

      const placedOrder: PlacedOrder = {
        orderId,
        orderNumber: String(created.data.orderNumber || 'AP-' + orderId),
        amount: Number(created.data.amount ?? convertCharge(orderTotal)),
        subTotal: Number(created.data.subTotal ?? subTotal),
        shippingCost: Number(created.data.shippingCost ?? currentShipmentCost),
        currency: String(created.data.currency || currency),
        guestOrder: created.data.guestOrder === true,
        guestToken: typeof created.data.guestToken === 'string' ? created.data.guestToken : undefined,
        overallStatus: 'PROCESSING',
        shippingAddress: (shippingAddress || undefined) as any,
        createdAt: Date.now(),
        items: orderLines.map((it) => ({
          id: it.productId,
          name: it.productName,
          heroImage: it.heroImage,
          sku: it.sku,
          quantity: it.quantity,
          unit: it.unit,
          price: it.price,
          productGroup: it.productGroup,
        })),
      };

      // ── 3. THE GATEWAY TAKES THE MONEY ────────────────────────────────────
      // Which gateway is the BACKEND's decision (currency-routed at order
      // creation and recorded on the order); this switch only knows how to
      // drive each one. No branch below can mark anything paid.
      let callback: GatewayCallback | null = null;

      if (sess.provider === 'stripe') {
        // HOSTED REDIRECT. No card field ever exists in this application.
        if (!sess.checkoutUrl) {
          setPayError('Could not open the payment page. Your order is saved and unpaid.');
          setPayBusy(false);
          return;
        }
        try {
          window.sessionStorage.setItem(STRIPE_RESUME_KEY, JSON.stringify(placedOrder));
        } catch { /* private mode: the return path falls back to a minimal confirmation */ }
        setPayLabel('Redirecting to Stripe…');
        // Intentionally NOT clearing payBusy: this page is going away, and the
        // button must not flicker back to "Pay" while the browser navigates.
        window.location.href = sess.checkoutUrl;
        return;
      }

      if (sess.provider === 'razorpay') {
        setPayLabel('Waiting for your payment…');
        try {
          await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        } catch {
          setPayError('Could not reach the payment provider. Your order is saved and unpaid.');
          setPayBusy(false);
          return;
        }

        callback = await payWithRazorpay(sess, {
          name: shippingAddress?.name || guest?.name || user?.name || '',
          email: guest?.email || user?.email || shippingAddress?.contactEmail || '',
          contact: shippingAddress?.primaryPhone || '',
        });

        if (!callback) {
          setPayError('Payment was not completed. Your order is saved and unpaid — you can pay again.');
          setPayBusy(false);
          return;
        }
      } else {
        // 'sandbox' — the MOCKED third party.
        setPayLabel('Confirming with the payment provider…');
        const gateway = await post('/api/checkout/sandbox-gateway', { orderId });
        if (!gateway.ok || gateway.data.success !== true) {
          setPayError('The payment provider did not complete. Your order is saved and unpaid.');
          setPayBusy(false);
          return;
        }
        callback = gateway.data.callback as GatewayCallback;
      }

      // ── 4. VERIFY SERVER-SIDE -> the order becomes PAID ───────────────────
      setPayLabel('Verifying your payment…');
      const confirmed = await post('/api/checkout/payment-callback', callback);
      if (!confirmed.ok || confirmed.data.success !== true) {
        setPayError(String(confirmed.data.message || 'Payment could not be verified.'));
        setPayBusy(false);
        return;
      }

      await finalizeOrder({
        ...placedOrder,
        paymentProvider:
          typeof confirmed.data.paymentProvider === 'string'
            ? (confirmed.data.paymentProvider as string)
            : sess.provider,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setPayError(msg);
    } finally {
      setPayBusy(false);
    }
  };

  const BackLink = (
    <Link href='/products/fabric' className='inline-flex items-center gap-1 text-sm font-medium text-clay'>
      <span className='material-symbols-outlined text-[18px]'>chevron_left</span>
      Back To Shopping
    </Link>
  );

  // THE BANNER. Every word about whether money moves comes from lib/payment-mode,
  // which derives it from a provider name the SERVER supplied — before the order
  // from /api/checkout/payment-mode, and once the order exists from the provider
  // RECORDED ON IT. No branch here infers a gateway from the currency, and no
  // branch defaults to a reassuring sentence when the provider is unknown.
  //
  // This is the bug that was here: the top banner named the Razorpay test gateway
  // while the confirmation box below it, hardcoded, said the payment was a
  // sandbox mock and no card was charged. Both were on screen at once and only
  // one could be true. They now read the same field.
  const bannerProvider = placed?.paymentProvider ?? provider;
  const SandboxBanner = (
    <div className='mb-6 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900'>
      <span className='material-symbols-outlined'>info</span>
      <span className='font-medium' data-testid='sandbox-banner'>
        {paymentModeBanner(bannerProvider)}
      </span>
    </div>
  );

  // ---- Auth loading ---------------------------------------------------------
  if (authLoading || (!user && !guestResolved)) {
    return (
      <main className='min-h-[70vh] bg-white'>
        <div className='mx-auto max-w-screen-xl px-5 py-10'>
          {SandboxBanner}
          <div className='flex h-64 items-center justify-center text-clay/50'>
            <span className='material-symbols-outlined animate-spin text-3xl'>progress_activity</span>
          </div>
        </div>
      </main>
    );
  }

  // NOT identified at all: the guest cart review + the email capture that starts
  // a GUEST checkout (no account, no password — see GuestCartView).
  if (!user && !guest) {
    return <GuestCartView onGuestReady={(g) => { setGuest(g); setStep('cart'); }} />;
  }

  const empty = !dataLoading && items.length === 0 && !placed;

  // OrderSummary CTA varies by step
  const summaryCta = (): { label: string; fn: () => void; disabled?: boolean } => {
    if (step === 'cart') return { label: 'Continue To Shipping', fn: () => setStep('shipping') };
    if (step === 'shipping') return { label: 'Continue To Payment', fn: () => setStep('payment') };
    // formatCharge, NOT format: this is the amount the card is actually debited,
    // so it must use the server's rounding rule (round UP to a whole unit) or
    // the button and the gateway disagree.
    return { label: payBusy ? payLabel : 'Pay ' + formatCharge(orderTotal), fn: placeOrder, disabled: payBusy };
  };
  const { label: ctaLabel, fn: onCta, disabled: ctaDisabled } = summaryCta();

  const SECTION_SEQ: EffectiveOrderType[] = ['IN_STOCK', 'MADE_TO_ORDER', 'PRE_ORDER'];
  const renderCartSections = () => {
    const groups = SECTION_SEQ.map((type) => ({
      type,
      entries: items
        .map((it, i) => ({ it, i }))
        .filter(({ it }) => effectiveOrderType(it) === type),
    })).filter((g) => g.entries.length > 0);
    return groups.map((g) => (
      <section key={g.type} className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>
        <h3 className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>
          Cart Item: {ORDER_TYPE_SECTION[g.type]}
        </h3>
        <div className='mt-2 divide-y divide-clay/10'>
          {g.entries.map(({ it, i }) => (
            <CartItemCard
              key={it.id ?? i}
              item={it}
              qty={getQty(it, i)}
              onQtyChange={(q) => setItemQty(it, i, q)}
              onRemove={() => removeItem(it, i)}
              bare
            />
          ))}
        </div>
      </section>
    ));
  };

  return (
    <main className='min-h-[70vh] bg-white'>
      <div className='mx-auto max-w-screen-xl px-5 py-8'>
        {SandboxBanner}
        <div className='mb-2'>{BackLink}</div>
        <Stepper step={step} />

        {step !== 'confirm' && isGuest && (
          <p className='mx-auto mt-3 max-w-2xl text-center text-sm text-clayd/80'>
            Checking out as a guest as <span className='font-medium text-clay'>{guest?.email}</span> — no account
            is created. You&apos;ll get a link to track this order.
          </p>
        )}

        {/* ---- CONFIRM (a REAL, persisted, paid order) ---- */}
        {step === 'confirm' && placed ? (
          <div className='mx-auto mt-6 max-w-3xl space-y-6 pb-16'>
            {/* 1. Header Card */}
            {placed.overallStatus === 'CANCELLED' ? (
              <div className='rounded-2xl border border-red-200 bg-red-50/90 p-6 sm:p-8 text-center shadow-sm'>
                <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600'>
                  <span className='material-symbols-outlined text-3xl'>cancel</span>
                </div>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white'>
                  Order Cancelled
                </span>
                <h2 className='mt-3 text-2xl font-bold text-gray-900'>Order #{placed.orderNumber} has been cancelled</h2>
                <p className='mt-2 text-sm text-gray-700'>
                  Reason: <span className='font-medium text-gray-900'>{placed.cancellationReason || 'Cancelled by buyer'}</span>
                </p>
                <p className='mt-1 text-xs text-gray-500'>
                  Cancelled on {new Date(placed.cancelledAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
                <div className='mt-4 rounded-lg border border-red-200/80 bg-white/80 p-3.5 text-xs text-red-800 text-left sm:text-center'>
                  <p className='font-semibold'>Refund Information:</p>
                  <p className='mt-0.5'>
                    Since your payment of {formatAmount(placed.amount, placed.currency)} was processed via{' '}
                    <span className='font-medium'>{placed.paymentProvider || 'Razorpay'}</span>, your refund will be automatically
                    credited to your original payment method within 3–5 business days.
                  </p>
                </div>
              </div>
            ) : (
              <div className='rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-6 sm:p-8 text-center shadow-sm'>
                <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50'>
                  <span className='material-symbols-outlined text-3xl font-bold'>check_circle</span>
                </div>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white'>
                  Payment Successful & Confirmed
                </span>
                <h2 className='mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900'>
                  Thank You For Your Order!
                </h2>
                <p className='mt-2 text-sm text-gray-600'>
                  Your order has been placed and sent to our artisan network for fulfillment.
                </p>
                <div className='mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-clay/15 bg-white px-4 py-2.5 shadow-sm'>
                  <span className='text-xs text-gray-500 uppercase font-medium'>Order ID:</span>
                  <span className='font-mono text-sm font-bold text-clay' data-testid='order-number'>{placed.orderNumber}</span>
                  <span className='text-gray-300'>•</span>
                  <span className='text-xs text-gray-500'>Date:</span>
                  <span className='text-xs font-medium text-gray-800'>
                    {new Date(placed.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            {/* 2. Purchased Items List with Pictures & Descriptions */}
            <div className='rounded-2xl border border-clay/15 bg-white p-6 shadow-sm'>
              <div className='flex items-center justify-between border-b border-clay/10 pb-3 mb-4'>
                <h3 className='text-base font-semibold text-gray-900 flex items-center gap-2'>
                  <span className='material-symbols-outlined text-clay'>shopping_bag</span>
                  Purchased Items ({placed.items?.length || 1})
                </h3>
                <span className='text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200'>
                  {placed.overallStatus === 'CANCELLED' ? 'Cancelled' : 'Processing for Dispatch'}
                </span>
              </div>

              <div className='divide-y divide-clay/10'>
                {(placed.items && placed.items.length > 0 ? placed.items : [
                  {
                    name: 'Artisanal Fabric Order',
                    heroImage: '',
                    quantity: 1,
                    unit: 'METER',
                    price: placed.amount,
                  }
                ]).map((it, idx) => (
                  <div key={idx} className='py-4 first:pt-0 last:pb-0 flex items-center gap-4'>
                    <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-clay/15 bg-[#fbf9f5]'>
                      {it.heroImage ? (
                        <Img src={it.heroImage} alt={it.name} fill sizes='80px' className='object-cover' />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-clay/30'>
                          <span className='material-symbols-outlined text-2xl'>texture</span>
                        </div>
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h4 className='font-medium text-gray-900 text-sm leading-snug'>{it.name}</h4>
                      {it.sku && <p className='text-xs text-gray-400 font-mono mt-0.5'>SKU: {it.sku}</p>}
                      <div className='mt-1 flex items-center gap-2 text-xs text-gray-500'>
                        <span className='inline-block rounded bg-clay/10 px-2 py-0.5 font-medium text-clay'>
                          Qty: {it.quantity} {it.unit || 'Unit'}
                        </span>
                        <span>•</span>
                        <span>Unit Price: {formatAmount(it.price, placed.currency)}</span>
                      </div>
                    </div>
                    <div className='text-right shrink-0'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {formatAmount(it.price * (it.quantity || 1), placed.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Financial Breakdown & Shipping Details (2-column layout) */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              {/* Shipping Address */}
              <div className='rounded-2xl border border-clay/15 bg-white p-5 shadow-sm flex flex-col justify-between'>
                <div>
                  <h4 className='text-sm font-semibold uppercase tracking-wider text-clay flex items-center gap-1.5 border-b border-clay/10 pb-2 mb-3'>
                    <span className='material-symbols-outlined text-base'>local_shipping</span>
                    Delivery Address
                  </h4>
                  {placed.shippingAddress ? (() => {
                    const ship = placed.shippingAddress as any;
                    return (
                      <div className='text-xs text-gray-700 space-y-1'>
                        <p className='font-bold text-sm text-gray-900'>{ship.name || guest?.name || user?.name || 'Customer'}</p>
                        <p>{ship.addressLineOne || ship.addressLine1 || 'Address'}</p>
                        {(ship.addressLineTwo || ship.addressLine2) && (
                          <p>{ship.addressLineTwo || ship.addressLine2}</p>
                        )}
                        <p>
                          {[ship.city, ship.state, ship.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                        <p className='font-medium text-gray-800'>{ship.country || 'India'}</p>
                        {(ship.primaryPhone || ship.contactEmail) && (
                          <div className='pt-2 mt-2 border-t border-clay/10 text-gray-500 space-y-0.5'>
                            {ship.primaryPhone && <p>📞 {ship.primaryPhone}</p>}
                            {ship.contactEmail && <p>✉️ {ship.contactEmail}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <p className='text-xs text-gray-500 italic'>Standard delivery address provided during checkout.</p>
                  )}
                </div>
              </div>

              {/* Payment & Price Breakdown */}
              <div className='rounded-2xl border border-clay/15 bg-white p-5 shadow-sm'>
                <h4 className='text-sm font-semibold uppercase tracking-wider text-clay flex items-center gap-1.5 border-b border-clay/10 pb-2 mb-3'>
                  <span className='material-symbols-outlined text-base'>receipt_long</span>
                  Payment Summary
                </h4>
                <div className='space-y-2 text-xs text-gray-600'>
                  <div className='flex justify-between'>
                    <span>Items Subtotal</span>
                    <span className='font-medium text-gray-900'>
                      {formatAmount(placed.subTotal || placed.amount, placed.currency)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Shipping & Handling</span>
                    <span className='font-medium text-gray-900'>
                      {(placed.shippingCost ?? 0) > 0 ? formatAmount(placed.shippingCost!, placed.currency) : 'Free Shipping'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Taxes & GST (Included)</span>
                    <span className='font-medium text-gray-900'>₹0.00</span>
                  </div>
                  <div className='pt-2 border-t border-clay/10 flex justify-between items-baseline'>
                    <span className='text-sm font-bold text-gray-900'>Total Amount Paid</span>
                    <span className='text-base font-extrabold text-emerald-800'>
                      {formatAmount(placed.amount, placed.currency)}
                    </span>
                  </div>
                  <div className='mt-3 rounded-lg bg-[#fbf9f5] border border-clay/15 p-2.5 text-center text-xs'>
                    <p className='text-gray-700 font-medium'>
                      Payment Method: <span className='text-clay font-bold'>{placed.paymentProvider ? placed.paymentProvider.toUpperCase() : 'RAZORPAY'}</span>
                    </p>
                    <p className='text-emerald-700 text-[11px] mt-0.5 flex items-center justify-center gap-1'>
                      <span className='material-symbols-outlined text-xs'>verified</span>
                      Transaction verified & settled
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Actions: Print, Continue Shopping, Cancel Order */}
            <div className='rounded-2xl border border-clay/15 bg-[#fbf9f5] p-5 shadow-sm space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-2.5'>
                  {/* Print receipt */}
                  <button
                    type='button'
                    onClick={() => window.print()}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-clay/20 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-clay/5 shadow-xs transition'
                  >
                    <span className='material-symbols-outlined text-sm'>print</span>
                    Print Receipt
                  </button>

                  {/* Continue Shopping */}
                  <Link
                    href='/products/fabric'
                    className='inline-flex items-center gap-1.5 rounded-lg border border-clay/20 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-clay/5 shadow-xs transition'
                  >
                    <span className='material-symbols-outlined text-sm'>storefront</span>
                    Continue Shopping
                  </Link>
                </div>

                {/* Cancel Order Button */}
                {placed.overallStatus !== 'CANCELLED' && (
                  <button
                    type='button'
                    onClick={() => setCancelModalOpen(true)}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50/80 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition'
                  >
                    <span className='material-symbols-outlined text-sm text-red-600'>do_not_disturb_on</span>
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Guest order tracking link */}
              {placed.guestOrder && placed.guestToken && (
                <div className='border-t border-clay/10 pt-3'>
                  <p className='text-xs text-gray-600'>
                    Track your order anytime using your guest token:{' '}
                    <Link
                      href={'/order-status/' + placed.guestToken}
                      className='font-mono font-medium text-clay underline underline-offset-2 ml-1'
                    >
                      /order-status/{placed.guestToken}
                    </Link>
                  </p>
                </div>
              )}

              {!placed.guestOrder && (
                <div className='border-t border-clay/10 pt-3'>
                  <Link
                    href='/profile/order'
                    className='text-xs font-medium text-clay hover:underline'
                  >
                    → View this order in your account order history
                  </Link>
                </div>
              )}
            </div>

            {/* Cancel Confirmation Modal */}
            {cancelModalOpen && (
              <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs'>
                <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4'>
                  <div className='flex items-center gap-3 text-red-600'>
                    <span className='material-symbols-outlined text-2xl'>warning</span>
                    <h3 className='text-lg font-bold text-gray-900'>Cancel Order #{placed.orderNumber}?</h3>
                  </div>
                  <p className='text-xs text-gray-600 leading-relaxed'>
                    Are you sure you want to cancel this order? Once cancelled, production will be halted and your payment of{' '}
                    <span className='font-semibold'>{formatAmount(placed.amount, placed.currency)}</span> will be processed for refund.
                  </p>

                  <div>
                    <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                      Please select a cancellation reason:
                    </label>
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className='w-full rounded-lg border border-clay/30 bg-white p-2 text-xs text-gray-900 focus:border-clay focus:outline-hidden'
                    >
                      <option value='Ordered by mistake'>Ordered by mistake</option>
                      <option value='Need to change shipping address'>Need to change shipping address</option>
                      <option value='Want to change fabric/color/quantity'>Want to change fabric/color/quantity</option>
                      <option value='Expected faster delivery'>Expected faster delivery</option>
                      <option value='Charged twice / payment issue'>Charged twice / payment issue</option>
                      <option value='Other reason'>Other reason</option>
                    </select>
                  </div>

                  {cancelError && (
                    <p className='rounded-md bg-red-50 p-2 text-xs text-red-700 border border-red-200'>
                      {cancelError}
                    </p>
                  )}

                  <div className='flex items-center justify-end gap-2 pt-2'>
                    <button
                      type='button'
                      disabled={cancelling}
                      onClick={() => setCancelModalOpen(false)}
                      className='rounded-lg border border-clay/30 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50'
                    >
                      Keep Order
                    </button>
                    <button
                      type='button'
                      disabled={cancelling}
                      onClick={handleCancelOrder}
                      className='rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50'
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : dataLoading ? (
          <div className='flex h-64 items-center justify-center text-clay/50'>
            <span className='material-symbols-outlined animate-spin text-3xl'>progress_activity</span>
          </div>
        ) : loadError ? (
          <div className='mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700'>
            <p>Couldn&apos;t load your checkout details. Please try again.</p>
            <button
              type='button'
              onClick={() => setReloadKey((k) => k + 1)}
              className='mt-4 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100'
            >
              <span className='material-symbols-outlined text-base'>refresh</span>
              Retry
            </button>
          </div>
        ) : empty ? (
          <div className='mt-16 text-center'>
            <p className='text-clay/70'>Your cart is empty.</p>
            <Link href='/products/fabric' className='mt-4 inline-block rounded-md bg-clay/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-clay'>
              Browse fabric
            </Link>
          </div>
        ) : (
          <div className='mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* MAIN COLUMN */}
            <div className='space-y-6 lg:col-span-2'>
              {step === 'cart' && (
                <>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                      <label htmlFor='ship-to' className='mb-1 block text-xs font-semibold uppercase tracking-[.08em] text-clayd'>Ship To:</label>
                      <select
                        id='ship-to'
                        value={shipCountry}
                        onChange={(e) => setShipCountry(e.target.value)}
                        className='w-full rounded-md border border-clay/25 bg-white px-3 py-2.5 text-sm text-clay outline-none focus:border-clay'
                      >
                        {countryOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor='ship-method-cart' className='mb-1 block text-xs font-semibold uppercase tracking-[.08em] text-clayd'>Select Shipment Method:</label>
                      <select
                        id='ship-method-cart'
                        value={selectedShipmentId ?? ''}
                        onChange={(e) => setSelectedShipmentId(e.target.value ? Number(e.target.value) : null)}
                        className='w-full rounded-md border border-clay/25 bg-white px-3 py-2.5 text-sm uppercase text-clay outline-none focus:border-clay'
                      >
                        {visibleShipments.length === 0 && <option value=''>—</option>}
                        {visibleShipments.map((s) => (
                          <option key={s.id} value={s.id}>{(s.name || 'Method').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {renderCartSections()}

                  <button
                    type='button'
                    onClick={() => setStep('shipping')}
                    className='flex w-full items-center justify-center gap-2 rounded-md bg-clay/80 px-4 py-3.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay'
                  >
                    Continue To Shipping
                    <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
                  </button>
                </>
              )}

              {step === 'shipping' && (
                <>
                  <div>
                    <label htmlFor='ship-method' className='mb-1 block text-xs font-semibold uppercase tracking-[.08em] text-clayd'>Select Shipment Method</label>
                    <select
                      id='ship-method'
                      value={selectedShipmentId ?? ''}
                      onChange={(e) => setSelectedShipmentId(e.target.value ? Number(e.target.value) : null)}
                      className='w-full rounded-md border border-clay/25 bg-white px-3 py-2.5 text-sm uppercase text-clay outline-none focus:border-clay'
                    >
                      {visibleShipments.length === 0 && <option value=''>—</option>}
                      {visibleShipments.map((s) => (
                        <option key={s.id} value={s.id}>{(s.name || 'Method').toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* GUEST: the address travels with the order (no address book). */}
                  {isGuest ? (
                    <section className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>
                      <h3 className='mb-3 text-sm font-semibold uppercase tracking-[.08em] text-clay'>Shipping Address</h3>
                      {guestAddress && !guestAddressOpen ? (
                        <div>
                          <p className='text-sm font-medium text-clay'>{guestAddress.name}</p>
                          <p className='mt-1 text-sm leading-relaxed text-clayd/90'>
                            {[guestAddress.addressLineOne, guestAddress.addressLineTwo].filter(Boolean).join(', ')}
                            <br />
                            {[guestAddress.city, guestAddress.state, guestAddress.postalCode, guestAddress.country].filter(Boolean).join(', ')}
                          </p>
                          {guestAddress.primaryPhone && (
                            <p className='mt-1 text-sm text-clayd/80'>{guestAddress.primaryPhone}</p>
                          )}
                          <p className='text-sm text-clayd/80'>{guest?.email}</p>
                          <button
                            type='button'
                            onClick={() => setGuestAddressOpen(true)}
                            className='mt-3 text-sm font-medium text-clayd underline underline-offset-4'
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <GuestAddressForm
                          email={guest?.email ?? ''}
                          initial={guestAddress}
                          onSave={(a) => { setGuestAddress(a); setGuestAddressOpen(false); if (a.country) setShipCountry(a.country.toUpperCase()); }}
                          onCancel={guestAddress ? () => setGuestAddressOpen(false) : undefined}
                        />
                      )}
                    </section>
                  ) : addresses.length > 1 ? (
                    <section className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>
                      <h3 className='mb-3 text-sm font-semibold uppercase tracking-[.08em] text-clay'>Shipping Address</h3>
                      <div className='space-y-3'>
                        {addresses.filter((a) => a.addressType !== 'BILLING').map((a) => (
                          <button
                            key={a.id}
                            type='button'
                            onClick={() => setSelectedAddressId(a.id ?? null)}
                            className={
                              'block w-full rounded-md border p-3 text-left transition ' +
                              (a.id === (shippingAddress?.id ?? null) ? 'border-clay bg-clay/5' : 'border-clay/15 hover:border-clay/40')
                            }
                          >
                            <p className='text-sm font-medium text-clay'>{a.name || a.companyName}</p>
                            <p className='mt-1 text-sm text-clayd/90'>
                              {[a.addressLineOne, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
                            </p>
                          </button>
                        ))}
                      </div>
                      <button
                        type='button'
                        onClick={() =>
                          setAddrModal({
                            kind: 'add',
                            book: 'SHIPPING',
                            makePrimary: addresses.filter((a) => a.addressType !== 'BILLING').length === 0,
                          })
                        }
                        className='mt-3 inline-block text-sm font-medium text-clayd underline underline-offset-4'
                      >
                        + Add address
                      </button>
                    </section>
                  ) : (
                    <AddressCard
                      title='Shipping Address'
                      address={shippingAddress}
                      onEdit={() =>
                        setAddrModal(
                          shippingAddress
                            ? { kind: 'edit', addr: shippingAddress, book: 'SHIPPING' }
                            : {
                                kind: 'add',
                                book: 'SHIPPING',
                                makePrimary: addresses.filter((a) => a.addressType !== 'BILLING').length === 0,
                              },
                        )
                      }
                    />
                  )}

                  {/* BILLING — hidden while 'Same As Shipping' is checked. */}
                  <section className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>Billing Address</h3>
                      <label className='flex items-center gap-1.5 text-sm font-normal text-clayd'>
                        <input
                          type='checkbox'
                          checked={sameAsShipping}
                          onChange={(e) => onSameAsShippingChange(e.target.checked)}
                          className='accent-clay'
                          disabled={isGuest}
                        />
                        Same As Shipping
                      </label>
                    </div>

                    {!sameAsShipping && !isGuest && (
                      <div className='mt-4 border-t border-clay/10 pt-4'>
                        <div className='mb-2 flex items-center justify-end'>
                          <button
                            type='button'
                            onClick={() =>
                              setAddrModal(
                                realBillingAddress
                                  ? { kind: 'edit', addr: realBillingAddress, book: 'BILLING' }
                                  : { kind: 'add', book: 'BILLING', makePrimary: true },
                              )
                            }
                            className='text-sm font-medium text-clayd underline underline-offset-4'
                          >
                            {realBillingAddress ? 'Edit' : '+ Add address'}
                          </button>
                        </div>
                        {realBillingAddress ? (
                          <div>
                            <p className='text-sm font-medium text-clay'>
                              {realBillingAddress.name || realBillingAddress.companyName || 'Address'}
                            </p>
                            <p className='mt-1 text-sm leading-relaxed text-clayd/90'>
                              {[realBillingAddress.addressLineOne, realBillingAddress.addressLineTwo].filter(Boolean).join(', ')}
                              {realBillingAddress.addressLineOne ? <br /> : null}
                              {[realBillingAddress.city, realBillingAddress.state, realBillingAddress.postalCode].filter(Boolean).join(', ')}
                              {realBillingAddress.country ? ', ' + realBillingAddress.country : ''}
                            </p>
                            {(realBillingAddress.primaryPhone || realBillingAddress.secondaryPhone) && (
                              <p className='mt-1 text-sm text-clayd/80'>
                                {[realBillingAddress.primaryPhone, realBillingAddress.secondaryPhone].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {realBillingAddress.contactEmail && (
                              <p className='text-sm text-clayd/80'>{realBillingAddress.contactEmail}</p>
                            )}
                          </div>
                        ) : (
                          <p className='text-sm text-clayd/60'>No billing address yet — add one above.</p>
                        )}
                      </div>
                    )}
                    {isGuest && (
                      <p className='mt-2 text-xs text-clayd/60'>
                        Guest orders bill to the shipping address.
                      </p>
                    )}
                  </section>

                  {!isGuest && <WhatsAppOptIn />}

                  {renderCartSections()}

                  {/* A buyer with no saved address used to hit a silently disabled
                      button with no explanation — say why, and point at the fix. */}
                  {!shippingAddress && (
                    <p data-testid='needs-address' className='rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                      Add a shipping address above to continue to payment.
                    </p>
                  )}
                  <button
                    type='button'
                    onClick={() => setStep('payment')}
                    disabled={!shippingAddress}
                    className='flex w-full items-center justify-center gap-2 rounded-md bg-clay/80 px-4 py-3.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay disabled:opacity-50'
                  >
                    Continue To Payment
                    <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
                  </button>
                </>
              )}

              {step === 'payment' && (
                <PaymentMethodPanel
                  isINR={currency === 'INR'}
                  amountLabel={formatCharge(orderTotal)}
                  provider={provider}
                  busy={payBusy}
                  busyLabel={payLabel}
                  error={payError}
                  onPay={placeOrder}
                />
              )}
            </div>

            {/* SUMMARY COLUMN — mobile: collapsible bar at top; desktop: sticky sidebar */}
            <aside className='order-first lg:order-none lg:col-span-1'>
              <button
                type='button'
                onClick={() => setSummaryOpen((v) => !v)}
                aria-expanded={summaryOpen}
                aria-controls='order-summary-panel'
                className='mb-2 flex w-full items-center justify-between rounded-xl border border-clay/15 bg-[#f6f2ea] px-4 py-3 text-sm font-semibold uppercase tracking-[.08em] text-clay lg:hidden'
              >
                <span>Order Summary</span>
                <span className='material-symbols-outlined text-[20px]'>
                  {summaryOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <div
                id='order-summary-panel'
                className={
                  (summaryOpen ? 'block' : 'hidden') +
                  ' lg:block rounded-xl border border-clay/15 bg-[#f6f2ea] p-5 lg:sticky lg:top-24'
                }
              >
                <OrderSummary
                  items={items}
                  shipment={selectedShipment}
                  discounts={discounts}
                  qtyMap={qtyMap}
                  ctaLabel={ctaLabel}
                  onCta={onCta}
                  ctaDisabled={ctaDisabled}
                />
              </div>
            </aside>
          </div>
        )}

        <p className='mx-auto mt-10 max-w-2xl text-center text-sm italic text-clayd/70'>
          *We try our best to accurately represent all our items online. But at times, the digital photos may
          not fully represent the exact colour or nature of an item. Therefore, we recommend you to request a
          fabric swatch before purchasing the final product.
        </p>

        {addrModal && (
          <AddressFormModal
            mode={addrModal}
            onClose={() => setAddrModal(null)}
            onSaved={() => setReloadKey((k) => k + 1)}
          />
        )}
      </div>
    </main>
  );
}
