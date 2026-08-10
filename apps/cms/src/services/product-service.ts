import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  socialImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface ProductSegment {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  category?: ProductCategory;
  categoryId?: number;
  metaTitle?: string;
  metaDescription?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface ProductSubCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  segment?: ProductSegment;
  segmentId?: number;
  metaTitle?: string;
  metaDescription?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface ColorFilter {
  id: number;
  name: string;
  hex?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface MaterialFilter {
  id: number;
  name: string;
  description?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface PatternFilter {
  id: number;
  name: string;
  description?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface SkuGroup {
  id: number;
  name: string;
  description?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface SpecialStatus {
  id: number;
  name: string;
  description?: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export interface Tag {
  id: number;
  name: string;
  timeOfCreation?: number;
  [key: string]: any;
}

export class ProductService {
  // PRODUCTS PREVIEW LIST
  public static async getFinishedProducts(): Promise<any[]> {
    try {
      const response = await apiClient.get('/get/finished-preview-list?returnDisabledProducts=true');
      const list = unwrapResponseData<any[]>(response.data, 'productPreviewList');
      return Array.isArray(list) ? list : (Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const responseFallback = await apiClient.get('/get/product-preview-list');
        const listFallback = unwrapResponseData<any[]>(responseFallback.data, 'productPreviewList');
        return Array.isArray(listFallback) ? listFallback : [];
      } catch {
        return [];
      }
    }
  }

  public static async getFabricProducts(): Promise<any[]> {
    try {
      const response = await apiClient.get('/get/fabric-overview-list');
      const list = unwrapResponseData<any[]>(response.data, 'fabricOverviewList');
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}

    try {
      const response = await apiClient.get('/get/fabric-preview-list?returnDisabledProducts=true');
      const list = unwrapResponseData<any[]>(response.data, 'productPreviewList');
      return Array.isArray(list) ? list : (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  }

  public static async disableFinishedProduct(id: number): Promise<any> {
    const response = await apiClient.post('/disable/finished-product', { id });
    return response.data;
  }

  public static async disableFabricProduct(id: number): Promise<any> {
    const response = await apiClient.post('/disable/fabric-product', { id });
    return response.data;
  }

  // CATEGORIES
  public static async getCategories(): Promise<ProductCategory[]> {
    const response = await apiClient.get('/get/category-list');
    const list = unwrapResponseData<ProductCategory[]>(response.data, 'categoryList');
    return Array.isArray(list) ? list : [];
  }

  public static async createCategory(payload: Partial<ProductCategory>): Promise<any> {
    const response = await apiClient.post('/add/category', payload);
    return response.data;
  }

  public static async updateCategory(payload: Partial<ProductCategory>): Promise<any> {
    const response = await apiClient.post('/update/category/', payload);
    return response.data;
  }

  public static async deleteCategory(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/category/${id}`);
    return response.data;
  }

  // SEGMENTS
  public static async getSegments(): Promise<ProductSegment[]> {
    const response = await apiClient.get('/get/segment-list');
    const list = unwrapResponseData<ProductSegment[]>(response.data, 'segmentList');
    return Array.isArray(list) ? list : [];
  }

  public static async createSegment(payload: Partial<ProductSegment>): Promise<any> {
    const response = await apiClient.post('/add/segment', payload);
    return response.data;
  }

  public static async updateSegment(payload: Partial<ProductSegment>): Promise<any> {
    const response = await apiClient.post('/update/segment/', payload);
    return response.data;
  }

  public static async deleteSegment(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/segment/${id}`);
    return response.data;
  }

  // SUB CATEGORIES
  public static async getSubCategories(): Promise<ProductSubCategory[]> {
    const response = await apiClient.get('/get/sub-category-list');
    const list = unwrapResponseData<ProductSubCategory[]>(response.data, 'subCategoryList');
    return Array.isArray(list) ? list : [];
  }

  public static async createSubCategory(payload: Partial<ProductSubCategory>): Promise<any> {
    const response = await apiClient.post('/add/sub-category', payload);
    return response.data;
  }

  public static async updateSubCategory(payload: Partial<ProductSubCategory>): Promise<any> {
    const response = await apiClient.post('/update/sub-category/', payload);
    return response.data;
  }

  public static async deleteSubCategory(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/sub-category/${id}`);
    return response.data;
  }

  // COLORS
  public static async getColors(): Promise<ColorFilter[]> {
    const response = await apiClient.get('/get/color-list');
    const list = unwrapResponseData<ColorFilter[]>(response.data, 'colorList');
    return Array.isArray(list) ? list : [];
  }

  public static async createColor(name: string, hex: string): Promise<any> {
    const response = await apiClient.post('/add/color', { name: name.trim(), hex: hex.trim() });
    return response.data;
  }

  public static async updateColor(id: number, name: string, hex: string): Promise<any> {
    const response = await apiClient.post('/update/color', { id, name: name.trim(), hex: hex.trim() });
    return response.data;
  }

  public static async deleteColor(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/color/${id}`);
    return response.data;
  }

  // MATERIALS
  public static async getMaterials(): Promise<MaterialFilter[]> {
    const response = await apiClient.get('/get/material-list');
    const list = unwrapResponseData<MaterialFilter[]>(response.data, 'materialList');
    return Array.isArray(list) ? list : [];
  }

  public static async createMaterial(name: string, description?: string): Promise<any> {
    const response = await apiClient.post('/add/material', { name: name.trim(), description: description?.trim() || '' });
    return response.data;
  }

  public static async updateMaterial(id: number, name: string, description?: string): Promise<any> {
    const response = await apiClient.post('/update/material', { id, name: name.trim(), description: description?.trim() || '' });
    return response.data;
  }

  public static async deleteMaterial(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/material/${id}`);
    return response.data;
  }

  // PATTERNS
  public static async getPatterns(): Promise<PatternFilter[]> {
    const response = await apiClient.get('/get/pattern-list');
    const list = unwrapResponseData<PatternFilter[]>(response.data, 'patternList');
    return Array.isArray(list) ? list : [];
  }

  public static async createPattern(name: string, description?: string): Promise<any> {
    const response = await apiClient.post('/add/pattern', { name: name.trim(), description: description?.trim() || '' });
    return response.data;
  }

  public static async updatePattern(id: number, name: string, description?: string): Promise<any> {
    const response = await apiClient.post('/update/pattern', { id, name: name.trim(), description: description?.trim() || '' });
    return response.data;
  }

  public static async deletePattern(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/pattern/${id}`);
    return response.data;
  }

  // SKU GROUPS
  public static async getSkuGroups(): Promise<SkuGroup[]> {
    const response = await apiClient.get('/get/sku-group-list');
    const list = unwrapResponseData<SkuGroup[]>(response.data, 'skuGroupList');
    return Array.isArray(list) ? list : [];
  }

  public static async createSkuGroup(name: string): Promise<any> {
    const response = await apiClient.post('/add/sku-group', { name: name.trim() });
    return response.data;
  }

  public static async updateSkuGroup(id: number, name: string): Promise<any> {
    const response = await apiClient.post('/update/sku-group', { id, name: name.trim() });
    return response.data;
  }

  public static async deleteSkuGroup(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/sku-group/${id}`);
    return response.data;
  }

  // SPECIAL STATUS
  public static async getSpecialStatuses(): Promise<SpecialStatus[]> {
    const response = await apiClient.get('/get/special-status-list');
    const list = unwrapResponseData<SpecialStatus[]>(response.data, 'specialStatusList');
    return Array.isArray(list) ? list : [];
  }

  public static async createSpecialStatus(name: string): Promise<any> {
    const response = await apiClient.post('/add/special-status', { name: name.trim() });
    return response.data;
  }

  public static async updateSpecialStatus(id: number, name: string): Promise<any> {
    const response = await apiClient.post('/update/special-status', { id, name: name.trim() });
    return response.data;
  }

  public static async deleteSpecialStatus(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/special-status/${id}`);
    return response.data;
  }

  // TAGS
  public static async getTags(): Promise<Tag[]> {
    const response = await apiClient.get('/get/tag-list');
    const list = unwrapResponseData<Tag[]>(response.data, 'tagList');
    return Array.isArray(list) ? list : [];
  }

  public static async createTag(name: string): Promise<any> {
    const response = await apiClient.post('/add/tag', { name: name.trim() });
    return response.data;
  }

  public static async updateTag(id: number, name: string): Promise<any> {
    const response = await apiClient.post('/update/tag', { id, name: name.trim() });
    return response.data;
  }

  public static async deleteTag(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/tag/${id}`);
    return response.data;
  }

  // STOCK SYNC
  public static async syncStock(): Promise<any> {
    const response = await apiClient.post('/sync/stock', {});
    return response.data;
  }
}
