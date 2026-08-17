/**
 * Canonical Pricing Engine matching Angular ProductInformationService 1:1
 */

export interface VDProfileItem {
  minimumOrderQuantity: number;
  discount: number;
  preOrder?: boolean;
  advancePayment?: number;
  deliveryFromDays?: number;
  deliveryToDays?: number;
}

export interface CalculateVDParams {
  product: any;
  selectedFabric?: any;
  selectFinishPrice?: number;
  customSizePrice?: number;
  selectedVDProfile: VDProfileItem;
  quantity?: number;
  consumedFabric?: number;
  loyaltyDiscount?: number;
}

/**
 * Resolves consumedFabric for a product & size, matching Angular ProductInformationService 1:1.
 */
export function getConsumedFabric(product: any, selectedSize?: any): number {
  if (!product) return 1;

  // 1. Look in productSizeProfileList / product_size_profile_option_list for matching size
  const sizeProfiles =
    product.productSizeProfileList ??
    product.product_size_profile_option_list ??
    product.productSpecificSizeProfile?.sizeProfileOptionList;

  if (sizeProfiles && Array.isArray(sizeProfiles) && sizeProfiles.length > 0) {
    if (selectedSize) {
      const targetLabel = String(selectedSize.label ?? selectedSize.name ?? "").toLowerCase().trim();
      const targetId = selectedSize.id ? String(selectedSize.id) : null;

      const matched = sizeProfiles.find((s: any) => {
        const opt = s.sizeProfileOption ?? s.size_profile_option ?? s;
        const l = String(opt?.label ?? opt?.name ?? s.label ?? s.name ?? "").toLowerCase().trim();
        const id = opt?.id ? String(opt.id) : s.id ? String(s.id) : null;
        return (targetId && id === targetId) || (targetLabel && l === targetLabel);
      });

      if (matched) {
        const matchedConsumed = Number(
          matched.consumedFabric ??
          matched.consumed_fabric ??
          matched.size_profile_option_consumed_fabric ??
          matched.sizeProfileOption?.consumedFabric ??
          matched.sizeProfileOption?.consumed_fabric ??
          0
        );
        if (!isNaN(matchedConsumed) && matchedConsumed > 0) {
          return matchedConsumed;
        }
      }
    } else {
      // If no size selected yet, pick the first option's consumedFabric
      const first = sizeProfiles[0];
      const firstConsumed = Number(
        first?.consumedFabric ??
        first?.consumed_fabric ??
        first?.size_profile_option_consumed_fabric ??
        first?.sizeProfileOption?.consumedFabric ??
        first?.sizeProfileOption?.consumed_fabric ??
        0
      );
      if (!isNaN(firstConsumed) && firstConsumed > 0) {
        return firstConsumed;
      }
    }
  }

  // 2. Look directly on selectedSize
  if (selectedSize) {
    const directConsumed = Number(
      selectedSize.consumedFabric ??
      selectedSize.consumed_fabric ??
      selectedSize.size_profile_option_consumed_fabric ??
      0
    );
    if (!isNaN(directConsumed) && directConsumed > 0) {
      return directConsumed;
    }
  }

  // 3. Look on madeToOrderProfile / product
  const mtoConsumed = Number(
    product.madeToOrderProfile?.consumedFabric ??
    product.made_to_order_profile_consumed_fabric ??
    product.consumed_fabric ??
    1
  );

  return (!isNaN(mtoConsumed) && mtoConsumed > 0) ? mtoConsumed : 1;
}

/**
 * Calculates finished or fabric product bulk price for a given volume discount tier,
 * matching Angular ProductInformationService.calculateVDProductPrice 1:1.
 */
