import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ blogId: string }> }
) {
  const resolvedParams = await params;
  const blogId = resolvedParams.blogId;

  if (!blogId) {
    return NextResponse.json({ success: false, error: "Missing blogId" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE_URL}/get/blog-content/${encodeURIComponent(blogId)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    const blogContent = json.blogContent || json.payload || json;

    return NextResponse.json({
      success: true,
      data: blogContent,
    });
  } catch (error) {
    console.error("Content API Route Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
