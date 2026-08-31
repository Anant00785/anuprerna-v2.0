import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogDetail, getBlogRecommendedList } from '@/components/content-detail/loom';
import ArticleMeta from '@/components/content-detail/ArticleMeta';
import ContentBody from '@/components/content-detail/ContentBody';
import FaqAccordion from '@/components/content-detail/FaqAccordion';
import RelatedGrid from '@/components/content-detail/RelatedGrid';
import TableOfContents from '@/components/content-detail/TableOfContents';
import MobileOnThisPage from '@/components/content-detail/MobileOnThisPage';
import JsonLd from '@/components/seo/JsonLd';
import { absUrl, robotsMeta, metaDescription } from '@/lib/seo/config';

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string; blogId: string }>;
}

// robots flips on SEO_MODE; canonical/OG anchor to SITE_URL, never vercel.app.
// getBlogDetail is Next-fetch cached, so this call dedupes with the page's.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, blogId } = await params;
  const blog = await getBlogDetail(blogId);
  if (!blog) return { title: 'Blog | Anuprerna', robots: robotsMeta() };
  const description = metaDescription(blog.description) || undefined;
  const path = '/blogs/' + (blog.slug || slug) + '/' + blog.id;
  const image = blog.bannerImageDesktop || undefined;
  return {
    title: blog.title,
    description,
    robots: robotsMeta(),
    alternates: { canonical: absUrl(path) },
    openGraph: {
      type: 'article',
      url: absUrl(path),
      title: blog.title,
      description,
      siteName: 'Anuprerna',
      images: image ? [{ url: image, alt: blog.bannerImageAlt || blog.title }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { blogId } = await params;
  const [blog, recommended] = await Promise.all([
    getBlogDetail(blogId),
    getBlogRecommendedList(blogId),
  ]);

  if (!blog) notFound();

  // "More Blogs" grid — prefer rich recommended list, fall back to prev/next.
  const moreItems = recommended.length > 0
    ? recommended.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        bannerImageDesktop: r.bannerImageDesktop,
        timeOfCreation: r.lastUpdateTime || r.timeOfCreation,
        category: r.blogContentCategory?.name,
      }))
    : [blog.previousBlogDetails, blog.nextBlogDetails ?? null].filter(
        (item): item is NonNullable<typeof item> => item != null,
      );

  // --- Structured data (renders in BOTH modes; harmless while noindexed) -----
  const path = '/blogs/' + blog.slug + '/' + blog.id;
  const hasFaq = !!(blog.faq && blog.faq.faqQuestionList?.length > 0);
  const blogPostingJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    ...(blog.bannerImageDesktop ? { image: [blog.bannerImageDesktop] } : {}),
    datePublished: new Date(blog.timeOfCreation).toISOString(),
    dateModified: new Date(blog.lastUpdateTime || blog.timeOfCreation).toISOString(),
    // Real author when the CMS record has one; otherwise the publishing
    // Organization is the truthful attribution — never invent a person.
    author: blog.author?.name
      ? { '@type': 'Person', name: blog.author.name }
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
  // FAQPage schema — the blog CMS pipeline attaches real FAQ Q&A (blog.faq)
  // that renders visually via FaqAccordion below, but no structured-data
  // equivalent was ever emitted. Fix: mirror the rendered Q&A into FAQPage.
  const faqJsonLd = hasFaq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: blog.faq!.faqQuestionList.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      }
    : null;

  return (
    <main className='bg-white min-h-screen'>
      <JsonLd data={faqJsonLd ? [blogPostingJsonLd, faqJsonLd] : [blogPostingJsonLd]} />
      {/* Mobile floating "On this Page" dropdown */}
      <MobileOnThisPage sections={blog.blogContentSectionList} />

      <div className='mx-auto max-w-screen-xl px-4 lg:px-8 py-10 sm:py-14'>
        {/* Page title + meta */}
        <div className='mb-8 max-w-3xl'>
          {blog.blogContentCategory?.name && (
            <p className='text-[10px] uppercase tracking-widest text-black/50 mb-2'>
              {blog.blogContentCategory.name}
            </p>
          )}
          <h1 className='text-3xl lg:text-4xl font-bold text-black mb-4'>
            {blog.title}
          </h1>
          <ArticleMeta
            category={blog.blogContentCategory?.name}
            timeOfCreation={blog.timeOfCreation}
            lastUpdateTime={blog.lastUpdateTime}
            readingTime={blog.readingTime}
          />
        </div>

        {/* 3-column layout: TOC | Article | (sidebar slot) */}
        <div className='flex gap-8 xl:gap-12 items-start'>
          {/* Left: TOC (~220px) */}
          <div className='hidden lg:block w-52 flex-shrink-0'>
            <TableOfContents sections={blog.blogContentSectionList} />
          </div>

          {/* Center: article body */}
          <div className='flex-1 min-w-0 max-w-3xl'>
            <ContentBody
              description={blog.description}
              sections={blog.blogContentSectionList}
              imageStyle='plain'
            />

            {/* FAQ */}
            {blog.faq && blog.faq.faqQuestionList?.length > 0 && (
              <FaqAccordion
                heading={blog.faq.heading}
                questions={blog.faq.faqQuestionList}
              />
            )}

            {/* More Blogs (recommended) */}
            {moreItems.length > 0 && (
              <RelatedGrid items={moreItems} variant='blog' heading='More Blogs' />
            )}
          </div>

          {/* Right: sidebar slot (future use) */}
          <div className='hidden xl:block w-52 flex-shrink-0' />
        </div>
      </div>
    </main>
  );
}
