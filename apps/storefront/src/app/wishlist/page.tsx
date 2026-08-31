import { cookies } from 'next/headers';
import { loomGet } from '@/lib/loom/client';
import { LOOM_JWT_COOKIE } from '@/lib/loom/config';
import RemoveFromWishlistButton from '@/components/wishlist/RemoveFromWishlistButton';

export const metadata = {
  title: 'Wishlist | Anuprerna',
  robots: { index: false, follow: false },
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

interface SizeProfile {
  quantity?: number;
  sizeProfileOption?: { sortOrder?: number };
}

interface WishlistProduct {
  id?: number;
  sku?: string;
  name?: string;
  slug?: string;
  price?: number;
  unit?: string;
  heroImage?: string;
  productGroup?: string;
  totalQuantity?: number;
  madeToOrderFabric?: { totalQuantity?: number };
  productSizeProfileList?: SizeProfile[];
  specialStatus?: { name?: string };
}

// Mirrors live wishlist-card._calculateProductOrderType(): derives the stock-status
// badge ('In Stock' / 'Made to Order') from inventory + size-profile data.
function resolveBadge(p: WishlistProduct): string {
  const sizes = p.productSizeProfileList ?? [];
  const hasSizes = sizes.length > 0;
  if (p.totalQuantity || p.madeToOrderFabric?.totalQuantity || hasSizes) {
    if (p.totalQuantity) {
      if (hasSizes) return (sizes[0].quantity ?? 0) > 0 ? 'In Stock' : 'Made to Order';
      return 'In Stock';
    }
    if (p.madeToOrderFabric?.totalQuantity) {
      if (hasSizes) return (sizes[0].quantity ?? 0) > 0 ? 'In Stock' : 'Made to Order';
      return 'Made to Order';
    }
    if (hasSizes && (sizes[0].quantity ?? 0) > 0) return 'In Stock';
  }
  return '';
}

export default async function WishlistPage() {
  const token = (await cookies()).get(LOOM_JWT_COOKIE)?.value;
  if (!token) return null;

  let products: WishlistProduct[] = [];
  let loadError = false;

  try {
    const profileRes = await loomGet<{ customer?: { wishlist?: string } }>('/get/customer/profile', { token });
    const wishlistCsv = profileRes?.customer?.wishlist;
    if (wishlistCsv) {
      const encoded = encodeURIComponent(wishlistCsv);
      const previews = await loomGet<{ productPreviewList?: WishlistProduct[] }>(
        '/get/product-preview-list/csv/' + encoded,
        { token },
      );
      products = (previews?.productPreviewList ?? []).filter(Boolean) as WishlistProduct[];
    }
  } catch {
    loadError = true;
  }

  return (
    <section className="w-full flex justify-center min-h-[70vh] bg-sand/30">
      <meta name="robots" content="noindex" />
      <div className="container flex justify-center">
        <div className="w-full flex flex-col justify-start items-start px-2 xl:px-6">
          <h1 className="text-4xl font-medium pt-8">Wishlist</h1>
          <p className="text-gray-500 text-xs md:text-sm max-w-xs p-2">{products.length} Items</p>

          {products.length > 0 ? (
            <div className="w-full flex flex-col justify-center items-center py-5">
              <div className="w-full grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {products.map((product, idx) => {
                  const group = product.productGroup === 'fabric' ? 'fabric-product' : 'finished-product';
                  const href = '/product/' + group + '/' + (product.slug ?? '');
                  const badge = resolveBadge(product);
                  return (
                    <div
                      key={product.id ?? idx}
                      className="relative shadow-lg rounded md:rounded-xl bg-white overflow-hidden"
                    >
                      {/* Stock-status badge (live colors) */}
                      {badge && (
                        <div
                          className="rounded px-2 py-1 text-xs absolute top-0 left-0 z-10"
                          style={
                            badge === 'In Stock'
                              ? { backgroundColor: '#e6eac6', color: '#7f8142' }
                              : { backgroundColor: '#FFF8D0', color: '#ac9317' }
                          }
                        >
                          {badge}
                        </div>
                      )}

                      {/* Remove control — circular white btn w/ '×', wired to the
                          native PUT /manage/wishlist route via /api/profile/wishlist/remove. */}
                      <RemoveFromWishlistButton sku={product.sku ?? ''} />

                      <a href={href} target="_blank" rel="noopener noreferrer" className="w-full block">
                        {product.heroImage && (
                          <img
                            src={product.heroImage}
                            alt={product.name ?? ''}
                            className="object-cover object-top aspect-square w-full rounded-t md:rounded-t-xl"
                          />
                        )}
                      </a>

                      <div className="p-4">
                        <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center">
                          <p className="md:text-lg text-sm font-medium text-center line-clamp-2">{product.name}</p>
                          {product.price != null && (
                            <div className="flex justify-center items-center mb-2 mt-1 text-xl font-medium">
                              <span className="text-sm mr-1">INR</span> {formatPrice(product.price)}{' '}
                              {product.unit && <span className="text-sm">/ {product.unit}</span>}
                            </div>
                          )}
                          {product.specialStatus?.name && (
                            <div className="px-2 py-1 mb-1 bg-[#b7a98f] rounded w-max text-xs md:text-sm text-white">
                              {product.specialStatus.name}
                            </div>
                          )}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-3xl p-2">
              {loadError ? 'Failed to load your wishlist.' : 'Oh no! Your wishlist is empty.'}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
