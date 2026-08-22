import { NextResponse } from "next/server";
import { env } from "@/env";

const NEST_URL = (env.NEXT_PUBLIC_NEST_API_URL || "http://localhost:3000").replace(/\/$/, "");
const SPRING_URL = (env.NEXT_PUBLIC_SPRINGBOOT_API_URL || "https://loom-v2.anuprerna.com").replace(/\/$/, "");

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

  // 1. Try NestJS backend first if active
  try {
    const nestRes = await fetch(`${NEST_URL}/get/product/nav-menu/${encodeURIComponent(type)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (nestRes.ok) {
      const json = await nestRes.json();
      const data = json.data || json.payload || json;
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, data });
      }
    }
  } catch {
    // Fallthrough to live fallback
  }

  // 2. Fallback to SpringBoot / live API
  try {
    const springRes = await fetch(`${SPRING_URL}/get/product/nav-menu/${encodeURIComponent(type)}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 300 },
    });

    if (springRes.ok) {
      const json = await springRes.json();
      const data = json.entityAttributeKey || json.entity || json.payload || json.data || [];
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error(`API Navigation Category ${type} Error:`, error);
  }

  return NextResponse.json({ success: true, data: [] });
}