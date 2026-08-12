import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

// --- FINISH PROFILE INTERFACES ---
export interface CustomFinishConfigItem {
  id?: number;
  label: string;
  price: number;
  description: string;
  image?: string;
  imageFile?: File | null;
  [key: string]: any;
}

export interface FinishProfile {
  id?: number;
  profileName: string;
  displayName?: string;
  timeOfCreation?: number;
  finishProfileItemList?: CustomFinishConfigItem[];
  [key: string]: any;
}

// --- FABRIC PROFILE INTERFACES ---
export interface FabricProfileConfigItem {
  id?: number;
  fabricId: number;
  heroImage?: string;
  mockupImage?: string;
  mockupText?: string;
  productName?: string;
  sku?: string;
  fabricPreview?: any;
  [key: string]: any;
}

export interface FabricProfile {
  id?: number;
  profileName: string;
  timeOfCreation?: number;
  fabricProfileItemList?: FabricProfileConfigItem[];
  [key: string]: any;
}

// --- CUSTOM SIZE PROFILE INTERFACES ---
export interface ProfileCustomSizeConfigItem {
  id?: number;
  label: string;
  placeholder?: string;
  fieldType?: number; // 0 for text/number
  mandatory?: boolean;
  [key: string]: any;
}

export interface CustomSizeProfile {
  id?: number;
  profileName: string;
  price?: number;
  disclaimer?: string;
  timeOfCreation?: number;
  customSizeProfileItemList?: ProfileCustomSizeConfigItem[];
  [key: string]: any;
}

// --- SIZE PROFILE INTERFACES ---
export interface ProfileSizeGuideItem {
  id?: number;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface ProfileSizeConfigItem {
  id?: number;
  sizeProfileId?: number;
  label: string;
  keyFeature?: string;
  consumedFabric?: number;
  sortOrder?: number;
  sizeProfileGuideList?: ProfileSizeGuideItem[];
  [key: string]: any;
}

export interface SizeProfile {
  id?: number;
  profileName: string;
  displayName?: string;
  disclaimer?: string;
  image?: string;
  timeOfCreation?: number;
  sizeProfileOptionList?: ProfileSizeConfigItem[];
  sizeProfileGuideList?: ProfileSizeGuideItem[];
  [key: string]: any;
}

// --- BADGE PROFILE INTERFACES ---
export interface ProfileBadgeConfigItem {
  id?: number;
  caption: string;
  link?: string;
  image?: string;
  imageFile?: File | null;
  [key: string]: any;
}

export interface BadgeProfile {
  id?: number;
  profileName: string;
  timeOfCreation?: number;
  badgeProfileItemList?: ProfileBadgeConfigItem[];
  [key: string]: any;
}

// --- VOLUME DISCOUNT PROFILE INTERFACES ---
export interface ProfileVolumeConfigItem {
  id?: number;
  minimumOrderQuantity: number;
  discount: number;
  preOrder?: boolean;
  advancePayment?: number;
  deliveryFromDays?: number;
  deliveryToDays?: number;
  [key: string]: any;
}

export interface VolumeDiscountProfile {
  id?: number;
  profileName: string;
  disclaimer?: string;
  timeOfCreation?: number;
  volumeDiscountProfileItemList?: ProfileVolumeConfigItem[];
  [key: string]: any;
}

// --- MADE TO ORDER PROFILE INTERFACES ---
export interface MadeToOrderProfile {
  id?: number;
  profileName: string;
  minimumOrderQuantity?: number;
  consumedFabric?: number;
  deliveryFromDays?: number;
  deliveryToDays?: number;
  timeOfCreation?: number;
  [key: string]: any;
}

export class ProfileService {
  // ==================== FINISH PROFILE ====================
  public static async getFinishProfiles(): Promise<FinishProfile[]> {
    const response = await apiClient.get('/get/finish-profile-list');
    const list = unwrapResponseData<FinishProfile[]>(response.data, 'finishProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getFinishProfileById(id: number): Promise<FinishProfile> {
    const response = await apiClient.get(`/get/finish-profile/${id}`);
    return unwrapResponseData<FinishProfile>(response.data, 'finishProfile');
  }

  public static async addFinishProfile(payload: FinishProfile): Promise<any> {
    const response = await apiClient.post('/add/finish-profile', payload);
    return response.data;
  }

  public static async updateFinishProfile(id: number, payload: FinishProfile): Promise<any> {
    const response = await apiClient.patch(`/update/finish-profile/${id}`, payload);
    return response.data;
  }

  public static async deleteFinishProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/finish-profile/${id}`);
    return response.data;
  }

  // ==================== FABRIC PROFILE ====================
  public static async getFabricProfiles(): Promise<FabricProfile[]> {
    const response = await apiClient.get('/get/fabric-profile-list');
    const list = unwrapResponseData<FabricProfile[]>(response.data, 'fabricProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getFabricProfileById(id: number): Promise<FabricProfile> {
    const response = await apiClient.get(`/get/fabric-profile/${id}`);
    return unwrapResponseData<FabricProfile>(response.data, 'fabricProfile');
  }

  public static async addFabricProfile(payload: FabricProfile): Promise<any> {
    const response = await apiClient.post('/add/fabric-profile', payload);
    return response.data;
  }

  public static async updateFabricProfile(id: number, payload: FabricProfile): Promise<any> {
    const response = await apiClient.patch(`/update/fabric-profile/${id}`, payload);
    return response.data;
  }

  public static async deleteFabricProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/fabric-profile/${id}`);
    return response.data;
  }

