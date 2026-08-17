/**
 * Canonical Domain Cart Interface
 * Cart drawer, Cart page, and Checkout consume only these types.
 */

import { Product } from "./product";

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  /** Unit the quantity is expressed in, e.g. "METER" / "UNIT". */
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  discountedUnitPrice?: number;
  orderType?: "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER" | string;
  productGroup?: string;
  fabricProductId?: number | string;
  sizeDisplayName?: string;
  finishDisplayName?: string;
  customSize?: string;
  selectedSizeLabel?: string;
  selectedFabricName?: string;
  customSizeLabel?: string;
  selectedFinishNames?: string[];
  availableStock?: number;
  minOrderQuantity?: number;
  deliveryFromDays?: number;
  deliveryToDays?: number;
  selectedColor?: string;
  selectedVariantId?: string;
  /**
   * The backend row this item was mapped from, opaque to the UI.
   *
   * Loom's `PATCH /update/cart-item` re-binds the whole `CartItem` entity, so a
   * quantity change has to echo back every field the row was created with —
   * fields the domain type deliberately does not expose. Components pass the
   * item straight back to `cartRepository.updateQuantity`, which is the only
   * code that looks inside this.
   */
  source?: unknown;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  estimatedShipping: number;
  total: number;
  currency: string;
}
