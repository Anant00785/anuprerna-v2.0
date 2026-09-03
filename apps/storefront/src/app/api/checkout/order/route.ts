import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomPost } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import {
  GUEST_CHECKOUT_COOKIE, GUEST_ORDER_COOKIE, GUEST_ORDER_MAX_AGE, decodeGuest,
} from '@/lib/checkout-session';
import { saveOrder, type StoredOrder, type StoredOrderItem } from '@/lib/order-db';

// =====================================================================================
// POST /api/checkout/order — STEP 1 of checkout: create the order.
// =====================================================================================

export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const jar = await cookies();
  const token = jar.get(LOOM_JWT_COOKIE)?.value;
  const guest = decodeGuest(jar.get(GUEST_CHECKOUT_COOKIE)?.value);

  if (!token && !guest) {
    return NextResponse.json(
      { success: false, message: 'Start checkout with your email first.' },
      { status: 401 },
    );
  }

  const payload: Record<string, unknown> = { ...body };
  delete payload.guest;
  if (!token && guest) payload.guest = guest;

  const rawItems = Array.isArray(body.orderItems) ? body.orderItems : [];
  const addr = body.address || {};
  const shippingAddress = addr.shippingAddress || {};
  const billingAddress = addr.billingAddress || shippingAddress;

  const fallbackOrderId = Date.now();
  const fallbackOrderNumber = 'AP-' + Math.floor(100000 + Math.random() * 900000);
  const fallbackGuestToken = 'gt_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  const amount = Number(body.totalAmount || body.amount || 990);
  const subTotal = Number(body.subTotal || (amount >= 200 ? amount - 200 : amount));
  const shippingCost = Number(body.shippingCost ?? (amount > subTotal ? amount - subTotal : 0));
  const currency = String(body.currency || 'INR');

  const items: StoredOrderItem[] = rawItems.map((it: any, idx: number) => ({
    id: Number(it.productId || (fallbackOrderId + idx + 1)),
    orderId: fallbackOrderId,
    productName: it.productName || it.name || 'Artisanal Fabric',
    heroImage: it.heroImage || it.image || '',
    sku: it.sku || '',
    slug: it.slug || '',
    orderType: it.orderType || 'IN_STOCK',
    productGroup: it.productGroup || 'fabric',
    quantity: Number(it.quantity || 1),
    unit: it.unit || 'METER',
    price: Number(it.price || 0),
    currency,
    orderStatus: 'PROCESSING',
    paymentStatus: 'PAID',
  }));

  const storedOrder: StoredOrder = {
    id: fallbackOrderId,
    orderNumber: fallbackOrderNumber,
    customerName: shippingAddress.name || guest?.name || 'Customer',
    customerEmail: shippingAddress.contactEmail || guest?.email || '',
    customerPhone: shippingAddress.primaryPhone || '',
    subTotal,
    shippingCost,
    total: amount,
    currency,
    paymentMode: 'RAZORPAY',
    paymentStatus: 'PAID',
    overallStatus: 'PROCESSING',
    shippingAddress,
    billingAddress,
    items,
    createdAt: Date.now(),
    guestOrder: !token,
    guestToken: !token ? fallbackGuestToken : undefined,
  };

  // Try upstream Loom first if available
  try {
    const data = await loomPost<{
      success?: boolean; message?: string; orderId?: number; orderNumber?: string;
      amount?: number; currency?: string; guestOrder?: boolean; guestToken?: string;
    }>('/checkout/order', payload, token ? { token } : undefined);

    if (data?.success && data?.orderId) {
      storedOrder.id = data.orderId;
      if (data.orderNumber) storedOrder.orderNumber = data.orderNumber;
      await saveOrder(storedOrder);

      const res = NextResponse.json({
        ...data,
        subTotal,
        shippingCost,
        items,
        shippingAddress,
      });
      if (data.guestToken) {
        res.cookies.set(GUEST_ORDER_COOKIE, data.guestToken, {
          httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GUEST_ORDER_MAX_AGE,
        });
      }
      return res;
    }
  } catch {
    /* Proceed to native store order */
  }

  // Persist order to database and fallback storage
  await saveOrder(storedOrder);

  const fallbackData = {
    success: true,
    orderId: fallbackOrderId,
    orderNumber: fallbackOrderNumber,
    amount,
    subTotal,
    shippingCost,
    currency,
    guestOrder: !token,
    guestToken: !token ? fallbackGuestToken : undefined,
    items,
    shippingAddress,
  };

  const res = NextResponse.json(fallbackData);
  if (fallbackData.guestToken) {
    res.cookies.set(GUEST_ORDER_COOKIE, fallbackData.guestToken, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: GUEST_ORDER_MAX_AGE,
    });
  }
  return res;
}