  // ==================== CUSTOM SIZE PROFILE ====================
  public static async getCustomSizeProfiles(): Promise<CustomSizeProfile[]> {
    const response = await apiClient.get('/get/custom-size-profile-list');
    const list = unwrapResponseData<CustomSizeProfile[]>(response.data, 'customSizeProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getCustomSizeProfileById(id: number): Promise<CustomSizeProfile> {
    const response = await apiClient.get(`/get/custom-size-profile/${id}`);
    return unwrapResponseData<CustomSizeProfile>(response.data, 'customSizeProfile');
  }

  public static async addCustomSizeProfile(payload: CustomSizeProfile): Promise<any> {
    const response = await apiClient.post('/add/custom-size-profile', payload);
    return response.data;
  }

  public static async updateCustomSizeProfile(payload: CustomSizeProfile): Promise<any> {
    const response = await apiClient.patch('/update/custom-size-profile', payload);
    return response.data;
  }

  public static async deleteCustomSizeProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/custom-size-profile/${id}`);
    return response.data;
  }

  // ==================== SIZE PROFILE ====================
  public static async getSizeProfiles(): Promise<SizeProfile[]> {
    const response = await apiClient.get('/get/size-profile-list');
    const list = unwrapResponseData<SizeProfile[]>(response.data, 'sizeProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getSizeProfileById(id: number): Promise<SizeProfile> {
    const response = await apiClient.get(`/get/size-profile/${id}`);
    return unwrapResponseData<SizeProfile>(response.data, 'sizeProfile');
  }

  public static async addSizeProfile(payload: SizeProfile): Promise<any> {
    const response = await apiClient.post('/add/size-profile', payload);
    return response.data;
  }

  public static async updateSizeProfile(id: number, payload: SizeProfile): Promise<any> {
    const response = await apiClient.patch(`/update/size-profile/${id}`, payload);
    return response.data;
  }

  public static async deleteSizeProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/size-profile/${id}`);
    return response.data;
  }

  // ==================== BADGE PROFILE ====================
  public static async getBadgeProfiles(): Promise<BadgeProfile[]> {
    const response = await apiClient.get('/get/badge-profile-list');
    const list = unwrapResponseData<BadgeProfile[]>(response.data, 'badgeProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getBadgeProfileById(id: number): Promise<BadgeProfile> {
    const response = await apiClient.get(`/get/badge-profile/${id}`);
    return unwrapResponseData<BadgeProfile>(response.data, 'badgeProfile');
  }

  public static async addBadgeProfile(payload: BadgeProfile): Promise<any> {
    const response = await apiClient.post('/add/badge-profile', payload);
    return response.data;
  }

  public static async updateBadgeProfile(id: number, payload: BadgeProfile): Promise<any> {
    const response = await apiClient.patch(`/update/badge-profile/${id}`, payload);
    return response.data;
  }

  public static async deleteBadgeProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/badge-profile/${id}`);
    return response.data;
  }

  // ==================== VOLUME DISCOUNT PROFILE ====================
  public static async getVolumeDiscountProfiles(): Promise<VolumeDiscountProfile[]> {
    const response = await apiClient.get('/get/volume-discount-profile-list');
    const list = unwrapResponseData<VolumeDiscountProfile[]>(response.data, 'volumeDiscountProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getVolumeDiscountProfileById(id: number): Promise<VolumeDiscountProfile> {
    const response = await apiClient.get(`/get/volume-discount-profile/${id}`);
    return unwrapResponseData<VolumeDiscountProfile>(response.data, 'volumeDiscountProfile');
  }

  public static async addVolumeDiscountProfile(payload: VolumeDiscountProfile): Promise<any> {
    const response = await apiClient.post('/add/volume-discount-profile', payload);
    return response.data;
  }

  public static async updateVolumeDiscountProfile(payload: VolumeDiscountProfile): Promise<any> {
    const response = await apiClient.patch('/update/volume-discount-profile', payload);
    return response.data;
  }

  public static async deleteVolumeDiscountProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/volume-discount-profile/${id}`);
    return response.data;
  }

  // ==================== MADE TO ORDER PROFILE ====================
  public static async getMadeToOrderProfiles(): Promise<MadeToOrderProfile[]> {
    const response = await apiClient.get('/get/made-to-order-profile-list');
    const list = unwrapResponseData<MadeToOrderProfile[]>(response.data, 'madeToOrderProfileList');
    return Array.isArray(list) ? list : [];
  }

  public static async getMadeToOrderProfileById(id: number): Promise<MadeToOrderProfile> {
    const response = await apiClient.get(`/get/made-to-order-profile/${id}`);
    return unwrapResponseData<MadeToOrderProfile>(response.data, 'madeToOrderProfile');
  }

  public static async addMadeToOrderProfile(payload: MadeToOrderProfile): Promise<any> {
    const response = await apiClient.post('/add/made-to-order-profile', payload);
    return response.data;
  }

  public static async updateMadeToOrderProfile(payload: MadeToOrderProfile): Promise<any> {
    const response = await apiClient.patch('/update/made-to-order-profile', payload);
    return response.data;
  }

  public static async deleteMadeToOrderProfile(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/made-to-order-profile/${id}`);
    return response.data;
  }
}
