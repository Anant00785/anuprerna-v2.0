import { env } from "@/env";
import { Cart, CartItem } from "@/types/domain/cart";
import { apiRequest } from "../client";
import { mapLegacyCartToDomain } from "../adapters/legacy-cart.adapter";
import { mapNestCartToDomain } from "../adapters/nest-cart.adapter";
import { LegacyCartItemDto, LegacyCartListResponse } from "../dto/legacy-springboot.dto";
import { NestApiResponse, NestCartDto } from "../dto/nestjs.dto";
import { RainTreeResponse } from "./auth.repository";

/**
 * What Loom's `POST /add/cart-item` actually binds to: the `CartItem` JPA entity
 * (loom `cart/controller/CartController.java` `addCartItem`), sent flat, not wrapped.
 * Field names and defaults mirror fabric's `ProductCartService.addFabricProduct` /
 * `addFinishedProduct`, which is the code running in production today.
 *
 * The owning tenant is NOT part of the body — Loom resolves it from the bearer
 * token, so this call only works for a signed-in customer.
 */
export interface AddCartItemInput {
  /** `FabricPreview` id (the PDP payload's top-level `id`), for `productGroup: "fabric"`. */
  fabricProductId?: number;
  /** `FinishedPreview` id, for `productGroup: "finished"`. */
  finishedProductId?: number;
  quantity: number;
  unit: string;
  price: number;
  sku: string;
  orderType?: "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER";
  productGroup?: "fabric" | "finished" | "swatch";
  selectedFabricId?: number;
  selectedSizeOptionId?: number;
  selectedFinishId?: string;
  makingCharge?: number;
  customSize?: Record<string, unknown>;
  minOrderQuantity?: number;
}

/**
 * Loom rejects a zero foreign key outright (there is no id 0 to join to), so
 * fabric deletes those keys before sending rather than sending 0. The columns
 * Loom marks NOT NULL (`selectedFinishId`, `customSize`, `productGroup`,
 * `orderType`, `makingCharge`) always have to be present.
 */
function toLegacyCartItem(input: AddCartItemInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    quantity: input.quantity,
    unit: input.unit,
    price: input.price,
    sku: input.sku,
    orderType: input.orderType ?? "IN_STOCK",
    productGroup: input.productGroup ?? "fabric",
    selectedSizeOptionId: input.selectedSizeOptionId ?? 0,
    selectedFinishId: input.selectedFinishId ?? "",
    makingCharge: input.makingCharge ?? 0,
    customSize: input.customSize ?? {},
  };
  if (input.fabricProductId) body.fabricProductId = input.fabricProductId;
  if (input.finishedProductId) body.finishedProductId = input.finishedProductId;
  if (input.selectedFabricId) body.selectedFabricId = input.selectedFabricId;
  if (input.minOrderQuantity) body.minOrderQuantity = input.minOrderQuantity;
  return body;
}

export const cartRepository = {
  /**
   * Get active user cart
   */
  async getCart(): Promise<Cart> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      try {
        // Loom answers with `{"cartItemList": [...], "success": true}`. This used
        // to read `response.payload || response.content || response.data`, none
        // of which Loom ever sends, so it mapped `{}` and every cart came back
        // empty however many rows the backend actually held.
        const response = await apiRequest<LegacyCartListResponse>(
          "/get/cart-item/list",
          // apiRequest defaults to `next: { revalidate: 60 }`; the cart is
          // per-customer and must never be served from a shared cache.
          { next: { revalidate: 0 } } as RequestInit,
          "legacy"
        );
        return mapLegacyCartToDomain(response.cartItemList ?? []);
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
   * Add item to cart.
   *
   * Loom answers `POST /add/cart-item` with a RainTree envelope and does NOT
   * return the cart, so there is nothing to map back — callers that need the new
   * contents re-read `getCart()`, the same way fabric re-fetches after an add.
   */
  async addToCart(input: AddCartItemInput): Promise<void> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      // Loom answers a rejected payload with HTTP 200 and `{"success": false}`,
      // so `response.ok` is not enough — a bad body would otherwise look like a
      // successful add and the item would silently never reach the cart.
      const response = await apiRequest<RainTreeResponse>(
        "/add/cart-item",
        {
          method: "POST",
          body: JSON.stringify(toLegacyCartItem(input)),
        },
        "legacy"
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to add item to cart");
      }
    } else {
      await apiRequest<NestApiResponse<NestCartDto>>(
        "/v1/cart/items",
        {
          method: "POST",
          body: JSON.stringify({
            productId: String(input.fabricProductId ?? input.finishedProductId ?? ""),
            quantity: input.quantity,
          }),
        },
        "nest"
      );
    }
  },

  /**
   * Change the quantity on an existing cart row.
   *
   * Loom's `PATCH /update/cart-item` re-binds the whole `CartItem` entity rather
   * than patching a field, so the row's original values have to be echoed back
   * alongside the new quantity — anything omitted is written as null and trips
   * the NOT NULL columns. They are read off `item.source`, the raw row the
   * adapter kept for exactly this.
   */
  async updateQuantity(item: CartItem, quantity: number): Promise<void> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      const row = (item.source ?? {}) as LegacyCartItemDto;
      const preview = row.fabricProductPreview ?? row.finishedProductPreview;
      const body = {
        ...toLegacyCartItem({
          fabricProductId: row.fabricProductPreview?.id,
          finishedProductId: row.finishedProductPreview?.id,
          quantity,
          unit: row.unit ?? preview?.product?.unit ?? "METER",
          price: preview?.product?.price ?? item.unitPrice,
          sku: preview?.product?.sku ?? "",
          orderType: row.orderType as AddCartItemInput["orderType"],
          productGroup: row.productGroup as AddCartItemInput["productGroup"],
          selectedFinishId: row.selectedFinishId,
          makingCharge: row.makingCharge,
        }),
        id: Number(item.id),
      };
      const response = await apiRequest<RainTreeResponse>(
        "/update/cart-item",
        { method: "PATCH", body: JSON.stringify(body) },
        "legacy"
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to update the quantity");
      }
    } else {
      await apiRequest<NestApiResponse<NestCartDto>>(
        `/v1/cart/items/${encodeURIComponent(item.id)}`,
        { method: "PATCH", body: JSON.stringify({ quantity }) },
        "nest"
      );
    }
  },

  /**
   * Remove a single row from the cart. `cartItemId` is the domain CartItem's
   * `id` — Loom's `cart_item` primary key, not a product id.
   */
  async removeCartItem(cartItemId: string): Promise<void> {
    const mode = env.NEXT_PUBLIC_API_MODE;

    if (mode === "legacy") {
      const response = await apiRequest<RainTreeResponse>(
        `/delete/cart-item/${encodeURIComponent(cartItemId)}`,
        { method: "DELETE" },
        "legacy"
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to remove item from cart");
      }
    } else {
      await apiRequest<NestApiResponse<NestCartDto>>(
        `/v1/cart/items/${encodeURIComponent(cartItemId)}`,
        { method: "DELETE" },
        "nest"
      );
    }
  },
};
