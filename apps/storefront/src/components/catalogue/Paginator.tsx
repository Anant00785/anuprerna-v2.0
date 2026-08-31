'use client';

// PLP-08: numbered paginator — first/prev, up to 5 page numbers centred on the
// current page, next/last. Mirrors live filter-paginator (maxPagesToShow = 5).
interface PaginatorProps {
  currentPage: number; // 0-based
  totalPages: number;
  onPageChange: (page: number) => void; // emits 0-based page
}

function pageWindow(current: number, total: number, max = 5): number[] {
  const show = Math.min(max, total);
  let start = Math.max(0, current - Math.floor(show / 2));
  const end = Math.min(total - 1, start + show - 1);
  start = Math.max(0, end - show + 1);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export default function Paginator({ currentPage, totalPages, onPageChange }: PaginatorProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(currentPage, totalPages);
  const atFirst = currentPage === 0;
  const atLast = currentPage === totalPages - 1;

  const btn =
    'h-9 min-w-9 px-2 inline-flex items-center justify-center rounded border border-gray-300 text-sm text-gray-700 hover:border-clay transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <nav className='mt-10 flex items-center justify-center gap-1.5' aria-label='Pagination'>
      <button type='button' className={btn} aria-label='First page' disabled={atFirst} onClick={() => onPageChange(0)}>
        <span className='material-symbols-outlined text-[18px]'>keyboard_double_arrow_left</span>
      </button>
      <button type='button' className={btn} aria-label='Previous page' disabled={atFirst} onClick={() => onPageChange(currentPage - 1)}>
        <span className='material-symbols-outlined text-[18px]'>chevron_left</span>
      </button>

      {pages.map((p) => (
        <button
          type='button'
          key={p}
          aria-current={p === currentPage ? 'page' : undefined}
          onClick={() => onPageChange(p)}
          className={
            'h-9 min-w-9 px-2 inline-flex items-center justify-center rounded border text-sm transition-colors ' +
            (p === currentPage
              ? 'border-clay bg-clay text-white'
              : 'border-gray-300 text-gray-700 hover:border-clay')
          }
        >
          {p + 1}
        </button>
      ))}

      <button type='button' className={btn} aria-label='Next page' disabled={atLast} onClick={() => onPageChange(currentPage + 1)}>
        <span className='material-symbols-outlined text-[18px]'>chevron_right</span>
      </button>
      <button type='button' className={btn} aria-label='Last page' disabled={atLast} onClick={() => onPageChange(totalPages - 1)}>
        <span className='material-symbols-outlined text-[18px]'>keyboard_double_arrow_right</span>
      </button>
    </nav>
  );
}
