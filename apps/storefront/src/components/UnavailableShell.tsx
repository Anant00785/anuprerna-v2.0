// UnavailableShell — a graceful 200 page rendered when the upstream Loom detail
// endpoint fails for a slug that IS a real, sitemap-listed (ranking) URL. Live
// (an Angular SPA) returns a 200 HTML shell in exactly this situation; the demo
// must do the same so no ranking URL 404s at SEO cutover. We never fabricate
// product/story data — we show a clear "temporarily unavailable" state with a
// human-readable title derived from the slug, and links back into the catalogue.
//
// Also reused (message + relatedProducts props) for the DISABLED-product soft-
// deny case: same shell, a friendlier "no longer available" message, and a
// reused RelatedProducts grid of similar items from the same category so the
// visitor isn't dead-ended -- see app/product/[category]/[slug]/page.tsx.
import Link from 'next/link';
import type { CatalogueProduct } from '@/components/catalogue/types';
import RelatedProducts from '@/components/product/RelatedProducts';
import Link from 'next/link';

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UnavailableShell({
  slug,
  backHref,
  backLabel,
  message,
  relatedProducts,
}: {
  slug: string;
  backHref: string;
  backLabel: string;
  /** Overrides the default "temporarily unavailable" copy (e.g. disabled-product case). */
  message?: string;
  /** Optional "You May Also Like" grid -- omitted (default) preserves prior behaviour exactly. */
  relatedProducts?: CatalogueProduct[];
}) {
  return (
    <main className='min-h-screen bg-white'>
      <div className='border-b border-sand'>
        <div className='mx-auto max-w-screen-xl px-4 py-3 text-xs text-black/50 flex items-center gap-1.5'>
          <Link href='/' className='hover:text-clay transition-colors'>Home</Link>
          <span className='material-symbols-outlined text-[12px]'>chevron_right</span>
          <Link href={backHref} className='hover:text-clay transition-colors'>{backLabel}</Link>
        </div>
      </div>
      <div className='mx-auto max-w-screen-xl px-4 py-20 text-center'>
        <h1 className='text-2xl lg:text-3xl font-medium text-black mb-3'>{titleFromSlug(slug)}</h1>
        <p className='text-black/60 max-w-md mx-auto mb-8'>
          {message ?? 'This page is temporarily unavailable. Please explore our collection or check back shortly.'}
        </p>
        <Link
          href={backHref}
          className='inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white'
          style={{ background: '#8E7862' }}
        >
          {backLabel}
        </Link>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className='mt-16 text-left'>
            <RelatedProducts products={relatedProducts} title='You May Also Like' />
          </div>
        )}
      </div>
    </main>
  );
}
