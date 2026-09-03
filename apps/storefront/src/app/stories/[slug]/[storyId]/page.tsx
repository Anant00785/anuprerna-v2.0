import { StoryDetailPage } from "@/components/stories/StoryDetailPage";

export default async function StoryDetailRoute({
  params,
}: {
  params: Promise<{ slug: string; storyId: string }>;
}) {
  const resolvedParams = await params;
  const storyId = resolvedParams.storyId;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <main className="w-full">
          <StoryDetailPage storyId={storyId} />
        </main>
      </div>
    </div>
  );
}
