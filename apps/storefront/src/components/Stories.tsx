// Stories — four editorial sections matching the live anuprerna.com home page.
// Section layout (from Angular source, home-blog-view*.component.ts):
//   1. All Crafts     (home-blog-view)      — story IDs 9149,14799,16676   + products JKD1000003,SAK0960002
//   2. Collaborations (home-blog-view-2)    — story IDs 273394,54087       + products RKA230041210014,CHA230010750008,WWS250221000351,WCS250131000327
//   3. Clusters       (home-blog-view-3)    — story IDs 1832,8392,8700     + products JPD1000369,SAK096002A
//   4. All Stories    (home-all-stories)    — blog-content-list/customer (208 items, show first 4)
// Data fetched server-side via Loom APIs (identical endpoints the Angular app uses).

import Image from 'next/image';
import Link from 'next/link';
import { loomGet } from '@/lib/loom/client';

// --------------- Loom types -----------------------------------------------
export interface StoryItem {
  id: number;
  title: string;
  description: string;
  slug: string;
  bannerImageDesktop: string;
  bannerImageMobile: string;
}
interface StoryListResponse { storyContentList?: StoryItem[]; success?: boolean; }

export interface ProductItem {
  id?: number;
  productId?: number;
  name: string;
  heroImage: string;
  productGroup?: string;
  slug?: string;
}
interface ProductListResponse { productPreviewList?: ProductItem[]; entity?: ProductItem[]; }

interface BlogItem {
  id: number;
  title: string;
  description: string;
  slug: string;
  bannerImageDesktop: string;
  bannerImageMobile: string;
}
interface BlogListResponse { blogContentList?: BlogItem[]; success?: boolean; }

// --------------- Shared IDs (single source of truth) ----------------------
// The Collaborations set is ALSO consumed by components/Collaborations.tsx (the
// homepage credibility band). Keep the IDs here so the two never drift apart.
export const COLLAB_STORY_IDS = '273394,54087';
export const COLLAB_PRODUCT_SKUS = 'RKA230041210014,CHA230010750008,WWS250221000351,WCS250131000327';

// --------------- Loom fetch helpers (server-only) -------------------------
export async function fetchStories(csv: string): Promise<StoryItem[]> {
  try {
    const res = await loomGet<StoryListResponse>('/get/story-content-list/csv/' + csv, { revalidate: 3600 });
    return res?.storyContentList ?? [];
  } catch { return []; }
}

export async function fetchProducts(csv: string): Promise<ProductItem[]> {
  try {
    const res = await loomGet<ProductListResponse>('/get/product-preview-list/csv/' + csv, { revalidate: 3600 });
    return res?.productPreviewList ?? res?.entity ?? [];
  } catch { return []; }
}

async function fetchBlogs(): Promise<BlogItem[]> {
  try {
    const res = await loomGet<BlogListResponse>('/get/blog-content-list/customer', { revalidate: 3600 });
    return res?.blogContentList ?? [];
  } catch { return []; }
}

// --------------- Product link (mirrors Angular HomeBlogViewService) --------
export function productLink(p: ProductItem): string {
  const group = p.productGroup === 'fabric' ? 'fabric' : 'finished';
  return `/product/${group}-product/${p.slug ?? ''}`;
}

// --------------- Story link -----------------------------------------------
export function storyLink(s: StoryItem): string {
  return `/story-details/${s.slug}/${s.id}`;
}

// --------------- Blog link ------------------------------------------------
function blogLink(b: BlogItem): string {
  return `/blogs/${b.slug}/${b.id}`;
}

// ---- Arrow SVG (white) ---------------------------------------------------
function Arrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF">
      <path d="M0 0h24v24H0V0z" fill="none"/>
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
    </svg>
  );
}

