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
  unitPrice: number;
  totalPrice: number;
  selectedColor?: string;
  selectedVariantId?: string;
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
