import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") || "fabric";
  const category = searchParams.get("category") || "";

  try {
    const productUrl =
      group === "finished"
        ? `${BASE_URL}/get/filter/finished${category ? `?category=${encodeURIComponent(category)}` : ""}`
        : `${BASE_URL}/get/filter/fabric?category=${encodeURIComponent(category || "fabrics")}`;

    const [productsRes, colorsRes, materialsRes, patternsRes] = await Promise.all([
      fetch(productUrl, { headers: DEFAULT_HEADERS, next: { revalidate: 60 } }),
      fetch(`${BASE_URL}/get/color-list`, { headers: DEFAULT_HEADERS, next: { revalidate: 3600 } }),
      fetch(`${BASE_URL}/get/material-list`, { headers: DEFAULT_HEADERS, next: { revalidate: 3600 } }),
      fetch(`${BASE_URL}/get/pattern-list`, { headers: DEFAULT_HEADERS, next: { revalidate: 3600 } }),
    ]);

    const productsJson = productsRes.ok ? await productsRes.json() : { products: [] };
    const colorsJson = colorsRes.ok ? await colorsRes.json() : { colorList: [] };
    const materialsJson = materialsRes.ok ? await materialsRes.json() : { materialList: [] };
    const patternsJson = patternsRes.ok ? await patternsRes.json() : { patternList: [] };

    const products = productsJson.products || productsJson.payload || [];
    const colors = colorsJson.colorList || colorsJson.payload || [];
    const materials = materialsJson.materialList || materialsJson.payload || [];
    const patterns = patternsJson.patternList || patternsJson.payload || [];

    return NextResponse.json({
      success: true,
      products,
      colors,
      materials,
      patterns,
    });
  } catch (error) {
    console.error("API PLP Route Error:", error);
    return NextResponse.json(
      { success: false, products: [], colors: [], materials: [], patterns: [] },
      { status: 500 }
    );
  }
}
