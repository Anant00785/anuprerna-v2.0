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
    selectedFinishId: input.selectedFinishId ?? "",
    makingCharge: input.makingCharge ?? 0,
    customSize: input.customSize ?? {},
  };
  if (input.fabricProductId && input.fabricProductId > 0) body.fabricProductId = input.fabricProductId;
  if (input.finishedProductId && input.finishedProductId > 0) body.finishedProductId = input.finishedProductId;
  if (input.selectedFabricId && input.selectedFabricId > 0) body.selectedFabricId = input.selectedFabricId;
  if (input.selectedSizeOptionId && input.selectedSizeOptionId > 0) body.selectedSizeOptionId = input.selectedSizeOptionId;
  if (input.minOrderQuantity) body.minOrderQuantity = input.minOrderQuantity;
  return body;
}

export const cartRepository = {
  /**
   * Get active user cart
   */
  async getCart(): Promise<Cart> {
    try {
      const response = await apiRequest<LegacyCartListResponse>(
        "/get/cart-item/list",
        { next: { revalidate: 0 } } as RequestInit
      );
      return mapLegacyCartToDomain(response.cartItemList ?? []);
    } catch (err) {
      console.warn("Failed to fetch cart:", err);
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
  },

  /**
   * Add item to cart.
   */
  async addToCart(input: AddCartItemInput): Promise<void> {
    const response = await apiRequest<RainTreeResponse>(
      "/add/cart-item",
      {
        method: "POST",
        body: JSON.stringify(toLegacyCartItem(input)),
      }
    );
    if (!response.success && response.message) {
      throw new Error(response.message || "Failed to add item to cart");
    }
  },

  /**
   * Change the quantity on an existing cart row.
   */
  async updateQuantity(item: CartItem, quantity: number): Promise<void> {
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
      { method: "PATCH", body: JSON.stringify(body) }
    );
    if (!response.success && response.message) {
      throw new Error(response.message || "Failed to update the quantity");
    }
  },

  /**
   * Remove a single row from the cart. `cartItemId` is the domain CartItem's
   * `id` — Loom's `cart_item` primary key, not a product id.
   */
  async removeCartItem(cartItemId: string): Promise<void> {
    const response = await apiRequest<RainTreeResponse>(
      `/delete/cart-item/${encodeURIComponent(cartItemId)}`,
      { method: "DELETE" }
    );
    if (!response.success && response.message) {
      throw new Error(response.message || "Failed to remove item from cart");
    }
  },
};
