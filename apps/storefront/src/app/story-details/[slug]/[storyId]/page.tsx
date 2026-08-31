import UnavailableShell from '@/components/UnavailableShell';
import {
  getStoryDetail,
  getStoryOrBlogBySlug,
  getStoryProductPreviews,
  getStoryRecommendedList,
} from '@/components/content-detail/loom';
import ArticleMeta from '@/components/content-detail/ArticleMeta';
import ContentBody from '@/components/content-detail/ContentBody';
import FaqAccordion from '@/components/content-detail/FaqAccordion';
import RelatedGrid from '@/components/content-detail/RelatedGrid';
import StoryProductPreviews from '@/components/content-detail/StoryProductPreviews';
import TableOfContents from '@/components/content-detail/TableOfContents';
import MobileOnThisPage from '@/components/content-detail/MobileOnThisPage';
import StoryRightRail from '@/components/content-detail/StoryRightRail';
import ContentBreadcrumb from '@/components/content-detail/ContentBreadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import type { Metadata } from 'next';
import { absUrl, robotsMeta, metaDescription } from '@/lib/seo/config';

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string; storyId: string }>;
}

// robots flips on SEO_MODE; canonical/OG anchor to SITE_URL, never vercel.app.
// Resolves the same way as the page (slug first, id fallback); the Loom fetches
// are Next-fetch cached so this dedupes with the page render.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, storyId } = await params;
  const story = (await getStoryOrBlogBySlug(slug)) ?? (await getStoryDetail(storyId));
  if (!story) return { title: 'Story | Anuprerna', robots: robotsMeta() };
  const title = story.metaTitle?.trim() || story.title;
  const description =
    story.metaDescription?.trim() || metaDescription(story.description) || undefined;
  const path = '/story-details/' + (story.slug || slug) + '/' + (story.id ?? storyId);
  const image = story.bannerImageDesktop || undefined;
  return {
    title,
    description,
    robots: robotsMeta(),
    alternates: { canonical: absUrl(path) },
    openGraph: {
      type: 'article',
      url: absUrl(path),
      title,
      description,
      siteName: 'Anuprerna',
      images: image ? [{ url: image, alt: story.bannerImageAlt || title }] : undefined,
    },
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const { slug, storyId } = await params;

  // Resolve by SLUG (stable). Fall back to the numeric id only if the slug lookup
  // fails (covers any edge case). The legacy id in the URL is not API-resolvable.
  const story = (await getStoryOrBlogBySlug(slug)) ?? (await getStoryDetail(storyId));
  // Upstream story/blog endpoint sometimes fails for a slug that IS a real,
  // sitemap-listed (ranking) URL. Live (an SPA) serves a 200 shell; match it so
  // the ranking page never 404s at SEO cutover.
  if (!story) {
    return <UnavailableShell slug={slug} backHref='/stories' backLabel='Stories' />;
  }

  // Dependent calls need the CURRENT id from the resolved story, not the URL id.
  const realId = story.id ?? storyId;
  const [products, recommended] = await Promise.all([
    getStoryProductPreviews(realId),
    getStoryRecommendedList(realId),
  ]);

  // "More Stories" grid at the bottom — prefer the rich recommended list, fall back to prev/next.
  const moreItems = recommended.length > 0
    ? recommended.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        bannerImageDesktop: r.bannerImageDesktop,
        timeOfCreation: r.lastUpdateTime || r.timeOfCreation,
        category: r.storyContentCategory?.name,
      }))
    : [story.previousStoryDetails, story.nextStoryDetails ?? null].filter(
        (item): item is NonNullable<typeof item> => item != null,
      );

  // --- Structured data (renders in BOTH modes; harmless while noindexed) -----
  const path = '/story-details/' + (story.slug || slug) + '/' + realId;
  const hasFaq = !!(story.faq && story.faq.faqQuestionList?.length > 0);
  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    ...(story.bannerImageDesktop ? { image: [story.bannerImageDesktop] } : {}),
    datePublished: new Date(story.timeOfCreation).toISOString(),
    dateModified: new Date(story.lastUpdateTime || story.timeOfCreation).toISOString(),
    // Real author when the CMS record has one; otherwise the publishing
    // Organization is the truthful attribution — never invent a person.
    author: story.author?.name
      ? { '@type': 'Person', name: story.author.name }
      : { '@type': 'Organization', name: 'Anuprerna' },
    publisher: {
      '@type': 'Organization',
      name: 'Anuprerna',
      logo: {
        '@type': 'ImageObject',
        url: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo_black.svg',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(path) },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Stories', item: absUrl('/stories') },
      { '@type': 'ListItem', position: 3, name: story.title, item: absUrl(path) },
    ],
  };
  // FAQPage schema — the story CMS pipeline attaches real FAQ Q&A (story.faq)
  // that renders visually via FaqAccordion below, but no structured-data
  // equivalent was ever emitted. Fix: mirror the rendered Q&A into FAQPage.
  const faqJsonLd = hasFaq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: story.faq!.faqQuestionList.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      }
    : null;

  return (
    <main className='bg-white min-h-screen'>
      <JsonLd
        data={
          faqJsonLd
            ? [articleJsonLd, breadcrumbJsonLd, faqJsonLd]
            : [articleJsonLd, breadcrumbJsonLd]
        }
      />
      {/* Mobile floating "On this Page" dropdown */}
      <MobileOnThisPage sections={story.storyContentSectionList} />

      <div className='mx-auto max-w-screen-xl px-4 lg:px-8 py-10 sm:py-14'>
        {/* Breadcrumb — Home / Stories / <title> */}
        <ContentBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Stories', href: '/stories' },
            { label: story.title },
          ]}
        />

        {/* Page title + meta (above 3-col layout) */}
        <div className='mb-8 max-w-3xl'>
          {story.storyContentCategory?.name && (
            <p className='text-[10px] uppercase tracking-widest text-black/50 mb-2'>
              {story.storyContentCategory.name}
            </p>
          )}
          <h1 className='text-3xl lg:text-4xl font-bold text-black mb-4'>
            {story.title}
          </h1>
          <ArticleMeta
            category={story.storyContentCategory?.name}
            timeOfCreation={story.timeOfCreation}
            lastUpdateTime={story.lastUpdateTime}
            readingTime={story.readingTime}
          />
        </div>

        {/* 3-column layout: TOC | Article | Right rail */}
        <div className='flex gap-8 xl:gap-12 items-start'>
          {/* Left: TOC (~220px) */}
          <div className='hidden lg:block w-52 flex-shrink-0'>
            <TableOfContents sections={story.storyContentSectionList} />
          </div>

          {/* Center: article body */}
          <div className='flex-1 min-w-0 max-w-3xl'>
            <ContentBody
              description={story.description}
              sections={story.storyContentSectionList}
              imageStyle='story'
            />

            {/* Story-specific product previews */}
            {products.length > 0 && (
              <StoryProductPreviews products={products} />
            )}

            {/* FAQ */}
            {story.faq && story.faq.faqQuestionList?.length > 0 && (
              <FaqAccordion
                heading={story.faq.heading}
                questions={story.faq.faqQuestionList}
              />
            )}

            {/* More Stories (recommended) */}
            {moreItems.length > 0 && (
              <RelatedGrid items={moreItems} variant='story' />
            )}
          </div>

          {/* Right: sidebar rail — About Us + Related Stories + Discover Our Impact */}
          <aside className='hidden xl:block w-60 flex-shrink-0 sticky top-20 self-start'>
            <StoryRightRail
              recommended={recommended.slice(0, 5)}
              previousStory={story.previousStoryDetails}
              nextStory={story.nextStoryDetails ?? null}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
