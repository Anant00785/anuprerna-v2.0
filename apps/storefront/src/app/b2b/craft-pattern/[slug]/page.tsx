import { searchProducts, slugToTitle } from '@/components/seo-landing/loom';
import B2bLandingPage from '@/components/seo-landing/B2bLandingPage';
import { buildB2bFaqs } from '@/components/seo-landing/b2bFaqs';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl, productPath } from '@/lib/seo/config';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${title} | Wholesale Handloom Fabric — Anuprerna`,
    description: `Source premium handcrafted ${title.toLowerCase()} in bulk. Flexible MOQs, custom orders, and global delivery from Anuprerna artisan suppliers.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const keyword = slug.replace(/-/g, ' ');
  const products = await searchProducts(keyword);

  // --- Structured data (renders in BOTH modes; harmless while noindexed) ---
  // CollectionPage + ItemList mirror the real "Explore Collection" grid
  // (ProductGrid renders every item in `products`, unsliced); BreadcrumbList
  // reflects the true /b2b/craft-pattern/<slug> hierarchy (middle level has no
  // standalone listing page, so it is name-only, no invented href);
  // FAQPage mirrors the accordion's real per-page Q&A — buildB2bFaqs is the
  // SAME function the visual FaqAccordion calls, so this can never drift
  // from what the accordion genuinely renders on click.
  const title = slugToTitle(slug);
  const path = `/b2b/craft-pattern/${slug}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Craft Pattern' },
      { '@type': 'ListItem', position: 3, name: title },
    ],
  };
  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${title} — Wholesale Handloom Fabric`,
    url: absUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absUrl(productPath(p.productGroup, p.slug)),
        name: p.name,
      })),
    },
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: buildB2bFaqs(title).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <JsonLd data={[collectionPageJsonLd, breadcrumbJsonLd, faqJsonLd]} />
      <B2bLandingPage slug={slug} variant="craft-pattern" products={products} />
    </>
  );
}
