import { Cart, CartItem } from "@/types/domain/cart";
import { LegacyCartItemDto, LegacyCartResponseDto } from "../dto/legacy-springboot.dto";
import { mapLegacyProductToDomain } from "./legacy-catalog.adapter";

export function mapLegacyCartItemToDomain(dto: LegacyCartItemDto): CartItem {
  const product = dto.productDetails
    ? mapLegacyProductToDomain(dto.productDetails)
    : {
        id: String(dto.productId || "unknown"),
        slug: "",
        name: "Artisan Fabric Item",
        price: dto.unitPrice || 0,
        currency: "INR",
        thumbnail: "/images/placeholder.jpg",
        gallery: ["/images/placeholder.jpg"],
        inStock: true,
      };

  const quantity = dto.qty || 1;
  const unitPrice = dto.unitPrice ?? product.price;
  const totalPrice = dto.totalPrice ?? unitPrice * quantity;

  return {
    id: String(dto.cartItemId || dto.productId || Math.random().toString()),
    productId: String(dto.productId || product.id),
    product,
    quantity,
    unitPrice,
    totalPrice,
    selectedColor: dto.selectedColorHex,
    selectedVariantId: dto.variantId,
  };
}

export function mapLegacyCartToDomain(dto: LegacyCartResponseDto): Cart {
  const items = (dto.items || []).map(mapLegacyCartItemToDomain);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = dto.totalCartValue || items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const discount = dto.discountAmount || 0;
  const estimatedShipping = dto.deliveryCharge ?? (subtotal > 2000 ? 0 : 150);

  return {
    id: dto.cartId,
    items,
    itemCount,
    subtotal,
    discount,
    estimatedShipping,
    total: subtotal - discount + estimatedShipping,
    currency: "INR",
  };
}
