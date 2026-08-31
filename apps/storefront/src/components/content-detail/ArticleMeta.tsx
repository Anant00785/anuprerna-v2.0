import { formatOrdinalDate } from '../content-list/formatDate';

// ---------------------------------------------------------------------------
// ArticleMeta — meta line: category, published date, last-edited date, reading time.
// Mirrors the live meta block (no author byline — the live design never shows one).
// ---------------------------------------------------------------------------

interface ArticleMetaProps {
  category?: string;
  timeOfCreation: number;
  lastUpdateTime?: number;
  readingTime?: number;
}

export default function ArticleMeta({
  category,
  timeOfCreation,
  lastUpdateTime,
  readingTime,
}: ArticleMetaProps) {
  const showLastEdited =
    lastUpdateTime != null && lastUpdateTime > 0 && lastUpdateTime !== timeOfCreation;

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/60'>
      {category && (
        <>
          <span className='uppercase tracking-widest text-[10px] text-bark font-medium'>
            {category}
          </span>
          <span className='text-black/30'>·</span>
        </>
      )}
      <span>Published on {formatOrdinalDate(timeOfCreation)}</span>
      {showLastEdited && (
        <>
          <span className='text-black/30'>·</span>
          <span>Last Edited on {formatOrdinalDate(lastUpdateTime!)}</span>
        </>
      )}
      {readingTime != null && readingTime > 0 && (
        <>
          <span className='text-black/30'>·</span>
          <span className='text-[#7d5b1f] font-medium'>{readingTime} Minute Read</span>
        </>
      )}
    </div>
  );
}
