import { getBlogDetail } from '@/components/content-detail/loom';
import ArticleHero from '@/components/content-detail/ArticleHero';
import ArticleMeta from '@/components/content-detail/ArticleMeta';
import ContentBody from '@/components/content-detail/ContentBody';
import FaqAccordion from '@/components/content-detail/FaqAccordion';
import RelatedGrid from '@/components/content-detail/RelatedGrid';
import TableOfContents from '@/components/content-detail/TableOfContents';
import MobileOnThisPage from '@/components/content-detail/MobileOnThisPage';
import UnavailableShell from '@/components/UnavailableShell';
import ContentBreadcrumb from '@/components/content-detail/ContentBreadcrumb';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl } from '@/lib/seo/config';

export const revalidate = 600;

// Editorial CMS content types -- genuine authored articles with a real
// title/date/author (about-us, care-guide). "wholesale" (service/lead-gen
// pages like "Order Fabric Swatches") and "policies" (legal boilerplate like
// Terms & Conditions) are NOT editorial content and are deliberately left
// unmarked -- Article schema would misrepresent what those pages are.
const EDITORIAL_CONTENT_TYPES = ['about-us', 'care-guide'];

interface Props {
  params: Promise<{ contentType: string; slug: string; blogId: string }>;
}

export default async function ContentDetailPage({ params }: Props) {
  const { contentType, slug, blogId } = await params;
  // CMS content pages (about-us, care-guide, etc.) use the blog-content endpoint
  const content = await getBlogDetail(blogId);

  // Upstream endpoint sometimes fails for a legacy content id that IS a real,
  // live (200) URL. Match live's SPA behaviour with a 200 shell so the footer /
  // nav links never 404 at SEO cutover.
  if (!content) {
    return <UnavailableShell slug={slug} backHref='/' backLabel='Home' />;
  }

  // Build related items from prev/next
  const relatedItems = [
    content.previousBlogDetails,
    content.nextBlogDetails ?? null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  // FAQPage schema — the CMS content pipeline attaches real FAQ Q&A
  // (content.faq) that renders visually via FaqAccordion below, but no
  // structured-data equivalent was ever emitted. Fix: mirror the rendered
  // Q&A into FAQPage.
  const hasFaq = !!(content.faq && content.faq.faqQuestionList?.length > 0);
  const faqJsonLd = hasFaq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq!.faqQuestionList.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      }
    : null;

  // Article schema -- only for editorial content types, and only when the
  // CMS record genuinely has a title + a real creation date (both required
  // for a truthful Article). Never invents an author: falls back to the
  // Organization when the CMS record has no named author, exactly like the
  // BlogPosting schema on /blogs/[slug]/[blogId].
  const isEditorial = EDITORIAL_CONTENT_TYPES.includes(contentType);
  const articlePath = '/content/' + contentType + '/' + slug + '/' + blogId;
  const articleJsonLd = isEditorial && content.title && content.timeOfCreation
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: content.title,
        ...(content.bannerImageDesktop ? { image: [content.bannerImageDesktop] } : {}),
        datePublished: new Date(content.timeOfCreation).toISOString(),
        dateModified: new Date(content.lastUpdateTime || content.timeOfCreation).toISOString(),
        author: content.author?.name
          ? { '@type': 'Person', name: content.author.name }
          : { '@type': 'Organization', name: 'Anuprerna' },
        publisher: {
          '@type': 'Organization',
          name: 'Anuprerna',
          logo: {
            '@type': 'ImageObject',
            url: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo_black.svg',
          },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(articlePath) },
      }
    : null;
  const jsonLdBlocks = [articleJsonLd, faqJsonLd].filter(
    (b): b is NonNullable<typeof b> => b != null,
  );

  return (
    <main className="bg-white min-h-screen">
      {jsonLdBlocks.length > 0 && <JsonLd data={jsonLdBlocks} />}
      {/* Mobile floating "On this Page" dropdown */}
      <MobileOnThisPage sections={content.blogContentSectionList} />

      {/* Full-bleed hero for CMS content pages */}
      <ArticleHero
        variant="content"
        title={content.title}
        bannerImageDesktop={content.bannerImageDesktop}
        bannerImageMobile={content.bannerImageMobile}
        bannerImageAlt={content.bannerImageAlt}
      />

      <div className="mx-auto max-w-screen-xl px-4 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumb — Home / Blog / <title> */}
        <ContentBreadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blogs' },
            { label: content.title },
          ]}
        />

        {/* Meta */}
        <div className="mb-8 max-w-3xl">
          {content.blogContentCategory?.name && (
            <p className="text-[10px] uppercase tracking-widest text-black/50 mb-2">
              {content.blogContentCategory.name}
            </p>
          )}
          <ArticleMeta
            category={content.blogContentCategory?.name}
            timeOfCreation={content.timeOfCreation}
            lastUpdateTime={content.lastUpdateTime}
            readingTime={content.readingTime}
          />
        </div>

        {/* 3-column layout: TOC | Article | Right rail */}
        <div className="flex gap-8 xl:gap-12 items-start">
          {/* Left: TOC */}
          <div className="hidden lg:block w-52 flex-shrink-0">
            <TableOfContents sections={content.blogContentSectionList} />
          </div>

          {/* Center: article body */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <ContentBody
              description={content.description}
              sections={content.blogContentSectionList}
              imageStyle="plain"
            />

            {/* FAQ */}
            {content.faq && content.faq.faqQuestionList?.length > 0 && (
              <FaqAccordion
                heading={content.faq.heading}
                questions={content.faq.faqQuestionList}
              />
            )}

            {/* Related content — inline on mobile/tablet only */}
            {relatedItems.length > 0 && (
              <div className="xl:hidden">
                <RelatedGrid items={relatedItems} variant="blog" heading="Related Articles" />
              </div>
            )}
          </div>

          {/* Right: sidebar rail — author card + related articles (desktop only) */}
          <aside className="hidden xl:flex xl:flex-col w-56 flex-shrink-0 gap-6 sticky top-20 self-start">
            {/* Author card */}
            {content.author?.name && (
              <div className="rounded-xl border border-black/10 bg-sand/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-bark mb-3 font-medium">Written by</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-clay/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-clay font-semibold text-base">{content.author.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black leading-tight">{content.author.name}</p>
                    <p className="text-[11px] text-black/50 mt-0.5">Anuprerna</p>
                  </div>
                </div>
              </div>
            )}

            {/* Related articles */}
            {relatedItems.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-bark mb-3 font-medium">Related Articles</p>
                <ul className="flex flex-col gap-4">
                  {relatedItems.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <a
                        href={"/content/" + contentType + "/" + item.slug + "/" + String(item.id)}
                        className="group flex items-start gap-2.5"
                      >
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-sand">
                          {item.bannerImageDesktop && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.bannerImageDesktop}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs text-black/80 leading-snug line-clamp-3 group-hover:text-clay transition-colors">
                          {item.title}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
