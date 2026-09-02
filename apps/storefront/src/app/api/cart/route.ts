import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import { decodeTokenPayload } from '@/lib/auth/token-helper';
import { localCartStore } from '@/lib/cart/local-cart-store';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ entity: [], authenticated: false });

  const payload = decodeTokenPayload(token);
  const email = (payload?.email || payload?.sub || '') as string;
  const localItems = email ? localCartStore.getCart(email) : [];

  try {
    const cart = await getCart(token);
    const remoteItems = (cart as { cartItemList?: unknown[]; entity?: unknown[] }).cartItemList
      ?? (cart as { entity?: unknown[] }).entity ?? [];
    const combined = Array.isArray(remoteItems) && remoteItems.length > 0 ? remoteItems : localItems;
    return NextResponse.json({ ...cart, entity: combined, cartItemList: combined, authenticated: true });
  } catch {
    return NextResponse.json({ entity: localItems, cartItemList: localItems, authenticated: true });
  }
}
