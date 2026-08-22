export interface StockCalculationParams {
  totalQuantity?: number;
  quantity?: number;
  unit?: string;
  productGroup?: 'fabric' | 'finished' | 'swatch';
  orderType?: 'IN_STOCK' | 'MADE_TO_ORDER' | 'PRE_ORDER';
  madeToOrderProfileEnabled?: boolean;
  madeToOrderProfile?: {
    consumedFabric?: number;
    minimumOrderQuantity?: number;
  };
  madeToOrderFabric?: {
    totalQuantity?: number;
    price?: number;
  };
  productSizeProfileList?: Array<{
    disabled?: boolean;
    quantity: number;
    consumedFabric?: number;
    sizeProfileOption: {
      id?: number;
      label: string;
    };
  }>;
  selectedSizeOption?: {
    id?: number;
    label: string;
    consumedFabric?: number;
  };
  selectedFabric?: {
    id?: number;
    totalQuantity?: number;
    price?: number;
  };
  volumeDiscountProfileEnabled?: boolean;
  volumeDiscountProfile?: {
    volumeDiscountProfileItemList: Array<{
      minimumOrderQuantity: number;
      discount: number;
      preOrder?: boolean;
    }>;
  };
  minOrderQuantity?: number;
}

/**
 * Calculates the available in-stock quantity matching legacy fabric's
 * `CartInformationService.calculateFabricProductQuantity` & `calculateFinishProductQuantity`
 */
export function calculateAvailableStock(params: StockCalculationParams): number {
  const {
    totalQuantity = 0,
    productGroup = 'fabric',
    orderType = 'IN_STOCK',
    madeToOrderProfileEnabled,
    madeToOrderProfile,
    madeToOrderFabric,
    productSizeProfileList,
    selectedSizeOption,
    selectedFabric,
  } = params;

  if (orderType === 'PRE_ORDER') {
    // Pre-orders are not capped by current in-stock inventory
    return Infinity;
  }

  if (productGroup === 'swatch') {
    return totalQuantity > 0 ? totalQuantity : 9999;
  }

  if (productGroup === 'fabric') {
    if (totalQuantity > 0 && orderType === 'IN_STOCK') {
      return totalQuantity;
    }
    if (madeToOrderProfileEnabled && madeToOrderProfile) {
      const consumed = madeToOrderProfile.consumedFabric && madeToOrderProfile.consumedFabric > 0
        ? madeToOrderProfile.consumedFabric
        : 1;
      const fabricQty = selectedFabric?.totalQuantity ?? madeToOrderFabric?.totalQuantity ?? totalQuantity;
      return fabricQty > 0 ? Math.floor(fabricQty / consumed) : 0;
    }
    return totalQuantity;
  }

  // Finished products
  if (selectedSizeOption && productSizeProfileList && productSizeProfileList.length > 0) {
    const sizeInStock = productSizeProfileList
      .filter((s) => !s.disabled)
      .find((s) => s.sizeProfileOption.label === selectedSizeOption.label || s.sizeProfileOption.id === selectedSizeOption.id);

    if (sizeInStock && orderType === 'IN_STOCK') {
      return sizeInStock.quantity;
    }
  }

  if (madeToOrderProfileEnabled && madeToOrderProfile) {
    let consumed = selectedSizeOption?.consumedFabric ?? 1;
    if (selectedSizeOption && productSizeProfileList) {
      const pSize = productSizeProfileList.find((s) => s.sizeProfileOption.label === selectedSizeOption.label);
      if (pSize?.consumedFabric) consumed = pSize.consumedFabric;
    }
    if (consumed <= 0) consumed = madeToOrderProfile.consumedFabric ?? 1;
    const fabricQty = selectedFabric?.totalQuantity ?? madeToOrderFabric?.totalQuantity ?? totalQuantity;
    return fabricQty > 0 ? Math.floor(fabricQty / consumed) : 0;
  }

  return totalQuantity;
}

