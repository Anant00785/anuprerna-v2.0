import { relativizeCmsHtml } from '@/lib/cms-html';
import type { ContentSection as ContentSectionType } from './loom';
import ContentSection from './ContentSection';

// ---------------------------------------------------------------------------
// HtmlBlock (duplicated locally so ContentBody is standalone)
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
// ContentBody — assembles description intro + all sections
// ---------------------------------------------------------------------------

interface ContentBodyProps {
  description?: string; // HTML intro paragraph(s)
  sections: ContentSectionType[];
  /** 'story' = postage-stamp frames; 'plain' = plain rect images */
  imageStyle: 'story' | 'plain';
}

export default function ContentBody({ description, sections, imageStyle }: ContentBodyProps) {
  // Sort sections by sortOrder ascending
  // Same guard as TableOfContents / MobileOnThisPage: blogContentSectionList is
  // absent on some content records and `[...undefined]` throws "is not iterable".
  const sorted = [...(sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className='min-w-0'>
      {/* Lead description (HTML) */}
      {description && (
        <div className='mb-8'>
          <HtmlBlock html={description} />
        </div>
      )}

      {/* Content sections */}
      <div className='divide-y divide-black/5'>
        {sorted.map((section, idx) => (
          <ContentSection
            key={section.id}
            section={section}
            sectionIndex={idx}
            imageStyle={imageStyle}
          />
        ))}
      </div>
    </div>
  );
}
