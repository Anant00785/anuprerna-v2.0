import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCart } from '@/lib/loom/endpoints';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ entity: [], authenticated: false });

  try {
    const cart = await getCart(token);
    const items = (cart as { cartItemList?: unknown[]; entity?: unknown[] }).cartItemList
      ?? (cart as { entity?: unknown[] }).entity ?? [];
    return NextResponse.json({ ...cart, entity: items, cartItemList: items, authenticated: true });
  } catch {
    return NextResponse.json({ entity: [], cartItemList: [], authenticated: true, success: false }, { status: 502 });
  }
}