/**
 * Calculates minimum order quantity (MOQ) based on orderType matching fabric
 */
export function calculateMOQ(params: StockCalculationParams): number {
  const {
    productGroup,
    orderType = 'IN_STOCK',
    madeToOrderProfileEnabled,
    madeToOrderProfile,
    volumeDiscountProfileEnabled,
    volumeDiscountProfile,
    unit,
  } = params;

  if (productGroup === 'swatch') return 1;

  if (orderType === 'IN_STOCK') {
    return unit === 'METER' ? 0.5 : 1;
  }

  if (params.minOrderQuantity !== undefined && params.minOrderQuantity > 0) {
    return params.minOrderQuantity;
  }

  if (orderType === 'MADE_TO_ORDER') {
    if (madeToOrderProfileEnabled && madeToOrderProfile?.minimumOrderQuantity) {
      return madeToOrderProfile.minimumOrderQuantity;
    }
    return unit === 'METER' ? 0.5 : 1;
  }

  if (orderType === 'PRE_ORDER') {
    if (volumeDiscountProfileEnabled && volumeDiscountProfile) {
      const items = [...volumeDiscountProfile.volumeDiscountProfileItemList].sort(
        (a, b) => a.minimumOrderQuantity - b.minimumOrderQuantity
      );
      const preOrderItem = items.find((i) => i.preOrder);
      if (preOrderItem) return preOrderItem.minimumOrderQuantity;
    }
    return 50;
  }

  return 1;
}

/**
 * Returns increment step: 0.5 meters for fabric products, 1 for swatches/pieces
 */
export function getIncrementStep(unit?: string, productGroup?: string): number {
  if (unit === 'METER' && productGroup !== 'swatch') {
    return 0.5;
  }
  return 1;
}

export interface ClampQuantityResult {
  clampedQuantity: number;
  exceededMaxStock: boolean;
  exceededMinMOQ: boolean;
  warningMessage?: string;
}

/**
 * Validates requested quantity against stock limits and MOQs and clamps quantity.
 */
export function validateAndClampQuantity(
  requestedQuantity: number,
  params: StockCalculationParams
): ClampQuantityResult {
  const maxStock = calculateAvailableStock(params);
  const moq = calculateMOQ(params);
  const step = getIncrementStep(params.unit, params.productGroup);

  // Align with step multiplier (e.g. 0.5 for meters)
  let rounded = Math.round(requestedQuantity / step) * step;

  let exceededMaxStock = false;
  let exceededMinMOQ = false;
  let warningMessage: string | undefined;

  if (rounded > maxStock && isFinite(maxStock)) {
    rounded = maxStock < moq ? moq : maxStock;
    exceededMaxStock = true;
    warningMessage = `Maximum available stock reached. (Only ${maxStock} available)`;
  } else if (rounded < moq) {
    rounded = moq;
    exceededMinMOQ = true;
    warningMessage = `Minimum order quantity is ${moq}.`;
  }

  return {
    clampedQuantity: rounded,
    exceededMaxStock,
    exceededMinMOQ,
    warningMessage,
  };
}

/**
 * Calculates volume discount price if a discount threshold is met
 */
export function calculateVolumeDiscountPrice(
  basePrice: number,
  quantity: number,
  params: StockCalculationParams
): { finalPrice: number; discountPercent: number } {
  if (!params.volumeDiscountProfileEnabled || !params.volumeDiscountProfile) {
    return { finalPrice: basePrice, discountPercent: 0 };
  }

  const items = [...params.volumeDiscountProfile.volumeDiscountProfileItemList].sort(
    (a, b) => b.minimumOrderQuantity - a.minimumOrderQuantity
  );

  for (const item of items) {
    if (quantity >= item.minimumOrderQuantity) {
      const discount = item.discount || 0;
      const finalPrice = basePrice - basePrice * (discount / 100);
      return { finalPrice, discountPercent: discount };
    }
  }

  return { finalPrice: basePrice, discountPercent: 0 };
}
