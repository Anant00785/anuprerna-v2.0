import { Cart, CartItem } from "@/types/domain/cart";
import { Product } from "@/types/domain/product";
import { LegacyCartItemDto, LegacyCartPreviewDto } from "../dto/legacy-springboot.dto";
import { resolveImageUrl } from "./legacy-catalog.adapter";
import { calculateVDProductPrice, getConsumedFabric } from "@/lib/pdp/pricing-engine";

const FREE_SHIPPING_THRESHOLD = 2000;
const FLAT_SHIPPING_CHARGE = 150;

/**
 * A cart row carries whichever preview matches its `productGroup`; the other is
 * null. Both wrap the same `product` shape, so the mapping does not need to care.
 */
function previewOf(dto: any): any {
  return dto.fabricProductPreview ?? dto.finishedProductPreview ?? dto.preview ?? undefined;
}

function resolveAvailableStock(dto: any, preview: any, source: any): number | undefined {
  // 1. If size profile option is selected on cart item:
  let selectedSizeOpt = dto.selectedSizeOption ?? source?.selectedSizeOption ?? preview?.selectedSizeOption;

  // Fix: Backend might not return the full selectedSizeOption object, but it might have the ID or label
  const sizes = source?.productSizeProfileList ?? preview?.productSizeProfileList ?? [];
  if (!selectedSizeOpt && Array.isArray(sizes)) {
    const fallbackId = (dto as any).selectedSizeOptionId ?? (dto as any).selectedSizeProfileOptionId;
    if (fallbackId) {
      const match = sizes.find((s: any) => s.sizeProfileOption && String(s.sizeProfileOption.id) === String(fallbackId));
      if (match) selectedSizeOpt = match.sizeProfileOption;
    }
  }
  if (selectedSizeOpt) {
    const sizeQty = Number(selectedSizeOpt.quantity ?? selectedSizeOpt.availableQuantity ?? selectedSizeOpt.totalQuantity);
    if (!isNaN(sizeQty) && sizeQty > 0) {
      return sizeQty;
    }
  }

  // Look in product size profile list if available
  const availableSizes =
    source?.productSizeProfileList ??
    preview?.productSizeProfileList ??
    dto.productSizeProfileList ??
    dto.product_size_profile_option_list ??
    preview?.product_size_profile_option_list;

  if (availableSizes && Array.isArray(sizes) && availableSizes.length > 0 && (selectedSizeOpt || dto.sizeDisplayName)) {
    const targetLabel = String(selectedSizeOpt?.label ?? selectedSizeOpt?.name ?? dto.sizeDisplayName ?? "").toLowerCase().trim();
    const targetId = selectedSizeOpt?.id ? String(selectedSizeOpt.id) : null;

    const matched = availableSizes.find((s: any) => {
      const opt = s.sizeProfileOption ?? s.size_profile_option ?? s;
      const l = String(opt?.label ?? opt?.name ?? s.label ?? s.name ?? "").toLowerCase().trim();
      const id = opt?.id ? String(opt.id) : s.id ? String(s.id) : null;
      return (targetId && id === targetId) || (targetLabel && l === targetLabel);
    });

    if (matched) {
      const matchedQty = Number(matched.quantity ?? matched.totalQuantity ?? matched.availableQuantity);
      if (!isNaN(matchedQty) && matchedQty > 0) {
        return matchedQty;
      }
    }
  }

  // 2. Direct product totalQuantity or quantity
  const directQty = Number(
    dto.totalQuantity ??
    dto.availableQuantity ??
    source?.totalQuantity ??
    source?.quantity ??
    source?.availableQuantity ??
    preview?.totalQuantity ??
    preview?.quantity ??
    preview?.availableQuantity ??
    0
  );

  if (directQty > 0) {
    return directQty;
  }

  // 3. Made-to-order fabric stock capacity calculation
  const mtoFabric = dto.selectedFabric?.product ?? source?.madeToOrderFabric ?? preview?.madeToOrderFabric;
  const mtoFabricQty = Number(
    mtoFabric?.totalQuantity ??
    mtoFabric?.quantity ??
    source?.made_to_order_fabric_quantity ??
    0
  );

  const consumed = Number(
    selectedSizeOpt?.consumedFabric ??
    source?.madeToOrderProfile?.consumedFabric ??
    source?.consumed_fabric ??
    1
  );

  if (mtoFabricQty > 0 && consumed > 0) {
    return Math.floor(mtoFabricQty / consumed);
  }

  return directQty > 0 ? directQty : undefined;
}

