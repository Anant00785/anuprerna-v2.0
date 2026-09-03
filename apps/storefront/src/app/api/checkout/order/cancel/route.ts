import { NextResponse } from 'next/server';
import { cancelOrder, getOrder } from '@/lib/order-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = Number(body?.orderId);
    const reason = String(body?.reason || 'Cancelled by customer');

    if (!orderId || !Number.isFinite(orderId)) {
      return NextResponse.json({ success: false, message: 'Valid orderId is required.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (order.overallStatus === 'CANCELLED') {
      return NextResponse.json({ success: true, message: 'Order is already cancelled.', order });
    }

    const ok = await cancelOrder(orderId, reason);
    if (ok) {
      const updated = await getOrder(orderId);
      return NextResponse.json({
        success: true,
        message: 'Order has been cancelled successfully.',
        order: updated,
      });
    }

    return NextResponse.json({ success: false, message: 'Failed to cancel order.' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
