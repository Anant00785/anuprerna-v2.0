import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "";

  if (!slug) {
    return NextResponse.json({ success: false, error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    // 1. Try fabric product details first
    const fabricUrl = `${BASE_URL}/get/v2/fabric-product/slug/${encodeURIComponent(slug)}`;
    const fabricRes = await fetch(fabricUrl, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 60 },
    });

    if (fabricRes.ok) {
      const fabricJson = await fabricRes.json();
      if (fabricJson.fabricProduct && fabricJson.fabricProduct.product) {
        return NextResponse.json({
          success: true,
          productType: "fabric",
          data: fabricJson.fabricProduct,
        });
      }
    }

    // 2. Fallback to finished product details
    const finishedUrl = `${BASE_URL}/get/finished-product/slug/${encodeURIComponent(slug)}`;
    const finishedRes = await fetch(finishedUrl, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 60 },
    });

    if (finishedRes.ok) {
      const finishedJson = await finishedRes.json();
      if (finishedJson.finishedProduct || finishedJson.product) {
        return NextResponse.json({
          success: true,
          productType: "finished",
          data: finishedJson.finishedProduct || finishedJson.product || finishedJson.payload,
        });
      }
    }

    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error("API Product Route Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
