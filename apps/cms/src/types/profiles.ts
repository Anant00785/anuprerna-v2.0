/**
 * Profile-cluster types — Milestone 2 of the Weave CMS rebuild.
 *
 * Mirrors the Loom entity shapes returned by the *-profile-list endpoints via
 * the :8090 wrapper. Field names are taken verbatim from the old Angular Weave
 * interfaces (src/app/manage-profile/.../interface/*.ts) so the assembled
 * write-payloads match what Loom expects.
 *
 * The seven profile types:
 *   badge          → /get/badge-profile-list           (badgeProfileList)
 *   volume         → /get/volume-discount-profile-list (volumeDiscountProfileList)
 *   size           → /get/size-profile-list            (sizeProfileList)
 *   customSize     → /get/custom-size-profile-list      (customSizeProfileList)
 *   fabric         → /get/fabric-profile-list           (fabricProfileList)
 *   customFinish   → /get/finish-profile-list           (finishProfileList)
 *   madeToOrder    → /get/made-to-order-profile-list     (madeToOrderProfileList)
 */

// ── Badge ───────────────────────────────────────────────────────────────
export interface ProfileBadgeConfigItem {
  id: number;
  caption: string;
  link: string;
  image: string;
}
export interface ProfileBadgeItem {
  id: number;
  profileName: string;
  timeOfCreation?: number;
  badgeProfileItemList: ProfileBadgeConfigItem[];
}

// ── Volume Discount ──────────────────────────────────────────────────────
export interface ProfileVolumeConfigItem {
  id: number;
  minimumOrderQuantity: number;
  discount: number;
  preOrder: boolean;
  advancePayment: number;
  deliveryFromDays: number;
  deliveryToDays: number;
}
export interface ProfileVolumeItem {
  id: number;
  profileName: string;
  disclaimer: string;
  volumeDiscountProfileItemList: ProfileVolumeConfigItem[];
}

// ── Size ─────────────────────────────────────────────────────────────────
export interface ProfileSizeConfigItem {
  id: number;
  sizeProfileId?: number;
  label: string;
  keyFeature: string;
  consumedFabric: number;
  sortOrder: number;
}
export interface ProfileSizeGuideItem {
  id: number;
  sizeProfileId?: number;
  sizeProfileOptionId?: number;
  guide: string;
  value: number;
  sortOrder: number;
}
export interface ProfileSizeItem {
  id: number;
  profileName: string;
  displayName: string;
  disclaimer: string;
  image: string;
  timeOfCreation?: number;
  sizeProfileOptionList: ProfileSizeConfigItem[];
  sizeProfileGuideList: ProfileSizeGuideItem[];
}

// ── Custom Size ──────────────────────────────────────────────────────────
// fieldType: 0 = STRING, 1 = NUMBER (from old Angular add-config select)
export interface ProfileCustomSizeConfigItem {
  id: number;
  label: string;
  placeholder: string;
  fieldType: number;
  mandatory: boolean;
}
export interface ProfileCustomSizeItem {
  id: number;
  profileName: string;
  price: number;
  disclaimer: string;
  customSizeProfileItemList: ProfileCustomSizeConfigItem[];
}

// ── Fabric ───────────────────────────────────────────────────────────────
export interface FabricProfileConfigItem {
  id: number;
  fabricId: number;
  heroImage?: string;
  mockupImage: string;
  mockupText: string;
  productName: string;
  sku: string;
}
export interface FabricProfileItem {
  id: number;
  profileName: string;
  fabricProfileItemList: FabricProfileConfigItem[];
}

// ── Custom Finish ────────────────────────────────────────────────────────
export interface CustomFinishConfigItem {
  id: number;
  label: string;
  price: number;
  description: string;
  image: string;
}
export interface ProfileCustomFinish {
  id: number;
  profileName: string;
  displayName: string;
  finishProfileItemList: CustomFinishConfigItem[];
}

// ── Made To Order (flat — no sub-list) ───────────────────────────────────
export interface ProfileMadeToOrder {
  id: number;
  profileName: string;
  consumedFabric: number;
  deliveryFromDays: number;
  deliveryToDays: number;
  minimumOrderQuantity: number;
}

export type ProfileType =
  | "badge"
  | "volume"
  | "size"
  | "custom-size"
  | "fabric"
  | "custom-finish"
  | "made-to-order";
