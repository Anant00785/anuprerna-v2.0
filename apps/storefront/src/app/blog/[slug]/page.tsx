// /blog/{slug} — legacy editorial links embedded in CMS body copy point here
// (live 301s them to /blogs/{slug}/{id}). We resolve the blog by slug and render
// the blogs detail UI; if the slug is stale/unresolvable we serve a graceful 200
// shell (matching live's SPA behaviour) so these in-body links never 404.
import { getBlogDetailBySlug, getBlogRecommendedList } from '@/components/content-detail/loom';
import UnavailableShell from '@/components/UnavailableShell';
import ArticleHero from '@/components/content-detail/ArticleHero';
import ContentBody from '@/components/content-detail/ContentBody';
import RelatedGrid from '@/components/content-detail/RelatedGrid';

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LegacyBlogPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlogDetailBySlug(slug);
  if (!blog) {
    return <UnavailableShell slug={slug} backHref='/blogs' backLabel='Blogs' />;
  }
  const recommended = await getBlogRecommendedList(blog.id);
  const moreItems = recommended.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    bannerImageDesktop: r.bannerImageDesktop,
    timeOfCreation: r.lastUpdateTime || r.timeOfCreation,
    category: r.blogContentCategory?.name,
  }));
  return (
    <main className='bg-white min-h-screen'>
      <ArticleHero
        variant='content'
        title={blog.title}
        bannerImageDesktop={blog.bannerImageDesktop}
        bannerImageMobile={blog.bannerImageMobile}
      />
      <div className='mx-auto max-w-screen-xl px-4 lg:px-8 py-10'>
        <ContentBody description={blog.description} sections={blog.blogContentSectionList} imageStyle='plain' />
      </div>
      {moreItems.length > 0 && (
        <div className='mx-auto max-w-screen-xl px-4 lg:px-8 pb-14'>
          <RelatedGrid items={moreItems} variant='blog' heading='More Blogs' />
        </div>
      )}
    </main>
  );
}
