export interface PLPProduct {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  price: number;
  hero_image: string;
  hover_image?: string;
  slug: string;
  unit: string;
  material?: string;
  color?: string;
  pattern?: string;
  gsm?: number;
  quantity?: number;
  total_quantity: number;
  made_to_order_fabric_quantity?: number;
  made_to_order_fabric_price?: number;
  consumed_fabric?: number;
  segment_category: string;
  sub_category: string;
  category: string;
  special_status?: string;
  volume_discount?: number;
  volume_discount_minimum_order_quantity?: number;
  max_discount_product_price?: number;
  max_discount_product_discount?: number;
  external_quantity?: number;
  product_group: 'fabric' | 'finished';
  calculatedPrice: number;
  calculatedDiscountedPrice?: number;
  inWishlist?: boolean;
  size_profile_option_list?: Array<{ quantity: number }>;
}

export interface PLPMetadataInfo {
  id: number;
  name: string;
  hex?: string;
  timeOfCreation?: number;
  version?: number;
}

export interface FilterKey {
  key: string;
  subKey?: string;
  name: string;
  type: 'default' | 'toggle' | 'sub' | 'csv' | 'range';
}

export interface FilterOption {
  key: number | string;
  value: string;
  active: boolean;
  displayName?: string;
  hex?: string;
  subOptions?: FilterOption[];
}

export interface FilterRangeOption {
  active: boolean;
  defaultMax: number;
  defaultMin: number;
  key: number;
  max: number;
  min: number;
  minGap: number;
  value1: number;
  value2: number;
}

export interface FilterControlGroup {
  title: string;
  key: FilterKey;
  cohort?: {
    options: FilterOption[];
  };
  rangeCohort?: FilterRangeOption;
}

export interface FilterControls {
  keys: FilterKey[];
  cohorts: FilterControlGroup[];
}

export interface FilterActiveChip {
  name: string;
  type: 'default' | 'toggle' | 'sub' | 'csv' | 'range';
  option?: FilterOption;
  range?: FilterRangeOption;
}

export interface FilterRelatedProduct {
  id: number;
  products: PLPProduct[];
}

export interface FilterSegment {
  name: string;
  icon?: string;
  metaTitle?: string;
}

export interface FilterSEO {
  name?: string;
  metaTitle?: string;
  metaDescription?: string;
  socialImage?: string;
  iconImage?: string;
}
