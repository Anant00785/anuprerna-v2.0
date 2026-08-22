import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = (
  env.NEXT_PUBLIC_API_MODE === "nest"
    ? env.NEXT_PUBLIC_NEST_API_URL
    : env.NEXT_PUBLIC_SPRINGBOOT_API_URL
).replace(/\/$/, "");
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
    // 1. Try v2 fabric product details first
    const fabricV2Url = `${BASE_URL}/get/v2/fabric-product/slug/${encodeURIComponent(slug)}`;
    try {
      const fabricV2Res = await fetch(fabricV2Url, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      });

      if (fabricV2Res.ok) {
        const fabricJson = await fabricV2Res.json();
        const productData = fabricJson.fabricProduct || fabricJson.product || fabricJson.payload || fabricJson;
        if (productData && (productData.product || productData.name || productData.slug)) {
          const finalData = productData.product
            ? productData
            : { product: productData, ...productData };
          return NextResponse.json({
            success: true,
            productType: "fabric",
            data: finalData,
          });
        }
      }
    } catch {
      // Fall through to v1
    }

    // 2. Try v1 fabric product details fallback
    const fabricV1Url = `${BASE_URL}/get/fabric-product/slug/${encodeURIComponent(slug)}`;
    try {
      const fabricV1Res = await fetch(fabricV1Url, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      });

      if (fabricV1Res.ok) {
        const fabricJson = await fabricV1Res.json();
        const productData = fabricJson.fabricProduct || fabricJson.product || fabricJson.payload || fabricJson;
        if (productData && (productData.product || productData.name || productData.slug)) {
          const finalData = productData.product
            ? productData
            : { product: productData, ...productData };
          return NextResponse.json({
            success: true,
            productType: "fabric",
            data: finalData,
          });
        }
      }
    } catch {
      // Fall through to finished
    }

    // 3. Try finished product details
    const finishedUrl = `${BASE_URL}/get/finished-product/slug/${encodeURIComponent(slug)}`;
    try {
      const finishedRes = await fetch(finishedUrl, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      });

      if (finishedRes.ok) {
        const finishedJson = await finishedRes.json();
        const productData = finishedJson.finishedProduct || finishedJson.product || finishedJson.payload || finishedJson;
        if (productData && (productData.product || productData.name || productData.slug)) {
          const finalData = productData.product
            ? productData
            : { product: productData, ...productData };
          return NextResponse.json({
            success: true,
            productType: "finished",
            data: finalData,
          });
        }
      }
    } catch {
      // Fall through
    }

    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error("API Product Route Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
