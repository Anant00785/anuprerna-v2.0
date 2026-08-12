import { Cart, CartItem } from "@/types/domain/cart";
import { NestCartDto, NestCartItemDto } from "../dto/nestjs.dto";
import { mapNestProductToDomain } from "./nest-catalog.adapter";

export function mapNestCartItemToDomain(dto: NestCartItemDto): CartItem {
  return {
    id: dto.id,
    productId: dto.productId,
    product: mapNestProductToDomain(dto.product),
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    totalPrice: dto.subtotal,
    selectedVariantId: dto.variantId,
  };
}

export function mapNestCartToDomain(dto: NestCartDto): Cart {
  return {
    id: dto.id,
    items: dto.items.map(mapNestCartItemToDomain),
    itemCount: dto.itemCount,
    subtotal: dto.subtotal,
    discount: dto.discountTotal,
    estimatedShipping: dto.shippingFee,
    total: dto.grandTotal,
    currency: dto.currency || "INR",
  };
}
