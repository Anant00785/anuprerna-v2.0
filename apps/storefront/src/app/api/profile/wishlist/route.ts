import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';

// GET /api/profile/wishlist
// Fetches the customer profile to get the wishlist CSV, then fetches product previews.
export async function GET() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Step 1: get profile to extract wishlist field (comma-separated product slugs/IDs)
    const profile = await loomGet<{ customer?: { wishlist?: string } }>('/get/customer/profile', { token });
    const wishlistCsv = profile?.customer?.wishlist;
    if (!wishlistCsv) {
      return NextResponse.json({ productPreviewList: [], wishlistCsv: '' });
    }
    // Step 2: fetch product previews for wishlist items
    const encoded = encodeURIComponent(wishlistCsv);
    const previews = await loomGet<Record<string, unknown>>('/get/product-preview-list/csv/' + encoded, { token });
    return NextResponse.json({ ...(previews ?? {}), wishlistCsv });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