// ---- Shared blog-image card overlay (story/blog banner card) -------------
function BannerCard({ href, src, alt, title, description, cta }: {
  href: string; src: string; alt: string; title: string; description: string; cta: string;
}) {
  // Strip HTML tags from description
  const plain = description.replace(/<[^>]+>/g, '').slice(0, 250);
  return (
    <Link href={href} className="fb-blog-container rounded-3xl relative overflow-hidden block group">
      <div className="relative w-full" style={{minHeight: '400px'}}>
        <Image
          src={src}
          alt={alt}
          fill
          className="fb-blog-image object-cover object-top transition duration-700 group-hover:scale-110"
          sizes="(max-width:1024px) 90vw, 40vw"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/25 z-[1]" />
        <div className="fb-blog-content absolute bottom-10 left-0 w-full pl-6 z-[2]">
          <h3 className="text-xl font-medium text-white w-[90%]">{title}</h3>
          {plain && <p className="text-sm text-white w-[90%] mt-2 line-clamp-3">{plain}</p>}
          <div className="flex items-center gap-3 font-medium text-white py-2">
            <span>{cta}</span>
            <Arrow />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---- Product thumbnail card ----------------------------------------------
function ProductCard({ href, src, name }: { href: string; src: string; name: string }) {
  const label = name.toLowerCase().slice(0, 20);
  return (
    <Link href={href} className="fb-fp-card flex flex-col justify-center items-center relative rounded-2xl overflow-hidden group block">
      <div className="relative w-full" style={{aspectRatio: '330/400'}}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover object-top"
          sizes="(max-width:1024px) 45vw, 20vw"
        />
        <div className="w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-2 py-1.5 absolute bottom-5 left-1/2 -translate-x-1/2 z-[2]">
          <p className="text-white text-xs sm:text-sm font-semibold capitalize">{label}</p>
          <button className="rounded-xl text-white bg-[#6c5b48] px-2.5 py-1 text-xs">View</button>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// SECTION 1: All Crafts (home-blog-view layout: grid-1 + grid-2)
// grid-1: [heading col 0.6fr] [story0 1.6fr] [story1 1.1fr]
// grid-2: [story2 1fr] [product grid 2×2 1fr]
// =============================================================================
async function CraftsSection({ stories, products }: { stories: StoryItem[]; products: ProductItem[] }) {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col justify-between items-center">
        {/* Grid 1 */}
        <div className="w-full grid lg:mt-5 gap-[15px]" style={{gridTemplateColumns: '0.6fr 1.6fr 1.1fr'}}>
          <div className="w-full flex flex-col justify-end pb-4">
            <h2 className="text-5xl lg:text-6xl font-light">All</h2>
            <h2 className="text-6xl lg:text-7xl text-[#7D5B20] font-medium">Crafts</h2>
            <Link href="/stories" className="text-xl py-2 fb_animate_icon_button">
              <i className="fb_animate"><b/><span/></i> Discover More
            </Link>
          </div>
          {stories[0] && (
            <BannerCard href={storyLink(stories[0])} src={stories[0].bannerImageDesktop} alt={stories[0].title}
              title={stories[0].title} description={stories[0].description} cta="Learn More" />
          )}
          {stories[1] && (
            <BannerCard href={storyLink(stories[1])} src={stories[1].bannerImageDesktop} alt={stories[1].title}
              title={stories[1].title} description={stories[1].description} cta="Learn More" />
          )}
        </div>
        {/* Grid 2 */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 lg:mt-5 gap-[15px]">
          {stories[2] && (
            <BannerCard href={storyLink(stories[2])} src={stories[2].bannerImageDesktop} alt={stories[2].title}
              title={stories[2].title} description={stories[2].description} cta="Learn More" />
          )}
          <div className="grid grid-cols-2 gap-[10px]">
            {products.slice(0, 4).map(p => (
              <ProductCard key={p.id ?? p.productId ?? p.slug} href={productLink(p)} src={p.heroImage} name={p.name} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// SECTION 2: Collaborations (home-blog-view-2 layout: grid-3 + product row)
// grid-3: [story0 1.5fr] [story1 1.1fr] [product0 0.7fr]
// row: [heading] [product1] [product2] [product3]
// =============================================================================
async function CollaborationsSection({ stories, products }: { stories: StoryItem[]; products: ProductItem[] }) {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col justify-between items-center">
        {/* Grid 3 */}
        <div className="w-full grid lg:mt-5 gap-[15px]" style={{gridTemplateColumns: '1.5fr 1.1fr 0.7fr'}}>
          {stories[0] && (
            <BannerCard href={storyLink(stories[0])} src={stories[0].bannerImageDesktop} alt={stories[0].title}
              title={stories[0].title} description={stories[0].description} cta="Learn More" />
          )}
          {stories[1] && (
            <BannerCard href={storyLink(stories[1])} src={stories[1].bannerImageDesktop} alt={stories[1].title}
              title={stories[1].title} description={stories[1].description} cta="Learn More" />
          )}
          {products[0] && (
            <ProductCard href={productLink(products[0])} src={products[0].heroImage} name={products[0].name} />
          )}
        </div>
        {/* Product row with heading */}
        <div className="w-full grid grid-cols-1 lg:mt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-[10px]">
            <div className="w-full mt-5 flex flex-col justify-end pb-4">
              <h2 className="text-5xl lg:text-6xl font-light">All</h2>
              <h2 className="text-4xl lg:text-5xl text-[#7D5B20] font-medium">Collaborations</h2>
              <Link href="/stories?category=collaborations" className="text-xl py-2 fb_animate_icon_button">
                <i className="fb_animate"><b/><span/></i> Discover More
              </Link>
            </div>
            {products.slice(1, 4).map(p => (
              <ProductCard key={p.id ?? p.productId ?? p.slug} href={productLink(p)} src={p.heroImage} name={p.name} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// SECTION 3: Clusters (home-blog-view-3 layout: grid-1 + grid-2) — same layout as Crafts
// =============================================================================
async function ClustersSection({ stories, products }: { stories: StoryItem[]; products: ProductItem[] }) {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col justify-between items-center">
        {/* Grid 1 */}
        <div className="w-full grid lg:mt-5 gap-[15px]" style={{gridTemplateColumns: '0.6fr 1.6fr 1.1fr'}}>
          <div className="w-full flex flex-col justify-end pb-4">
            <h2 className="text-5xl lg:text-6xl font-light">All</h2>
            <h2 className="text-6xl lg:text-7xl text-[#7D5B20] font-medium">Clusters</h2>
            <Link href="/stories" className="text-xl py-2 fb_animate_icon_button">
              <i className="fb_animate"><b/><span/></i> Discover More
            </Link>
          </div>
          {stories[0] && (
            <BannerCard href={storyLink(stories[0])} src={stories[0].bannerImageDesktop} alt={stories[0].title}
              title={stories[0].title} description={stories[0].description} cta="Learn More" />
          )}
          {stories[1] && (
            <BannerCard href={storyLink(stories[1])} src={stories[1].bannerImageDesktop} alt={stories[1].title}
              title={stories[1].title} description={stories[1].description} cta="Learn More" />
          )}
        </div>
        {/* Grid 2 */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 lg:mt-5 gap-[15px]">
          {stories[2] && (
            <BannerCard href={storyLink(stories[2])} src={stories[2].bannerImageDesktop} alt={stories[2].title}
              title={stories[2].title} description={stories[2].description} cta="Learn More" />
          )}
          <div className="grid grid-cols-2 gap-[10px]">
            {products.slice(0, 4).map(p => (
              <ProductCard key={p.id ?? p.productId ?? p.slug} href={productLink(p)} src={p.heroImage} name={p.name} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// SECTION 4: All Stories — blog cards gallery (home-all-stories layout)
// Horizontal accordion of blog cards (simplified for Next.js: hover expands via CSS)
// =============================================================================
function AllStoriesSection({ blogs }: { blogs: BlogItem[] }) {
  const preview = blogs.slice(0, 4);
  return (
    <section className="fb-home-stories-new w-full flex justify-center items-center py-10">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col lg:flex-row justify-between items-center gap-8">
        {/* Copy col */}
        <div className="lg:flex-[30%]">
          <h2 className="text-5xl lg:text-6xl font-light">All</h2>
          <h2 className="text-6xl lg:text-7xl text-[#7D5B20] font-medium">Stories</h2>
          <p className="text-2xl my-2">About <span className="text-[#9c8a6c]">People</span>, Processes and Products</p>
          <Link href="/blogs" className="text-3xl py-2 fb_animate_icon_button">
            <i className="fb_animate"><b/><span/></i> Discover More
          </Link>
        </div>
        {/* Blog card gallery */}
        <div className="fb_story_gallery flex-1 lg:flex-[70%] h-[420px] lg:h-[480px]">
          {preview.map((b, i) => (
            <Link key={b.id} href={blogLink(b)}
              className={`fb_story_container${i === 0 ? ' fb_content_hover' : ''} group`}>
              <span className="material-symbols-outlined sym-top text-white z-[3] relative">auto_stories</span>
              <div className="fb_story_content">
                <h3 className="fb_story_title">{b.title}</h3>
                <div className="text-sm py-2 fb_story_button flex items-center gap-3">
                  <button>Read More About This Blog</button>
                  <Arrow />
                </div>
              </div>
              <Image
                src={b.bannerImageDesktop}
                alt={b.title}
                fill
                className="object-cover object-left"
                sizes="(max-width:1024px) 90vw, 25vw"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// Top-level async server component — fetches all data in parallel
// =============================================================================
export default async function Stories() {
  const [
    craftsStories, craftsProducts,
    collabStories, collabProducts,
    clusterStories, clusterProducts,
    blogs,
  ] = await Promise.all([
    fetchStories('9149,14799,16676'),
    fetchProducts('JKD1000003,SAK0960002'),
    fetchStories(COLLAB_STORY_IDS),
    fetchProducts(COLLAB_PRODUCT_SKUS),
    fetchStories('1832,8392,8700'),
    fetchProducts('JPD1000369,SAK096002A'),
    fetchBlogs(),
  ]);

  return (
    <>
      <CraftsSection stories={craftsStories} products={craftsProducts} />
      <CollaborationsSection stories={collabStories} products={collabProducts} />
      <ClustersSection stories={clusterStories} products={clusterProducts} />
      <AllStoriesSection blogs={blogs} />
    </>
  );
}