export function mapLegacyCartItemToDomain(dto: any): CartItem {
  const preview = previewOf(dto);
  const source = preview?.product ?? preview ?? dto.product ?? dto;

  const rawName =
    source?.name ??
    preview?.name ??
    dto.productName ??
    dto.name ??
    "Artisan Fabric Item";

  const rawImage =
    source?.heroImage ??
    source?.thumbnailImage ??
    source?.primaryImage ??
    source?.imageUrl ??
    preview?.heroImage ??
    preview?.thumbnailImage ??
    dto.heroImage ??
    dto.thumbnailImage ??
    dto.imageUrl ??
    dto.image;

  const image = resolveImageUrl(rawImage);
  const availableQuantity = resolveAvailableStock(dto, preview, source);

  // Calculate finishes and custom size surcharges
  let selectFinishPrice = 0;
  if (Array.isArray(dto.selectedFinishList) && dto.selectedFinishList.length > 0) {
    selectFinishPrice = dto.selectedFinishList.reduce((sum: number, f: any) => sum + Number(f.price || 0), 0);
  }

  let customSizePrice = 0;
  const hasValidCustomSize = dto.customSize && (typeof dto.customSize === "string" ? dto.customSize.length > 0 : Object.keys(dto.customSize).length > 0);
  if (hasValidCustomSize && source?.customSizeProfile?.price) {
    customSizePrice = Number(source.customSizeProfile.price);
  }

  let selectedSizeOpt = dto.selectedSizeOption ?? source?.selectedSizeOption ?? preview?.selectedSizeOption;

  const availableSizes = source?.productSizeProfileList ?? preview?.productSizeProfileList ?? [];
  if (!selectedSizeOpt && Array.isArray(availableSizes)) {
    const fallbackId = dto.selectedSizeOptionId ?? dto.selectedSizeProfileOptionId;
    if (fallbackId) {
      const match = availableSizes.find((s: any) => s.sizeProfileOption && String(s.sizeProfileOption.id) === String(fallbackId));
      if (match) selectedSizeOpt = match.sizeProfileOption;
    }
  }

  const consumedFabric = getConsumedFabric(source, selectedSizeOpt);

  // Accurately resolve base unit price matching Angular calculateFinishProductPrice & calculateFabricProductPrice 1:1
  const isFinished =
    source?.productGroup === "finished" ||
    dto.productGroup === "finished" ||
    preview?.productGroup === "finished" ||
    (source?.category && ["accessories", "home", "apparel"].includes(String(source.category).toLowerCase())) ||
    (preview?.category && ["accessories", "home", "apparel"].includes(String(preview.category).toLowerCase()));

  let baseUnitPrice = 0;

  if (isFinished) {
    const rawMakingCharge = dto.makingCharge !== undefined && dto.makingCharge !== null
      ? Number(dto.makingCharge)
      : Number(source?.price ?? preview?.price ?? 0);

    const customFabricPrice = dto.selectedFabric?.fabricPreview?.price ?? dto.selectedFabric?.product?.price ?? dto.selectedFabric?.price;
    const mtoFabric = source?.madeToOrderFabric ?? preview?.madeToOrderFabric;
    const mtoFabricPrice = mtoFabric?.price ?? source?.made_to_order_fabric_price;

    let selectedFabricPrice = 0;
    if (customFabricPrice !== undefined && customFabricPrice !== null && !isNaN(Number(customFabricPrice)) && Number(customFabricPrice) > 0) {
      selectedFabricPrice = Number(customFabricPrice);
    } else if (mtoFabricPrice !== undefined && mtoFabricPrice !== null && !isNaN(Number(mtoFabricPrice)) && Number(mtoFabricPrice) > 0) {
      selectedFabricPrice = Number(mtoFabricPrice);
    }

    baseUnitPrice = Math.round((rawMakingCharge + (selectedFabricPrice * consumedFabric) + selectFinishPrice + customSizePrice) * 100) / 100;
    console.log("[DEBUG CART] Finished product calculation:", {
      rawMakingCharge, selectedFabricPrice, consumedFabric, customSizePrice, selectFinishPrice,
      result: baseUnitPrice
    });
  } else {
    const rawMakingCharge = dto.makingCharge ? Number(dto.makingCharge) : 0;
    const rawFabricPrice = Number(source?.price ?? preview?.price ?? dto.price ?? 0);
    baseUnitPrice = Math.round((rawFabricPrice + rawMakingCharge + selectFinishPrice + customSizePrice) * 100) / 100;
  }

  // Allow explicit calculatedPrice override if provided by backend DTO
  if ((!baseUnitPrice || baseUnitPrice <= 0) && dto.calculatedPrice && Number(dto.calculatedPrice) > 0) {
    baseUnitPrice = Number(dto.calculatedPrice);
  }

  const quantity = Number(dto.quantity) || 1;

  // Volume Discount & MOQ Resolution matching Angular cart-information.service.ts 1:1
  let discountedUnitPrice: number | undefined = undefined;
  if (dto.calculatedDiscountPrice && Number(dto.calculatedDiscountPrice) > 0) {
    discountedUnitPrice = Number(dto.calculatedDiscountPrice);
  }

  let deliveryFromDays: number | undefined;
  let deliveryToDays: number | undefined;
  let minOrderQuantity: number =
    Number(dto.minOrderQuantity ?? dto.minimumOrderQuantity ?? preview?.minOrderQuantity ?? preview?.minimumOrderQuantity ?? 0);

  const vdProfile = source?.volumeDiscountProfile ?? preview?.volumeDiscountProfile ?? dto.volumeDiscountProfile ?? dto.volumeDiscount;
  const rawOrderType = String(dto.orderType ?? "").toUpperCase();
  const isPreOrder =
    rawOrderType === "PRE_ORDER" ||
    rawOrderType.includes("PRE") ||
    dto.productGroup === "bulk";

  if (vdProfile?.volumeDiscountProfileItemList && Array.isArray(vdProfile.volumeDiscountProfileItemList) && vdProfile.volumeDiscountProfileItemList.length > 0) {
    // Sort ascending to find lowest pre-order MOQ (matching Angular calculatePreOrderMinimumOrderQuantity)
    const vdListAsc = [...vdProfile.volumeDiscountProfileItemList].sort(
      (a: any, b: any) => a.minimumOrderQuantity - b.minimumOrderQuantity
    );

    const preOrderTier = vdListAsc.find((item: any) => item.preOrder || (item.advancePayment && item.advancePayment > 0));
    if (isPreOrder && (!minOrderQuantity || minOrderQuantity <= 1)) {
      minOrderQuantity = preOrderTier?.minimumOrderQuantity ?? (vdListAsc[0]?.minimumOrderQuantity || 25);
    }

    // Sort descending to find active discount tier for current quantity
    const vdListDesc = [...vdProfile.volumeDiscountProfileItemList].sort(
      (a: any, b: any) => b.minimumOrderQuantity - a.minimumOrderQuantity
    );

    const activeTier = vdListDesc.find((item: any) => item.minimumOrderQuantity <= quantity);
    if (activeTier) {
      deliveryFromDays = activeTier.deliveryFromDays;
      deliveryToDays = activeTier.deliveryToDays;

      // Always calculate exact bulk unit price matching Angular calculateVDProductPrice 1:1
      const computedBulkPrice = calculateVDProductPrice({
        product: source,
        selectedFabric: dto.selectedFabric,
        selectFinishPrice,
        customSizePrice,
        selectedVDProfile: activeTier,
        quantity,
        consumedFabric,
      });

      console.log("[DEBUG CART] Bulk pricing comparison:", {
        computedBulkPrice,
        baseUnitPrice,
        currentDiscountedUnitPrice: discountedUnitPrice,
        activeTierDiscount: activeTier.discount
      });

      if (computedBulkPrice > 0 && computedBulkPrice < baseUnitPrice) {
        discountedUnitPrice = computedBulkPrice;
      } else if (!discountedUnitPrice && activeTier.discount > 0) {
        discountedUnitPrice = Math.round(baseUnitPrice * (1 - (activeTier.discount || 0) / 100) * 100) / 100;
      }
    }
  }

  // Fallbacks for delivery lead times based on order type
  const mtoProfile = source?.madeToOrderProfile ?? preview?.madeToOrderProfile;
  if (isPreOrder) {
    deliveryFromDays = deliveryFromDays ?? 50;
    deliveryToDays = deliveryToDays ?? 60;
    if (!minOrderQuantity || minOrderQuantity <= 1) {
      minOrderQuantity = 25;
    }
  } else if (rawOrderType === "MADE_TO_ORDER") {
    deliveryFromDays = deliveryFromDays ?? mtoProfile?.deliveryFromDays ?? 15;
    deliveryToDays = deliveryToDays ?? mtoProfile?.deliveryToDays ?? 25;
    minOrderQuantity = mtoProfile?.minimumOrderQuantity ?? 1;
  } else {
    minOrderQuantity = 1;
  }

  const effectiveUnitPrice =
    discountedUnitPrice && discountedUnitPrice < baseUnitPrice
      ? discountedUnitPrice
      : baseUnitPrice;

  const product: Product = {
    id: String(source?.id ?? preview?.id ?? dto.fabricProductId ?? dto.finishedProductId ?? dto.id ?? ""),
    slug: source?.slug ?? preview?.slug ?? dto.slug ?? "",
    name: rawName,
    sku: source?.sku ?? preview?.sku ?? dto.sku ?? "",
    price: baseUnitPrice,
    currency: "INR",
    thumbnail: image,
    gallery: [image],
    inStock: (availableQuantity ?? 0) > 0,
    availableQuantity,
    gsm: preview?.gsm ?? source?.gsm,
  };

  return {
    id: String(dto.id ?? ""),
    productId: String(preview?.id ?? source?.id ?? dto.fabricProductId ?? dto.finishedProductId ?? product.id),
    product,
    quantity,
    unit: dto.unit ?? source?.unit ?? preview?.unit ?? "METER",
    unitPrice: baseUnitPrice,
    discountedUnitPrice,
    totalPrice: effectiveUnitPrice * quantity,
    orderType: isPreOrder ? "PRE_ORDER" : (dto.orderType ?? "IN_STOCK"),
    productGroup: dto.productGroup ?? "fabric",
    fabricProductId: dto.fabricProductId,
    availableStock: availableQuantity,
    minOrderQuantity,
    deliveryFromDays,
    deliveryToDays,
    sizeDisplayName:
      (selectedSizeOpt ? (selectedSizeOpt.label ?? selectedSizeOpt.name) : undefined) ??
      (dto.sizeDisplayName && dto.sizeDisplayName.toLowerCase() !== "size guide" ? dto.sizeDisplayName : undefined),
    finishDisplayName:
      dto.finishDisplayName ??
      (dto.selectedFinishList
        ? dto.selectedFinishList.map((f: any) => f.label ?? f.name).join(", ")
        : undefined),
    customSize:
      typeof dto.customSize === "object" && dto.customSize !== null
        ? JSON.stringify(dto.customSize)
        : dto.customSize,
    selectedFabricName: dto.selectedFabric?.product?.name ?? dto.selectedFabric?.name,
    source: dto,
  };
}

export function mapLegacyCartToDomain(cartItemList: LegacyCartItemDto[] = []): Cart {
  const items = cartItemList.map(mapLegacyCartItemToDomain);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const estimatedShipping = items.length === 0 ? 0 : FLAT_SHIPPING_CHARGE;

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
