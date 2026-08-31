// Hero — buyer-mode-aware B2B-first restructure (data-justified: live home scroll-depth 42.9%, 1.22 pages/session).
// B2C mode: retail-forward subcopy, "Shop the Collection" CTA, no Wholesale link.
// B2B / Guest: current wholesale content (swatch kit, MOQ copy, Wholesale link).
// First render uses the 'guest' default (matches ISR-cached HTML) — a brief guest→mode
// reflow on load is acceptable for v1 (same pattern as BuyerModeHome section reorder).
'use client';
import Image from 'next/image';
import Link from 'next/link';
import LazyHeroVideo from './LazyHeroVideo';
import VideoModal from './VideoModal';
import { useBuyerMode } from './BuyerModeProvider';

const CDN = '/media/';
const HERO_POSTER = CDN + 'home/hero/video-thumbnails.png';
// Big ambient clip — loaded lazily after window.onload + idle + in-view (LazyHeroVideo handles this)
const HERO_VIDEO  = CDN + 'home/bts.mp4';
const HERO_TEXT   = 'Combining Technology with Traditions';
// Swatch-kit route reused verbatim from the mega-menu primary CTA (SiteHeader 'Order a SwatchKit').
const SWATCH_KIT  = '/products/fabric?category=swatchkit';

/**
 * MOSAIC — right 3 tiles, each now a click-to-play video thumbnail.
 * Source of truth: Angular home-caraousel.component.ts
 *   CDN_HOME = /media/home/
 *   cdnVideo = CDN_HOME  (videos at CDN_HOME root, NOT /hero/)
 *   posters  = CDN_HOME + 'hero/' + filename
 */
const MOSAIC = [
  {
    img:   CDN + 'home/hero/home-hero-3.png',
    video: CDN + 'home/stitching.mp4',
    alt:   'Empowering 500+ artisans from East India',
    label: 'Empowering 500+ Artisans from East India',
  },
  {
    img:   CDN + 'home/hero/home-hero-2.png',
    video: CDN + 'home/dyeing.mp4',
    alt:   'Naturally dyed, ethically sourced textiles',
    label: 'Naturally Dyed, Ethically Sourced',
  },
  {
    img:   CDN + 'home/hero/home-hero-4.png',
    video: CDN + 'home/bts.mp4',
    alt:   'Custom-crafted apparel, home & accessories',
    label: 'From Fabrics, Apparel, Homeware & More',
  },
];

