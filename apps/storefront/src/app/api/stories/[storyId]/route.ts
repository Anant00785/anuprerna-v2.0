import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = (
  env.NEXT_PUBLIC_API_MODE === "nest"
    ? env.NEXT_PUBLIC_NEST_API_URL
    : env.NEXT_PUBLIC_SPRINGBOOT_API_URL
).replace(/\/$/, "");

const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const resolvedParams = await params;
  const storyId = resolvedParams.storyId;

  if (!storyId) {
    return NextResponse.json({ success: false, error: "Missing storyId" }, { status: 400 });
  }

  try {
    let story: any = null;

    // 1. Try direct fetch by ID on NestJS
    try {
      const res = await fetch(`${BASE_URL}/get/story-content/${encodeURIComponent(storyId)}`, {
        headers: DEFAULT_HEADERS,
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        story = json.storyContent || json.payload || (json.id ? json : null);
      }
    } catch (_) {}

    // 2. If not found by ID or isNaN, try fetch by slug
    if (!story) {
      try {
        const res = await fetch(`${BASE_URL}/get/story-content/slug/${encodeURIComponent(storyId)}`, {
          headers: DEFAULT_HEADERS,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          story = json.storyContent || json.payload || (json.id ? json : null);
        }
      } catch (_) {}
    }

    // 3. If still not found, search story-content-list for matching item
    if (!story) {
      try {
        const listRes = await fetch(`${BASE_URL}/get/story-content-list`, {
          headers: DEFAULT_HEADERS,
          cache: "no-store",
        });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const allStories: any[] = listJson.storyContents || listJson.storyContent || [];
          const cleanId = String(storyId).toLowerCase().replace(/[\s-]+/g, "");
          const cleanWords = String(storyId)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2);

          const match = allStories.find((s: any) => {
            const sSlug = String(s.slug || "").toLowerCase().replace(/[\s-]+/g, "");
            const sTitle = String(s.title || "").toLowerCase().replace(/[\s-]+/g, "");
            const sId = String(s.id);
            if (sId === storyId) return true;
            if (sSlug && (sSlug.includes(cleanId) || cleanId.includes(sSlug))) return true;
            if (sTitle && (sTitle.includes(cleanId) || cleanId.includes(sTitle))) return true;
            const sFull = `${sSlug} ${sTitle}`.toLowerCase();
            const matchedWordCount = cleanWords.filter((w) => sFull.includes(w)).length;
            return cleanWords.length > 0 && matchedWordCount >= Math.min(2, cleanWords.length);
          });

          if (match && match.id) {
            const detailRes = await fetch(`${BASE_URL}/get/story-content/${match.id}`, {
              headers: DEFAULT_HEADERS,
              cache: "no-store",
            });
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              story = detailJson.storyContent || detailJson.payload || (detailJson.id ? detailJson : null) || match;
            } else {
              story = match;
            }
          }
        }
      } catch (_) {}
    }

    if (!story) {
      return NextResponse.json({ success: false, error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error("API Story Details Route Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
