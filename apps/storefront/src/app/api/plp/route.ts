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
  const group = searchParams.get("group") || "fabric";
  const category = searchParams.get("category") || "";

  try {
    const productUrl =
      group === "finished"
        ? `${BASE_URL}/get/filter/finished`
        : `${BASE_URL}/get/filter/fabric?category=fabrics`;

    const [productsRes, colorsRes, materialsRes, patternsRes] = await Promise.all([
      fetch(productUrl, { headers: DEFAULT_HEADERS, cache: "no-store" }),
      fetch(`${BASE_URL}/get/color-list`, { headers: DEFAULT_HEADERS, cache: "no-store" }),
      fetch(`${BASE_URL}/get/material-list`, { headers: DEFAULT_HEADERS, cache: "no-store" }),
      fetch(`${BASE_URL}/get/pattern-list`, { headers: DEFAULT_HEADERS, cache: "no-store" }),
    ]);

    const productsJson = productsRes.ok ? await productsRes.json() : { products: [] };
    const colorsJson = colorsRes.ok ? await colorsRes.json() : { entityList: [] };
    const materialsJson = materialsRes.ok ? await materialsRes.json() : { entityList: [] };
    const patternsJson = patternsRes.ok ? await patternsRes.json() : { entityList: [] };

    let rawProducts =
      productsJson.products ||
      productsJson.productFilter ||
      productsJson.productList ||
      productsJson.payload ||
      productsJson.entityList ||
      (Array.isArray(productsJson) ? productsJson : []);

    if (!Array.isArray(rawProducts)) {
      rawProducts = [];
    }

    const colors =
      colorsJson.entityList ||
      colorsJson.colorList ||
      colorsJson.payload ||
      (Array.isArray(colorsJson) ? colorsJson : []);

    const materials =
      materialsJson.entityList ||
      materialsJson.materialList ||
      materialsJson.payload ||
      (Array.isArray(materialsJson) ? materialsJson : []);

    const patterns =
      patternsJson.entityList ||
      patternsJson.patternList ||
      patternsJson.payload ||
      (Array.isArray(patternsJson) ? patternsJson : []);

    const products = rawProducts.map((p: any) => ({
      ...p,
      id: Number(p.id ?? p.productId ?? 0),
      product_id: Number(p.productId ?? p.product_id ?? p.id ?? 0),
      sku: p.sku ?? "",
      name: p.name ?? "",
      price: Number(p.price ?? 0),
      calculatedPrice: Number(p.calculatedPrice ?? p.price ?? 0),
      calculatedDiscountedPrice: p.calculatedDiscountedPrice
        ? Number(p.calculatedDiscountedPrice)
        : undefined,
      hero_image: p.hero_image || p.heroImage || "",
      hover_image: p.hover_image || p.hoverImage || "",
      heroImage: p.heroImage || p.hero_image || "",
      hoverImage: p.hoverImage || p.hover_image || "",
      slug: p.slug ?? "",
      unit: p.unit ?? "METER",
      material: p.material,
      color: p.color,
      pattern: p.pattern,
      gsm: p.gsm ? Number(p.gsm) : undefined,
      quantity: p.quantity ? Number(p.quantity) : 0,
      total_quantity: Number(p.totalQuantity ?? p.total_quantity ?? p.quantity ?? 0),
      segment_category: p.segmentCategory ?? p.segment_category ?? "",
      sub_category: p.subCategory ?? p.sub_category ?? "",
      category: p.category ?? "",
      special_status: p.specialStatus ?? p.special_status,
      volume_discount: p.volumeDiscount
        ? Number(p.volumeDiscount)
        : p.volume_discount
        ? Number(p.volume_discount)
        : undefined,
      volume_discount_minimum_order_quantity:
        p.volumeDiscountMinimumOrderQuantity ?? p.volume_discount_minimum_order_quantity,
      product_group: p.productGroup ?? p.product_group ?? group,
    }));

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
