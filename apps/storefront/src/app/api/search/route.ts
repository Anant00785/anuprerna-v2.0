import { NextResponse } from "next/server";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_SPRINGBOOT_API_URL.replace(/\/$/, "");
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: "https://anuprerna.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({
      success: true,
      products: [],
      stories: [],
      blogs: [],
    });
  }

  const encodedQuery = encodeURIComponent(query.trim());

  try {
    const [productsRes, storiesRes, blogsRes] = await Promise.all([
      fetch(`${BASE_URL}/search/ai/${encodedQuery}?limit=50`, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      }),
      fetch(`${BASE_URL}/search/ai/story/${encodedQuery}?limit=3`, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      }),
      fetch(`${BASE_URL}/search/ai/blog/${encodedQuery}?limit=3`, {
        headers: DEFAULT_HEADERS,
        next: { revalidate: 60 },
      }),
    ]);

    const productsJson = productsRes.ok ? await productsRes.json() : {};
    const storiesJson = storiesRes.ok ? await storiesRes.json() : {};
    const blogsJson = blogsRes.ok ? await blogsRes.json() : {};

    // Extract product list
    const rawResultSet =
      productsJson.searchResult?.product?.resultSet ||
      productsJson.payload?.resultSet ||
      productsJson.product?.resultSet ||
      [];
    const relatedResultSet =
      productsJson.searchResult?.product?.relatedResultSet ||
      productsJson.payload?.relatedResultSet ||
      productsJson.product?.relatedResultSet ||
      [];

    const combinedProducts = [...rawResultSet, ...relatedResultSet];

    // Format products
    const products = combinedProducts.map((p: any) => ({
      id: p.id || p.product_id,
      product_id: p.product_id || p.id,
      name: p.name || p.title,
      slug: p.slug,
      hero_image: p.hero_image || p.heroImage,
      hover_image: p.hover_image || p.hoverImage,
      price: p.price || 0,
      calculatedPrice: p.price || 0,
      unit: p.unit || "METER",
      special_status: p.special_status || p.specialStatus || "Handwoven Fabric",
      product_group: p.product_group || p.productGroup || "fabric",
      total_quantity: p.total_quantity ?? p.totalQuantity ?? 100,
    }));

    const stories = storiesJson.storyContentList || storiesJson.payload || [];
    const blogs = blogsJson.blogContentList || blogsJson.payload || [];

    return NextResponse.json({
      success: true,
      products,
      stories,
      blogs,
    });
  } catch (error) {
    console.error("Search API Route Error:", error);
    return NextResponse.json(
      { success: false, products: [], stories: [], blogs: [] },
      { status: 500 }
    );
  }
}
