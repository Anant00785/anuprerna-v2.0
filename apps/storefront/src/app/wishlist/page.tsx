'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLPProduct } from '@/types/domain/plp';
import { wishlistRepository } from '@/lib/api/repositories/wishlist.repository';
import { useWishlistStore } from '@/stores/wishlist.store';
import { useAuthStore } from '@/stores/auth.store';
import { WishlistCard } from '@/components/wishlist/WishlistCard';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';

export default function WishlistPage() {
  const skus = useWishlistStore((s) => s.skus);
  const jwt = useAuthStore((s) => s.jwt);

  const [products, setProducts] = useState<PLPProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!skus || skus.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    wishlistRepository
      .getProductsByCSV(skus.join(','), jwt || undefined)
      .then((res) => {
        if (isMounted) {
          setProducts(res);
        }
      })
      .catch((err) => {
        console.warn('Failed to load wishlist products:', err);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [skus, jwt, hydrated]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 w-full">
        {!hydrated ? (
          <section className="w-full flex justify-center items-stretch min-h-[60vh]">
            <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
              <h1 className="text-3xl md:text-4xl font-medium pt-8 text-gray-900">Wishlist</h1>
            </div>
          </section>
        ) : (
          <section className="w-full flex justify-center items-stretch min-h-[60vh]">
            <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col justify-start items-start w-full">
              <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-2">Wishlist</h1>

              {loading ? (
                <div className="flex justify-center items-center py-20 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8E7862]" />
                </div>
              ) : (
                <>
                  <p className="text-gray-500 text-xs md:text-sm mb-6">
                    {products.length} {products.length === 1 ? 'Item' : 'Items'}
                  </p>

                  {products.length > 0 ? (
                    <div className="w-full py-4">
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 w-full">
                        {products.map((product) => (
                          <WishlistCard key={product.sku || product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <p className="text-gray-500 text-2xl md:text-3xl font-light">
                        Oh no! Your wishlist is empty.
                      </p>
                      <p className="text-sm text-gray-400 max-w-sm">
                        Explore our handwoven fabrics and artisanal items to add your favorites here.
                      </p>
                      <Link
                        href="/products/fabric"
                        className="mt-4 px-6 py-3 bg-[#8E7862] hover:bg-[#6c5b48] text-white text-sm font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        Explore Fabrics
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

