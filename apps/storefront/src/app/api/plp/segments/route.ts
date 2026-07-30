import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";

  if (!category) {
    return NextResponse.json({ success: true, segmentList: [] });
  }

  try {
    const url = `${BASE_URL}/get/filter/segment-list?category=${encodeURIComponent(category)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } });
    const json = res.ok ? await res.json() : { segmentList: [] };
    return NextResponse.json(json);
  } catch (error) {
    console.error("API PLP Segments Route Error:", error);
    return NextResponse.json({ success: false, segmentList: [] }, { status: 500 });
  }
}
