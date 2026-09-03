import Img from '@/components/ui/Img';
import CardPrice from './CardPrice';
import type { SeoProduct, SeoBlogItem } from './loom';
import Link from 'next/link';

interface AdsLandingPageProps {
  slug: string;
  title: string;
  products: SeoProduct[];
  blogs: SeoBlogItem[];
}

const PAGE_SIZE = 12;

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

/** FIX 1 root cause: the original had a nested <a> inside <a> (the "View Details" link
 *  was a child anchor of the card anchor). Browsers restructure invalid nested anchors,
 *  causing the SSR DOM to differ from client React tree => React error #418.
 *  Fix: the outer <a> wraps the whole card; the "View Details" is now a <span> element. */
function AdsProductCard({ product }: { product: SeoProduct }) {
  const href = `/product/${product.productGroup}-product/${product.slug}`;
  return (
    <a
      href={href}
      className="rounded-2xl overflow-hidden shadow-sm bg-[#F9F4F5] flex flex-col hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.heroImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-serif text-base font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        {product.specialStatus && (
          <span className="inline-block text-xs font-medium text-clay bg-white px-2 py-0.5 rounded-full w-fit border border-clay/30">
            {product.specialStatus}
          </span>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-gray-900">
            <CardPrice price={product.price} />
            <span className="text-xs text-gray-500 font-normal">/{product.unit || 'meter'}</span>
          </span>
          <span className="text-xs text-gray-500">{product.sku}</span>
        </div>
        {/* Replaced nested <a> with <span> to fix React #418 hydration error */}
        <span className="mt-2 text-center text-xs font-medium py-2 rounded-full bg-[#EAEBF1] border border-clay/20 text-clay group-hover:bg-clay group-hover:text-white transition-colors">
          View Details
        </span>
      </div>
    </a>
  );
}

