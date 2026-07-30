import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/get/blog-content-list/customer`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, blogs: [] }, { status: res.status });
    }

    const json = await res.json();
    const blogs = json.blogContentList || json.payload || [];

    return NextResponse.json({
      success: true,
      blogs,
    });
  } catch (error) {
    console.error("API Blogs Route Error:", error);
    return NextResponse.json({ success: false, blogs: [] }, { status: 500 });
  }
}
