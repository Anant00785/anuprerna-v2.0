import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const resolvedParams = await params;
  const category = resolvedParams.category;

  try {
    const res = await fetch(`${BASE_URL}/get/featured/${encodeURIComponent(category)}/sub-category`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: res.status });
    }

    const json = await res.json();
    const featuredSubCategories = json.featuredSubCategories || json.data || [];

    return NextResponse.json({
      success: true,
      data: featuredSubCategories,
    });
  } catch (error) {
    console.error(`API Featured Products ${category} Error:`, error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
