import { Cart, CartItem } from "@/types/domain/cart";
import { Product } from "@/types/domain/product";
import { LegacyCartItemDto, LegacyCartPreviewDto } from "../dto/legacy-springboot.dto";
import { resolveImageUrl } from "./legacy-catalog.adapter";

const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_CHARGE = 150;

/**
 * A cart row carries whichever preview matches its `productGroup`; the other is
 * null. Both wrap the same `product` shape, so the mapping does not need to care.
 */
function previewOf(dto: LegacyCartItemDto): LegacyCartPreviewDto | undefined {
  return dto.fabricProductPreview ?? dto.finishedProductPreview ?? undefined;
}

export function mapLegacyCartItemToDomain(dto: LegacyCartItemDto): CartItem {
  const preview = previewOf(dto);
  const source = preview?.product;
  const image = resolveImageUrl(source?.heroImage);
  const availableQuantity = source?.totalQuantity ?? source?.quantity;

  const product: Product = {
    id: String(source?.id ?? ""),
    slug: source?.slug ?? "",
    name: source?.name ?? "Artisan Fabric Item",
    price: source?.price ?? 0,
    currency: "INR",
    thumbnail: image,
    gallery: [image],
    inStock: (availableQuantity ?? 0) > 0,
    availableQuantity,
    gsm: preview?.gsm,
  };

  const quantity = dto.quantity ?? 1;
  // Loom's `CartItem` entity has no price column — the `price` fabric posts on
  // `/add/cart-item` is accepted and dropped, and the row comes back without it.
  // The unit price therefore has to be recomputed from the preview's product.
  //
  // ponytail: volume-discount tiers, made-to-order fabric pricing and loyalty
  // discounts (fabric's CartInformationService.calculatePrice) are NOT applied.
  // This is a drawer/badge summary, not an authoritative total — port that
  // calculation here when checkout lands.
  const unitPrice = (source?.price ?? 0) + (dto.makingCharge ?? 0);

  return {
    id: String(dto.id ?? ""),
    // The *preview* id, not product.id: this is the id `/add/cart-item` binds to.
    productId: String(preview?.id ?? product.id),
    product,
    quantity,
    unit: dto.unit ?? source?.unit,
    unitPrice,
    totalPrice: unitPrice * quantity,
    source: dto,
  };
}

export function mapLegacyCartToDomain(cartItemList: LegacyCartItemDto[] = []): Cart {
  const items = cartItemList.map(mapLegacyCartItemToDomain);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  // Loom sends no shipping figure with the cart, so this stays the storefront's
  // own estimate. An empty cart is charged nothing rather than the flat rate.
  const estimatedShipping =
    items.length === 0 || subtotal > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_CHARGE;

  return {
    items,
    itemCount,
    subtotal,
    discount: 0,
    estimatedShipping,
    total: subtotal + estimatedShipping,
    currency: "INR",
  };
}
