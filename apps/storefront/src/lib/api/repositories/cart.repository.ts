import { env } from "@/env";
import { Cart, CartItem } from "@/types/domain/cart";
import { apiRequest } from "../client";
import { mapLegacyCartToDomain } from "../adapters/legacy-cart.adapter";
import { mapNestCartToDomain } from "../adapters/nest-cart.adapter";
import { LegacyCartResponseDto, LegacySpringResponse } from "../dto/legacy-springboot.dto";
import { NestApiResponse, NestCartDto } from "../dto/nestjs.dto";

export const cartRepository = {
  /**
   * Get active user cart
   */
  async getCart(): Promise<Cart> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      try {
        const response = await apiRequest<LegacySpringResponse<LegacyCartResponseDto>>(
          "/get/cart-item/list",
          {},
          "legacy"
        );
        const dto = response.payload || response.content || response.data || {};
        return mapLegacyCartToDomain(dto);
      } catch (err) {
        console.warn("Failed to fetch legacy cart:", err);
        return {
          items: [],
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          estimatedShipping: 0,
          total: 0,
          currency: "INR",
        };
      }
    } else {
      const response = await apiRequest<NestApiResponse<NestCartDto>>("/v1/cart", {}, "nest");
      return mapNestCartToDomain(response.data);
    }
  },

  /**
   * Add item to cart
   */
  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      const response = await apiRequest<LegacySpringResponse<LegacyCartResponseDto>>(
        "/add/cart-item",
        {
          method: "POST",
          body: JSON.stringify({ productId, qty: quantity }),
        },
        "legacy"
      );
      const dto = response.payload || response.content || response.data || {};
      return mapLegacyCartToDomain(dto);
    } else {
      const response = await apiRequest<NestApiResponse<NestCartDto>>(
        "/v1/cart/items",
        {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
        },
        "nest"
      );
      return mapNestCartToDomain(response.data);
    }
  },
};