export default function Hero() {
  const { mode } = useBuyerMode();
  const isB2C = mode === 'b2c';

  return (
    <section className='w-full flex flex-col justify-center items-center'>
      <div className='container mx-auto max-w-screen-xl px-4 flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-8 mb-8 lg:mb-9 relative py-6 lg:py-10'>
        {/* Copy column — value + dominant CTA + proof, all front-loaded */}
        <div className='mb-5 lg:my-0 lg:flex-[42%] mx-2 lg:mx-0'>
          <h1 className='text-3xl sm:text-5xl text-[#7D5B20] font-medium mb-3 md:mb-5'>
            <Link href='/products/fabric'>Handwoven Artisanal</Link>{' '}
            <span className='text-black'>Textiles</span> &amp; <span className='text-black'>Products</span>
          </h1>

          {/* Subcopy — mode-aware: B2C=retail framing; B2B/Guest=wholesale framing */}
          {isB2C ? (
            <>
              <p className='text-base md:text-xl my-1.5'>
                <span className='text-[#7D5B20] font-semibold'>Finished Apparel</span>, <span className='text-[#7D5B20]'>Home</span> &amp; <span className='text-[#7D5B20]'>Accessories</span> handwoven by 500+ artisans
              </p>
              <p className='text-base md:text-xl my-1.5'>
                <span className='text-[#7D5B20]'>100% natural fibres</span> &amp; natural dyes &mdash; ethically crafted in East India
              </p>
            </>
          ) : (
            <>
              <p className='text-base md:text-xl my-1.5'><span className='text-[#7D5B20] font-semibold'>Custom handwoven fabric</span> at low MOQ &mdash; <span className='text-[#7D5B20]'>100% natural fibres</span></p>
              <p className='text-base md:text-xl my-1.5'>Seamless manufacturing of <span className='text-[#7D5B20]'>Apparel</span>, <span className='text-[#7D5B20]'>Home</span> &amp; <span className='text-[#7D5B20]'>Accessories</span></p>
            </>
          )}

          {/* Proof row — REAL: 500+ artisans + traceability via ArtisanFlow — same in all modes */}
          <Link href='/artisanflow' className='group inline-flex items-center gap-3 mt-3 mb-1 rounded-lg border border-[#e3dcc9] bg-[#fffcf7] px-3 py-2 hover:border-[#8E7862] hover:shadow-sm transition'>
            <span className='flex -space-x-2'>
              {MOSAIC.map((m, i) => (
                <span key={i} className='relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-[#fffcf7]'>
                  <Image src={m.img} alt={m.alt} fill sizes='32px' unoptimized className='object-cover' />
                </span>
              ))}
            </span>
            <span className='text-xs sm:text-sm text-gray-700 leading-tight'>
              Woven by <span className='font-semibold text-[#7D5B20]'>500+ artisans</span> in East India.{' '}
              <span className='underline decoration-[#c9bfa6] group-hover:decoration-[#7D5B20]'>Traceable end-to-end with ArtisanFlow &rarr;</span>
            </span>
          </Link>

          {/* Primary CTA — mode-aware: B2C="Shop the Collection"; B2B/Guest="Order a Swatch Kit" */}
          <div className='mt-4'>
            {isB2C ? (
              <Link href='/products/finished'
                 className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7D5B20] hover:bg-[#6c5b48] text-white font-semibold rounded-lg py-3 px-7 shadow-md hover:shadow-lg transition text-base sm:text-xl'>
                <span className='material-symbols-outlined text-[20px]'>shopping_bag</span>
                Shop the Collection
              </Link>
            ) : (
              <Link href={SWATCH_KIT}
                 className='w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7D5B20] hover:bg-[#6c5b48] text-white font-semibold rounded-lg py-3 px-7 shadow-md hover:shadow-lg transition text-base sm:text-xl'>
                <span className='material-symbols-outlined text-[20px]'>local_mall</span>
                Order a Swatch Kit
              </Link>
            )}
          </div>

          {/* Secondary links — mode-aware: Wholesale link removed in B2C */}
          <div className='mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm sm:text-base'>
            <Link href='/products/fabric' className='group text-[#7D5B20] hover:text-[#6c5b48] underline-offset-4 hover:underline inline-flex items-center gap-1.5'>
              <i className='fb_animate'><b/><span/></i> Fabrics
            </Link>
            <Link href='/products/finished' className='group text-[#7D5B20] hover:text-[#6c5b48] underline-offset-4 hover:underline inline-flex items-center gap-1.5'>
              <i className='fb_animate'><b/><span/></i> Finished Goods
            </Link>
            {isB2C ? (
              <Link href='/wholesale-partner-program' className='text-gray-600 hover:text-[#7D5B20] underline-offset-4 hover:underline'>
                Talk to us
              </Link>
            ) : (
              <Link href='/wholesale-partner-program' className='text-gray-600 hover:text-[#7D5B20] underline-offset-4 hover:underline'>
                Talk to us &middot; Wholesale
              </Link>
            )}
          </div>
        </div>

        {/* Hero gallery (desktop): video panel + right mosaic — unchanged */}
        <div className='hidden lg:flex lg:flex-[58%] h-[400px] relative gap-2'>
          {/* Big left panel: lazy ambient video loop. Poster = LCP (no extra load).
              Video loads only after idle + in-view. Click still navigates to /products/fabric. */}
          <Link href='/products/fabric'
             className='relative flex-[1.15] h-full rounded-2xl overflow-hidden group'>
            <LazyHeroVideo
              src={HERO_VIDEO}
              poster={HERO_POSTER}
              className='absolute inset-0 w-full h-full object-cover'
            />
            {/* Overlay: gradient + movie icon + text */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent z-[1]' />
            <span className='material-symbols-outlined absolute top-4 left-3 text-white z-[2]'>movie</span>
            <div className='absolute bottom-5 left-0 w-full px-5 z-[2] flex items-center gap-1.5'>
              <span className='material-symbols-outlined text-white text-[18px]'>movie</span>
              <h3 className='text-white text-base font-medium drop-shadow'>{HERO_TEXT}</h3>
            </div>
          </Link>
          {/* Right mosaic — click-to-play VideoModal tiles (poster images only until clicked) */}
          <div className='flex-1 h-full grid grid-rows-3 gap-2'>
            {MOSAIC.map((m, i) => (
              <VideoModal
                key={i}
                videoSrc={m.video}
                poster={m.img}
                label={m.label}
                alt={m.alt}
                priority={i === 0}
              />
            ))}
          </div>
        </div>

        {/* Mobile hero — poster image (unchanged, load-light) */}
        <div className='lg:hidden w-full'>
          <div className='fb-home-hero-mobile rounded-lg m-2 overflow-hidden relative'>
            <Image
              src={HERO_POSTER}
              alt={HERO_TEXT}
              width={800}
              height={450}
              className='w-full object-cover relative z-[1]'
              priority
            />
            <div className='fb_story_content absolute bottom-4 left-1 w-full z-[2]'>
              <h3 className='fb_story_title text-sm text-center text-white'>{HERO_TEXT}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
