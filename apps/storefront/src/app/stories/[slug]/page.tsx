import { StoryDetailPage } from "@/components/stories/StoryDetailPage";

export default async function SingleStorySlugRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <main className="w-full">
          <StoryDetailPage storyId={slug} />
        </main>
      </div>
    </div>
  );
}
