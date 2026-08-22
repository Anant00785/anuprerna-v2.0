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

export async function GET() {
  try {
    let stories: any[] = [];

    // 1. Try NestJS endpoint
    try {
      const res = await fetch(`${BASE_URL}/get/story-content-list`, {
        headers: DEFAULT_HEADERS,
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        stories = json.storyContents || json.storyContent || json.storyContentList || [];
      }
    } catch (_) {}

    // 2. Fallback if empty
    if (stories.length === 0) {
      try {
        const res = await fetch("http://localhost:3000/get/story-content-list", {
          headers: DEFAULT_HEADERS,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          stories = json.storyContents || json.storyContent || [];
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      stories,
    });
  } catch (error) {
    console.error("API Stories Route Error:", error);
    return NextResponse.json({ success: false, stories: [] }, { status: 500 });
  }
}
