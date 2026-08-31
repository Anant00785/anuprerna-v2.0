// Collaborations — homepage CREDIBILITY band (not an editorial page).
//
// Restores the "co-created with international designers & brands" proof block the
// live anuprerna.com home page carries. Deliberately NOT components/Stories.tsx:
// Stories renders four full editorial sections (Crafts / Collaborations / Clusters /
// All Stories); the home page only needs the collaboration PROOF, compacted into a
// single band that matches ArtisanFlow / WholesalePartner's design language
// (same tokens: #7D5B20 brand brown, #8E7862 eyebrow, rounded-2xl, max-w-screen-xl).
//
// Data: the SAME Loom calls + IDs the CollaborationsSection in Stories.tsx uses —
// helpers and IDs are imported from there (single source of truth, no duplicate
// fetch logic). Links point exactly where Stories.tsx points.
//
// Server component: fetches on the server with revalidate 3600, so it composes into
// the ISR-cached home page. It is passed into the CLIENT BuyerModeHome as a slot
// from app/page.tsx — never imported into the client tree (that would force the
// fetch client-side and break the ISR cache).
//
// Vercel parity: no filesystem writes, no localhost loopback (LOOM_BASE_URL is the
// env-configured Loom base), no module-level mutable state.
import Image from 'next/image';
import Link from 'next/link';
import {
  fetchStories,
  fetchProducts,
  productLink,
  storyLink,
  COLLAB_STORY_IDS,
  COLLAB_PRODUCT_SKUS,
  type StoryItem,
  type ProductItem,
} from './Stories';
import { titleCase } from '../lib/data';

// Loom descriptions are HTML fragments with entities — flatten to one clean line.
function plainText(html: string, max = 160): string {
  const t = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
}

function StoryCard({ story }: { story: StoryItem }) {
  return (
    <Link
      href={storyLink(story)}
      className='group relative block overflow-hidden rounded-2xl border border-gray-100'>
      <div className='relative w-full h-[220px] sm:h-[260px]'>
        <Image
          src={story.bannerImageDesktop}
          alt={titleCase(story.title.trim())}
          fill
          sizes='(max-width:768px) 100vw, 48vw'
          className='object-cover object-top transition duration-700 group-hover:scale-105'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10' />
        <div className='absolute inset-x-0 bottom-0 p-5 sm:p-6'>
          <p className='text-[11px] uppercase tracking-[.2em] text-white/70 mb-1'>Designer collaboration</p>
          <h3 className='text-lg sm:text-xl font-medium text-white'>{titleCase(story.title.trim())}</h3>
          <p className='mt-1 text-sm text-white/80 leading-snug line-clamp-2'>{plainText(story.description)}</p>
          <span className='mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white'>
            Read the collaboration
            <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function CoCreatedCard({ product }: { product: ProductItem }) {
  const name = titleCase(product.name.trim());
  return (
    <Link
      href={productLink(product)}
      className='group block overflow-hidden rounded-2xl border border-gray-100 bg-white hover:border-[#c9bfa6] transition-colors'>
      <div className='relative w-full' style={{ aspectRatio: '330/400' }}>
        <Image
          src={product.heroImage}
          alt={name}
          fill
          sizes='(max-width:640px) 45vw, 22vw'
          className='object-cover object-top transition duration-700 group-hover:scale-105'
        />
      </div>
      <p className='px-3 py-3 text-xs sm:text-sm text-gray-700 leading-snug line-clamp-2'>{name}</p>
    </Link>
  );
}

export default async function Collaborations() {
  const [stories, products] = await Promise.all([
    fetchStories(COLLAB_STORY_IDS),
    fetchProducts(COLLAB_PRODUCT_SKUS),
  ]);

  // No fabricated fallback: if Loom returns nothing for these IDs the band is
  // simply not rendered rather than showing placeholder content.
  if (stories.length === 0 && products.length === 0) return null;

  return (
    <section className='w-full bg-white py-12'>
      <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>

        {/* Heading */}
        <div className='text-center mb-8'>
          <p className='text-xs sm:text-sm uppercase tracking-[.2em] text-[#8E7862] mb-2'>
            Designer &amp; brand partnerships
          </p>
          <h2 className='text-3xl sm:text-4xl font-medium text-black mb-3'>
            Co-created with <span className='text-[#7D5B20]'>international designers &amp; brands</span>
          </h2>
          <p className='text-base text-gray-600 max-w-2xl mx-auto leading-relaxed'>
            Designers and labels bring us their vision; our weaving clusters co-create it on the
            handloom — from first sample to finished production run.
          </p>
        </div>

        {/* Collaboration stories */}
        {stories.length > 0 && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8'>
            {stories.slice(0, 2).map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        )}

        {/* Co-created products */}
        {products.length > 0 && (
          <>
            <p className='text-xs sm:text-sm uppercase tracking-[.2em] text-[#8E7862] mb-4'>
              Pieces co-created with our partners
            </p>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8'>
              {products.slice(0, 4).map(p => (
                <CoCreatedCard key={p.id ?? p.productId ?? p.slug} product={p} />
              ))}
            </div>
          </>
        )}

        {/* Single CTA */}
        <div className='text-center'>
          <Link
            href='/stories?category=collaborations'
            className='inline-flex items-center gap-2 text-sm sm:text-base text-[#7D5B20] font-semibold hover:underline underline-offset-4'>
            See all collaborations
            <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
