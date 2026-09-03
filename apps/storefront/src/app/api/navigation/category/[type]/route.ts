import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = (env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3000").replace(/\/$/, "");

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

  const validTypes = ["craft", "material", "pattern", "color"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ success: false, data: [] }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE_URL}/get/product/nav-menu/${encodeURIComponent(type)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const json = await res.json();
      const data = json.data || json.entityAttributeKey || json.entity || json.payload || json;
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, data });
      }
    }
  } catch (error) {
    console.error(`API Navigation Category ${type} Error:`, error);
  }

  return NextResponse.json({ success: true, data: [] });
}