import { NextResponse } from "next/server";
import { env } from "@/env";

const NEST_URL = (env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3000").replace(/\/$/, "");
const SPRING_URL = (env.NEXT_PUBLIC_SPRINGBOOT_API_URL || "https://loom-v2.anuprerna.com").replace(/\/$/, "");

const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET() {
  try {
    let blogs: any[] = [];

    // 1. Try NestJS endpoint
    try {
      const res = await fetch(`${NEST_URL}/get/story-content-list`, {
        headers: DEFAULT_HEADERS,
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        blogs = json.storyContents || json.storyContent || json.blogContentList || [];
      }
    } catch (_) {}

    // 2. Fallback to SpringBoot or live endpoint if empty
    if (blogs.length === 0) {
      try {
        const res = await fetch("http://localhost:3000/get/story-content-list", {
          headers: DEFAULT_HEADERS,
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          blogs = json.storyContents || json.storyContent || [];
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error("API Blogs Route Error:", error);
    return NextResponse.json({ success: false, blogs: [] }, { status: 500 });
  }
}
