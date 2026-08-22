import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWishlistStore } from './wishlist.store';

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ skus: [] });
  });

  it('toggles a product SKU in wishlist', () => {
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(false);

    useWishlistStore.getState().toggleWishlist('Sample Fabric', 'SKU-101');
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(true);
    expect(useWishlistStore.getState().skus).toEqual(['SKU-101']);

    useWishlistStore.getState().toggleWishlist('Sample Fabric', 'SKU-101');
    expect(useWishlistStore.getState().isInWishlist('SKU-101')).toBe(false);
    expect(useWishlistStore.getState().skus).toEqual([]);
  });

  it('parses CSV wishlist from customer profile', () => {
    useWishlistStore.getState().setWishlistFromProfile('SKU-1, SKU-2, SKU-3');
    expect(useWishlistStore.getState().skus).toEqual(['SKU-1', 'SKU-2', 'SKU-3']);
    expect(useWishlistStore.getState().getWishlistCSV()).toBe('SKU-1,SKU-2,SKU-3');
  });
});
