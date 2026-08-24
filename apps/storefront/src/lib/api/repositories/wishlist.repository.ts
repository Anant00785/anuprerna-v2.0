import { apiRequest } from "../client";
import { PLPProduct } from "@/types/domain/plp";

export const wishlistRepository = {
  /**
   * Fetch wishlist product previews by CSV of SKUs (GET /get/product-preview-list/csv/${csv})
   */
  async getProductsByCSV(csv: string, jwtToken?: string): Promise<PLPProduct[]> {
    if (!csv || !csv.trim()) return [];
    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`;
    }

    try {
      const response = await apiRequest<{ productPreviewList?: Record<string, any>[]; data?: Record<string, any>[] } | Record<string, any>[]>(
        `get/product-preview-list/csv/${encodeURIComponent(csv)}`,
        { headers }
      );

      const items = Array.isArray(response)
        ? response
        : (response?.productPreviewList ?? (response as any)?.data ?? []);

      return items.map((item) => {
        const group: 'fabric' | 'finished' =
          item.productGroup === 'finished' || item.product_group === 'finished' ? 'finished' : 'fabric';

        return {
          id: Number(item.id) || 0,
          product_id: Number(item.productId || item.product_id || item.id) || 0,
          sku: String(item.sku || ''),
          name: String(item.name || ''),
          price: Number(item.price || 0),
          hero_image: String(item.heroImage || item.hero_image || '/assets/img/item.png'),
          hover_image: item.hoverImage || item.hover_image,
          slug: String(item.slug || ''),
          unit: String(item.unit || 'METER'),
          product_group: group,
          calculatedPrice: Number(item.calculatedPrice || item.price || 0),
          calculatedDiscountedPrice: item.calculatedDiscountedPrice ? Number(item.calculatedDiscountedPrice) : undefined,
          total_quantity: Number(item.totalQuantity || item.total_quantity || 0),
          segment_category: String(item.segmentCategory || item.segment_category || ''),
          sub_category: String(item.subCategory || item.sub_category || ''),
          category: String(item.category || ''),
          special_status: item.specialStatus?.name || item.special_status || undefined,
          inWishlist: true,
          size_profile_option_list: item.productSizeProfileList || item.size_profile_option_list,
        };
      });
    } catch (err) {
      console.warn("Failed to fetch wishlist products:", err);
      return [];
    }
  },
};
