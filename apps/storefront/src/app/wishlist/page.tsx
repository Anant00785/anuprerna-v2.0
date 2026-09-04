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
                      className="group relative flex flex-col rounded-xl border border-gray-100 bg-cream shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                    >
                      {/* Stock-status badge (live colors) */}
                      {badge && (
                        <div
                          className="rounded px-2 py-1 text-[12px] font-medium absolute top-2 left-2 z-10"
                          style={
                            badge === 'In Stock'
                              ? { backgroundColor: '#E6EAC6', color: '#7F8142' }
                              : { backgroundColor: '#FBF3E4', color: '#7D5A20' }
                          }
                        >
                          {badge}
                        </div>
                      )}

                      {/* Remove control — circular white btn w/ '×', wired to the
                          native PUT /manage/wishlist route via /api/profile/wishlist/remove. */}
                      <RemoveFromWishlistButton sku={product.sku ?? ''} />

                      <a href={href} className="relative block aspect-square overflow-hidden bg-sand">
                        {product.heroImage && (
                          <img
                            src={product.heroImage}
                            alt={product.name ?? ''}
                            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </a>

                      {/* Body — matches the catalogue card: left-aligned caption,
                          title, price row, then a full-width View Product CTA. */}
                      <div className="flex flex-1 flex-col p-3">
                        {product.specialStatus?.name && (
                          <span className="text-[11px] mb-1 truncate" style={{ color: '#75787F' }}>
                            {product.specialStatus.name}
                          </span>
                        )}

                        <a href={href} className="block">
                          <h3 className="text-sm text-gray-800 leading-snug line-clamp-2 hover:text-clay transition-colors">
                            {product.name}
                          </h3>
                        </a>

                        {product.price != null && (
                          <div className="mt-2 flex items-center flex-wrap text-clay font-medium text-sm">
                            <span className="text-xs mr-1">INR</span>
                            <span>{formatPrice(product.price)}</span>
                            <span className="text-bark font-normal text-[10px] ml-0.5">
                              {' / ' + (product.unit || 'METER').toUpperCase()}
                            </span>
                          </div>
                        )}

                        <a
                          href={href}
                          className="mt-3 flex items-center justify-center gap-1.5 border border-clay text-clay text-xs py-2 rounded hover:bg-clay hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>View Product</span>
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
