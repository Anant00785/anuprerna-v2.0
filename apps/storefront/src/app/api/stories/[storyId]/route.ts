import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
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
    const res = await fetch(`${BASE_URL}/get/story-content/${encodeURIComponent(storyId)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const story = json.storyContent || json.payload || json;

    return NextResponse.json({
      success: true,
      story,
    });
  } catch (error) {
    console.error("API Story Details Route Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
