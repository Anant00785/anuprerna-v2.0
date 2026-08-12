import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids") || "";

  if (!ids) {
    return NextResponse.json({ success: true, relatedProductsList: [] });
  }

  try {
    const url = `${BASE_URL}/get/related-products/id/${encodeURIComponent(ids)}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS, next: { revalidate: 300 } });
    const json = res.ok ? await res.json() : { relatedProductsList: [] };
    return NextResponse.json(json);
  } catch (error) {
    console.error("API PLP Related Route Error:", error);
    return NextResponse.json({ success: false, relatedProductsList: [] }, { status: 500 });
  }
}
