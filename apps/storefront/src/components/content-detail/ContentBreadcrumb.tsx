import Link from 'next/link';

// Breadcrumb for article (story / blog / CMS content) detail pages.
// Mirrors the catalogue breadcrumb pattern (Home / Section / <title>); last
// crumb is the current article and is not a link. Keeps the reader oriented in
// deep content and gives a one-click path back to the listing.
interface Crumb {
  label: string;
  href?: string;
}

export default function ContentBreadcrumb({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav aria-label='Breadcrumb' className='mb-4'>
      <ol className='flex flex-wrap items-center gap-1 text-xs text-black/50'>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label + i} className='flex items-center gap-1'>
              {item.href && !isLast ? (
                <Link href={item.href} className='hover:text-clay transition-colors'>
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-medium text-black/70 line-clamp-1 max-w-[60vw] sm:max-w-none' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <span className='text-black/25'>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