export function calculateVDProductPrice({
  product,
  selectedFabric,
  selectFinishPrice = 0,
  customSizePrice = 0,
  selectedVDProfile,
  quantity,
  consumedFabric = 1,
  loyaltyDiscount = 0,
}: CalculateVDParams): number {
  if (!selectedVDProfile) return Number(product.price || 0);

  const isFinished =
    product.productGroup === "finished" ||
    product.product_group === "finished" ||
    (product.category && ["accessories", "home", "apparel"].includes(String(product.category).toLowerCase()));

  const targetQty = quantity ?? selectedVDProfile.minimumOrderQuantity;

  let selectedMadeToOrderFabricPrice = 0;
  let fabricPrice = 0;
  let makingCharges = 0;
  let selectedFabricQuantity = targetQty;

  const rawMakingCharge = Number(product.price || 0);

  // Determine fabric price per meter
  const customFabricPrice = selectedFabric?.fabricPreview?.price ?? selectedFabric?.price;
  const mtoFabric = product.madeToOrderFabric ?? product.made_to_order_fabric;
  const mtoFabricPrice = mtoFabric?.price ?? product.made_to_order_fabric_price;

  if (customFabricPrice !== undefined && customFabricPrice !== null && !isNaN(Number(customFabricPrice)) && Number(customFabricPrice) > 0) {
    selectedMadeToOrderFabricPrice = Number(customFabricPrice);
  } else if (mtoFabricPrice !== undefined && mtoFabricPrice !== null && !isNaN(Number(mtoFabricPrice)) && Number(mtoFabricPrice) > 0) {
    selectedMadeToOrderFabricPrice = Number(mtoFabricPrice);
  } else {
    selectedMadeToOrderFabricPrice = isFinished ? rawMakingCharge : 0;
  }

  if (isFinished) {
    fabricPrice = selectedMadeToOrderFabricPrice * consumedFabric;
    selectedFabricQuantity = targetQty * consumedFabric;
  } else {
    fabricPrice = selectedMadeToOrderFabricPrice * consumedFabric;
    const rawMtoPrice = mtoFabricPrice !== undefined && mtoFabricPrice !== null ? Number(mtoFabricPrice) : 0;
    makingCharges = rawMakingCharge - rawMtoPrice;
  }

  // Look up fabric volume discount list
  let volumeDiscountProfileItemList: VDProfileItem[] = [];
  const fabricVDProfile =
    selectedFabric?.fabricPreview?.volumeDiscountProfile ??
    selectedFabric?.volumeDiscountProfile ??
    mtoFabric?.volumeDiscountProfile ??
    product.madeToOrderFabric?.volumeDiscountProfile;

  if (fabricVDProfile?.volumeDiscountProfileItemList && Array.isArray(fabricVDProfile.volumeDiscountProfileItemList)) {
    volumeDiscountProfileItemList = [...fabricVDProfile.volumeDiscountProfileItemList].sort(
      (a: VDProfileItem, b: VDProfileItem) => b.minimumOrderQuantity - a.minimumOrderQuantity
    );
  }

  let fabricDiscount = 0;
  for (const item of volumeDiscountProfileItemList) {
    if (item.minimumOrderQuantity <= selectedFabricQuantity) {
      fabricDiscount = Number(item.discount || 0);
      if (loyaltyDiscount > 0) {
        fabricPrice = fabricPrice - fabricPrice * (loyaltyDiscount / 100);
      }
      fabricPrice = fabricPrice - fabricPrice * (fabricDiscount / 100);
      break;
    }
  }

  if (!fabricDiscount && loyaltyDiscount > 0) {
    fabricPrice = fabricPrice - fabricPrice * (loyaltyDiscount / 100);
  }

  let itemPrice = isFinished
    ? rawMakingCharge + selectFinishPrice + customSizePrice
    : makingCharges + selectFinishPrice + customSizePrice;

  if (loyaltyDiscount > 0) {
    itemPrice = itemPrice - itemPrice * (loyaltyDiscount / 100);
  }

  const vdDiscount = Number(selectedVDProfile.discount || 0);
  const discountedItemPrice = itemPrice - itemPrice * (vdDiscount / 100);

  const calculatedPrice = discountedItemPrice + fabricPrice;
  return Math.round(calculatedPrice * 100) / 100;
}