function BlogInsightCard({ blog }: { blog: SeoBlogItem }) {
  const href = `/blogs/${blog.slug}/${blog.id}`;
  const excerpt = stripHtml(blog.description).slice(0, 100);
  return (
    <a href={href} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
        <img
          src={blog.bannerImageDesktop}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="mt-3 px-0.5">
        {blog.blogContentCategory?.name && (
          <p className="text-[10px] uppercase tracking-widest text-bark mb-1">
            {blog.blogContentCategory.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-clay transition-colors">
          {blog.title}
        </h3>
        {excerpt && (
          <p className="mt-1.5 text-xs text-black/60 leading-relaxed line-clamp-2">{excerpt}</p>
        )}
        <p className="mt-2 text-[11px] text-black/45">{formatDate(blog.timeOfCreation)}</p>
      </div>
    </a>
  );
}

export default function AdsLandingPage({ slug, title, products, blogs }: AdsLandingPageProps) {
  const heroProduct = products[0];
  const heroImg = heroProduct?.heroImage;

  // Split products: initial page + rest (for the View More reveal)
  const initialProducts = products.slice(0, PAGE_SIZE);
  const remainingProducts = products.slice(PAGE_SIZE);

  const checklist = [
    '100% Handspun & Handwoven',
    'Breathable & Climate-Responsive',
    'Low-Impact Production',
  ];

  return (
    <main>
      {/* Section 1: Hero */}
      <section
        className="py-20"
        style={{
          background:
            'linear-gradient(135deg, #F9F4F5 0%, #E9F1ED 25%, #EBE9F2 75%, #EAEBF1 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-full text-xs font-semibold text-clay border border-clay/20 w-fit">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">auto_awesome</span>
                Heritage Collection
              </span>

              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-gray-900">
                {title}
              </h1>

              <p className="text-lg text-gray-700 max-w-lg">
                Artisan-crafted handloom fabrics designed for modern production. Sourced from
                India&rsquo;s finest weaving clusters with flexible MOQs and custom options.
              </p>

              {/* Feature badges */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 w-fit">
                  <span className="material-symbols-outlined text-clay" aria-hidden="true">handshake</span>
                  <span className="text-sm font-medium text-gray-700">
                    Artisan-Made, Not Machine-Produced
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 w-fit">
                  <span className="material-symbols-outlined text-clay" aria-hidden="true">construction</span>
                  <span className="text-sm font-medium text-gray-700">
                    Built for Modern Production Needs
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="material-symbols-outlined text-green-600 text-base" aria-hidden="true">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#all-products"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
                >
                  Explore Collection
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-white/60 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative">
              {heroImg ? (
                <Img
                  src={heroImg}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E9F1ED] to-[#EBE9F2] flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-gray-300" aria-hidden="true">texture</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Products grid */}
      <section
        id="all-products"
        className="py-16"
        style={{
          background:
            'linear-gradient(135deg, #F9F4F5 0%, #E9F1ED 25%, #EBE9F2 75%, #EAEBF1 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
            All Products
          </h2>

          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {initialProducts.map((product) => (
                  <AdsProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* View More Products pagination (live site shows a load-more below the grid) */}
              {remainingProducts.length > 0 && (
                <div id="more-products" className="mt-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {remainingProducts.map((product) => (
                      <AdsProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mt-10">
                <Link
                  href="/products/fabric"
                  className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-900 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">grid_view</span>
                  View More Products
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-12">
              No products found. Please check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Section 3: Latest Insights blog row */}
      {blogs.length > 0 && (
        <section className="py-16 bg-white" id="latest-insights">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
                Latest Insights
              </h2>
              <Link
                href="/blogs"
                className="text-sm font-medium text-clay hover:underline hidden sm:inline-flex items-center gap-1"
              >
                View all articles
                <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogs.map((blog) => (
                <BlogInsightCard key={blog.id} blog={blog} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-900 hover:text-white transition-colors"
              >
                Load More Articles
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Our Artisan Heritage — 500+ / 3000+ stat counters */}
      <section
        className="py-16 lg:py-24"
        style={{
          background:
            'linear-gradient(135deg, #F9F4F5 0%, #E9F1ED 50%, #EAEBF1 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: image */}
            <div className="relative h-[320px] lg:h-[480px] w-full rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1">
              {heroImg ? (
                <Img
                  src={heroImg}
                  alt="Our Artisan Heritage"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E9F1ED] to-[#EBE9F2]" />
              )}
            </div>

            {/* Right: stats + text */}
            <div className="flex flex-col gap-8 order-1 lg:order-2">
              <div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-clay">
                  Our Artisan Heritage
                </span>
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mt-3">
                  Preserving Traditional Crafts
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  For generations, our artisan communities have woven stories into fabric.
                  We connect their craft directly to the global market, ensuring fair
                  livelihoods while preserving India&rsquo;s textile heritage.
                </p>
              </div>

              {/* Stat counters */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/70 rounded-2xl p-6 text-center shadow-sm">
                  <p className="font-serif text-4xl font-bold text-gray-900">500+</p>
                  <p className="mt-1 text-sm text-gray-600">Skilled Artisans</p>
                </div>
                <div className="bg-white/70 rounded-2xl p-6 text-center shadow-sm">
                  <p className="font-serif text-4xl font-bold text-gray-900">3,000+</p>
                  <p className="mt-1 text-sm text-gray-600">Products Crafted</p>
                </div>
                <div className="bg-white/70 rounded-2xl p-6 text-center shadow-sm">
                  <p className="font-serif text-4xl font-bold text-gray-900">15+</p>
                  <p className="mt-1 text-sm text-gray-600">Weaving Clusters</p>
                </div>
                <div className="bg-white/70 rounded-2xl p-6 text-center shadow-sm">
                  <p className="font-serif text-4xl font-bold text-gray-900">50+</p>
                  <p className="mt-1 text-sm text-gray-600">Countries Served</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Experience Authentic Craftsmanship — final CTA */}
      <section className="py-20 bg-gray-900 text-white" id="contact">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-clay mb-4">
            Experience Authentic Craftsmanship
          </span>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
            Ready to Source {title}?
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            Join hundreds of designers and brands who trust Anuprerna for premium handloom
            fabrics. Request samples, get pricing, or discuss custom options with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@anuprerna.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-clay text-white rounded-full font-medium hover:bg-clay/80 transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">mail</span>
              hello@anuprerna.com
            </a>
            <a
              href="https://wa.me/918653403212"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">chat</span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
