import Img from '@/components/ui/Img';

// ---------------------------------------------------------------------------
// ArticleHero
//
// Three modes controlled by the `variant` prop:
//   - 'story': no full-bleed hero — returns null (story starts with TOC + body)
//   - 'blog':  no full-bleed hero — returns null (blog H1 starts immediately)
//   - 'content': full-bleed dark hero image, with an optional parallax text
//                overlay, then the H1 appears below it on white background
// ---------------------------------------------------------------------------

interface ArticleHeroProps {
  variant: 'story' | 'blog' | 'content';
  title: string;
  bannerImageDesktop: string;
  bannerImageMobile?: string;
  bannerImageAlt?: string;
  /** Optional text overlay on top of content hero image */
  parallaxText?: string;
}

export default function ArticleHero({
  variant,
  title,
  bannerImageDesktop,
  bannerImageMobile,
  bannerImageAlt,
  parallaxText,
}: ArticleHeroProps) {
  // Stories and blogs have no full-bleed hero — the page starts with the 3-column layout
  if (variant === 'story' || variant === 'blog') return null;

  // CMS content pages get a full-bleed dark hero + H1 below on white
  return (
    <div className='w-full'>
      {/* Full-bleed banner image */}
      <div className='relative w-full overflow-hidden bg-sand' style={{ paddingBottom: '40%' }}>
        <Img
          src={bannerImageDesktop}
          alt={bannerImageAlt ?? title}
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
        {/* Dark overlay for readability */}
        <div className='absolute inset-0 bg-black/30' />
        {/* Parallax/overlay text */}
        {parallaxText && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <p className='text-white/90 text-2xl sm:text-4xl font-light tracking-widest uppercase text-center px-4'>
              {parallaxText}
            </p>
          </div>
        )}
      </div>
      {/* H1 below the hero on white */}
      <div className='mx-auto max-w-screen-xl px-4 lg:px-8 py-8'>
        <h1 className='text-3xl lg:text-4xl font-bold text-black'>{title}</h1>
      </div>
    </div>
  );
}
