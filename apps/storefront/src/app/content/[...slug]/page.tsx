import { CustomContentPage } from "@/components/content/CustomContentPage";
import { redirect } from "next/navigation";

export default async function CatchAllContentRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugParts = resolvedParams.slug || [];

  // Extract the numeric ID from the last URL segment
  const lastSegment = slugParts[slugParts.length - 1] || "";
  const match = lastSegment.match(/\d+/);
  const blogId = match ? match[0] : lastSegment;

  if (!blogId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <main className="w-full">
          <CustomContentPage blogId={blogId} />
        </main>
      </div>
    </div>
  );
}
