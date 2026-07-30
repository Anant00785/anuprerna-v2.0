import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const resolvedParams = await params;
  const type = resolvedParams.type;

  try {
    const res = await fetch(`${BASE_URL}/get/navigation/story/${encodeURIComponent(type)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, data: [] }, { status: res.status });
    }

    const json = await res.json();
    const data = json.entityAttributeKey || json.entity || json.payload || [];

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(`API Navigation Story ${type} Error:`, error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
