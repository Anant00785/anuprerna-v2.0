import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useWishlistStore } from './wishlist.store';
import { useHandlers } from '@/test/msw';

/** Capture the bodies the store PUTs at the native wishlist route. */
function captureSync(): Array<{ skus: string[] }> {
  const calls: Array<{ skus: string[] }> = [];
  useHandlers(
    http.post('http://localhost:3000/api/profile/wishlist/set', async ({ request }) => {
      calls.push((await request.json()) as { skus: string[] });
      return HttpResponse.json({ success: true });
    }),
  );
  return calls;
}

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ skus: [] });
  });

  it('toggles a product SKU in wishlist', () => {
    captureSync();
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(false);

    useWishlistStore.getState().toggleWishlist('Sample Fabric', 'SKU-101');
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(true);
    expect(useWishlistStore.getState().skus).toEqual(['SKU-101']);

    useWishlistStore.getState().toggleWishlist('Sample Fabric', 'SKU-101');
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(false);
    expect(useWishlistStore.getState().skus).toEqual([]);
  });

  // Regression: the sync used to POST `update/customer/profile` with only a
  // `wishlist` field, which the backend does not persist — so nothing a shopper
  // hearted ever reached their profile and the wishlist page read back empty.
  it('persists the full sku list through the native wishlist route', async () => {
    const calls = captureSync();

    useWishlistStore.getState().toggleWishlist('Sample Fabric', 'SKU-101');
    useWishlistStore.getState().toggleWishlist('Other Fabric', 'SKU-202');
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    expect(calls[0]).toEqual({ skus: ['SKU-101'] });
    expect(calls[1]).toEqual({ skus: ['SKU-101', 'SKU-202'] });
  });

  it('parses CSV wishlist from customer profile', () => {
    useWishlistStore.getState().setWishlistFromProfile('SKU-1, SKU-2, SKU-3');
    expect(useWishlistStore.getState().skus).toEqual(['SKU-1', 'SKU-2', 'SKU-3']);
    expect(useWishlistStore.getState().getWishlistCSV()).toBe('SKU-1,SKU-2,SKU-3');
  });
});
