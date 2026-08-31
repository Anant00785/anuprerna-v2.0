import { relativizeCmsHtml, relHref } from '@/lib/cms-html';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { ContentSection as ContentSectionType } from './loom';

// ---------------------------------------------------------------------------
// CMS HTML block renderer (prose-equivalent without the plugin)
// ---------------------------------------------------------------------------

function HtmlBlock({ html }: { html: string }) {
  if (!html || html.trim() === '') return null;
  return (
    <div
      className='[&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_li]:mb-1 [&_h4]:font-bold [&_h4]:text-base [&_h4]:mt-4 [&_h4]:mb-2 [&_a]:text-clay [&_a]:underline [&_a]:underline-offset-2 [&_br]:block [&_.ql-size-large]:text-lg [&_.ql-size-huge]:text-2xl text-base text-black/80'
      dangerouslySetInnerHTML={{ __html: relativizeCmsHtml(html) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Section image — story variant gets postage-stamp frame; blog/content plain
// ---------------------------------------------------------------------------

function SectionImage({
  src,
  alt,
  caption,
  imageStyle,
}: {
  src: string;
  alt?: string;
  caption?: string;
  imageStyle: 'story' | 'plain';
}) {
  if (!src) return null;

  const img = (
    <div
      className={
        imageStyle === 'story'
          ? 'relative overflow-hidden bg-sand rounded-sm border-4 border-white shadow-lg ring-1 ring-black/10'
          : 'relative overflow-hidden bg-sand'
      }
      style={{ paddingBottom: '75%' }}
    >
      <Img
        src={src}
        alt={alt ?? ''}
        fill
        sizes='(max-width:768px) 100vw, 45vw'
        className='object-cover'
      />
    </div>
  );

  return (
    <figure className='w-full'>
      {img}
      {caption && (
        <figcaption className='mt-2 text-xs text-black/50 text-center italic'>{caption}</figcaption>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------------------
// CTA button row
// ---------------------------------------------------------------------------

function CtaRow({
  name1,
  link1,
  name2,
  link2,
}: {
  name1?: string;
  link1?: string;
  name2?: string;
  link2?: string;
}) {
  if (!name1 && !name2) return null;
  return (
    <div className='flex flex-wrap gap-3 mt-5'>
      {name1 && link1 && (
        <Link
          href={relHref(link1)}
          className='inline-block px-5 py-2.5 text-sm font-medium border border-clay text-clay rounded hover:bg-clay hover:text-white transition-colors'
        >
          {name1}
        </Link>
      )}
      {name2 && link2 && (
        <Link
          href={relHref(link2)}
          className='inline-block px-5 py-2.5 text-sm font-medium border border-black/20 text-black/70 rounded hover:bg-black/5 transition-colors'
        >
          {name2}
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContentSection — switches on templateType
// ---------------------------------------------------------------------------

interface ContentSectionProps {
  section: ContentSectionType;
  sectionIndex: number;
  imageStyle: 'story' | 'plain';
}

export default function ContentSection({ section, sectionIndex, imageStyle }: ContentSectionProps) {
  const { templateType, heading, paragraph1, paragraph2, image1, image1Alt, caption1,
    ctaButtonName1, ctaLink1, ctaButtonName2, ctaLink2 } = section;

  const anchorId = 'section-' + sectionIndex;

  // Type 8: text only — full-width prose block
  if (templateType === 8) {
    return (
      <section id={anchorId} className='py-6'>
        {heading && (
          <h2 className='text-xl lg:text-2xl font-bold text-black mb-4'>{heading}</h2>
        )}
        <HtmlBlock html={paragraph1} />
        <HtmlBlock html={paragraph2} />
        <CtaRow name1={ctaButtonName1} link1={ctaLink1} name2={ctaButtonName2} link2={ctaLink2} />
      </section>
    );
  }

  // Type 9: image only — full-width feature image, no text column
  if (templateType === 9) {
    return (
      <section id={anchorId} className='py-6'>
        <SectionImage src={image1} alt={image1Alt} caption={caption1} imageStyle={imageStyle} />
      </section>
    );
  }

  // Type 1: image LEFT, text RIGHT
  // Type 2: text LEFT, image RIGHT
  if (templateType === 1 || templateType === 2) {
    const imageFirst = templateType === 1;

    const imageEl = image1 ? (
      <div className='w-full lg:w-5/12 flex-shrink-0'>
        <SectionImage src={image1} alt={image1Alt} caption={caption1} imageStyle={imageStyle} />
      </div>
    ) : null;

    const textEl = (
      <div className='w-full lg:flex-1 min-w-0'>
        {heading && (
          <h2 className='text-xl lg:text-2xl font-bold text-black mb-4'>{heading}</h2>
        )}
        <HtmlBlock html={paragraph1} />
        <HtmlBlock html={paragraph2} />
        <CtaRow name1={ctaButtonName1} link1={ctaLink1} name2={ctaButtonName2} link2={ctaLink2} />
      </div>
    );

    return (
      <section id={anchorId} className='py-6'>
        <div className='flex flex-col lg:flex-row gap-8 lg:gap-12 items-start'>
          {imageFirst ? (
            <>
              {imageEl}
              {textEl}
            </>
          ) : (
            <>
              {textEl}
              {imageEl}
            </>
          )}
        </div>
      </section>
    );
  }

  // Fallback for any other templateType (3–7, 10+): image LEFT, text RIGHT
  // (mirrors the type 1 layout above — these types only carry image1, same as
  // the explicitly-handled types, so we reuse the same SectionImage rendering.)
  const fallbackImageEl = image1 ? (
    <div className='w-full lg:w-5/12 flex-shrink-0'>
      <SectionImage src={image1} alt={image1Alt} caption={caption1} imageStyle={imageStyle} />
    </div>
  ) : null;

  return (
    <section id={anchorId} className='py-6'>
      <div className='flex flex-col lg:flex-row gap-8 lg:gap-12 items-start'>
        {fallbackImageEl}
        <div className='w-full lg:flex-1 min-w-0'>
          {heading && (
            <h2 className='text-xl lg:text-2xl font-bold text-black mb-4'>{heading}</h2>
          )}
          <HtmlBlock html={paragraph1} />
          <HtmlBlock html={paragraph2} />
          <CtaRow name1={ctaButtonName1} link1={ctaLink1} name2={ctaButtonName2} link2={ctaLink2} />
        </div>
      </div>
    </section>
  );
}
