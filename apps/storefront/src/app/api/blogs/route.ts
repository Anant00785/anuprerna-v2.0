import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = (env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3000").replace(/\/$/, "");

const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET() {
  try {
    let blogs: any[] = [];

    try {
      const res = await fetch(`${BASE_URL}/get/story-content-list`, {
        headers: DEFAULT_HEADERS,
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        blogs = json.storyContents || json.storyContent || json.blogContentList || [];
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error("API Blogs Route Error:", error);
    return NextResponse.json({ success: false, blogs: [] }, { status: 500 });
  }
}
