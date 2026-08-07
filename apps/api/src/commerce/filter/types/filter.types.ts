export interface FabricFilterPreview {
    id: bigint;
    gsm: number;
    productId: bigint;
    sku: string;
    name: string;
    price: number;
    heroImage: string;
    hoverImage: string;
    slug: string;
    unit: string;
    material: string;
    color: string;
    pattern: string;
    quantity: number;
    isMainProduct: boolean;
    segmentCategory: string;
    subCategory: string;
    category: string;
    specialStatus: string;
    volumeDiscount: number;
    volumeDiscountMinimumOrderQuantity: number;
    consumedFabric: number;
    minimumOrderQuantity: number;
    finishProfileItemList: any;
    maxDiscountProductPrice: number;
    maxDiscountProductDiscount: number;
    madeToOrderFabricQuantity: number;
    externalQuantity: number;
    totalQuantity: number;
    productGroup: string;
}

export interface FinishedFilterPreview {
    id: bigint;
    sku: string;
    name: string;
    price: number;
    heroImage: string;
    hoverImage: string;
    slug: string;
    unit: string;
    material: string;
    color: string;
    pattern: string;
    quantity: number;
    isMainProduct: boolean;
    segmentCategory: string;
    subCategory: string;
    specialStatus: string;
    externalQuantity: number;
    totalQuantity: number;
    volumeDiscount: number;
    volumeDiscountMinimumOrderQuantity: number;
    madeToOrderProfileConsumedFabric: number;
    minimumOrderQuantity: number;
    madeToOrderFabricQuantity: number;
    sizeProfileId: bigint;
    sizeProfileOptionList: any;
    productSizeProfileOptionList: any;
    madeToOrderFabricPrice: number;
    category: string;
    madeToOrderFabricDiscount: any;
    productGroup: string;
}

export interface FabricProductFilterParameters {
    colors?: string;
    materials?: string;
    patterns?: string;
    minPrice?: number;
    maxPrice?: number;
    minGSM?: number;
    maxGSM?: number;
    segments?: string;
    subCategories?: string;
    pageNumber: number;
    pageSize: number;
}
