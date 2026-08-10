import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface ArtisanTenantPreview {
  id?: number;
  tenant?: {
    name?: string;
    email?: string;
    contactNumber?: string;
    [key: string]: any;
  };
  artisanRole?: string;
  state?: string;
  district?: string;
  villageTown?: string;
  [key: string]: any;
}

export interface ArtisanCatalogItemMedia {
  id?: number;
  mediaUrl: string;
  mediaType?: string;
  [key: string]: any;
}

export interface ArtisanCatalogItem {
  id?: number;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  unit?: string;
  createdAt?: number;
  updatedAt?: number;
  catalogItemMediaList?: ArtisanCatalogItemMedia[];
  [key: string]: any;
}

export interface ArtisanCatalog {
  id?: number;
  name: string;
  description?: string;
  artisan?: ArtisanTenantPreview;
  defaultCatalog?: boolean;
  createdAt?: number;
  updatedAt?: number;
  catalogItems?: ArtisanCatalogItem[];
  [key: string]: any;
}

export interface CatalogPdfDownload {
  id?: number;
  status?: string;
  downloadUrl?: string;
  artisanId?: number;
  createdAt?: number;
  [key: string]: any;
}

export class CatalogService {
  public static async getCatalogList(): Promise<ArtisanCatalog[]> {
    const response = await apiClient.get('/get/catalog-list');
    const list = unwrapResponseData<ArtisanCatalog[]>(response.data, 'catalogList');
    return Array.isArray(list) ? list : [];
  }

  public static async getCatalogListByArtisan(artisanId: string | number): Promise<ArtisanCatalog[]> {
    const response = await apiClient.get(`/get/catalog-list/artisan/${artisanId}`);
    const list = unwrapResponseData<ArtisanCatalog[]>(response.data, 'catalogList');
    return Array.isArray(list) ? list : [];
  }

  public static async getCatalogById(id: string | number): Promise<ArtisanCatalog> {
    const response = await apiClient.get(`/get/catalog/${id}`);
    return unwrapResponseData<ArtisanCatalog>(response.data, 'catalog');
  }

  public static async getCatalogItemById(id: string | number): Promise<ArtisanCatalogItem> {
    const response = await apiClient.get(`/get/catalog-item/${id}`);
    return unwrapResponseData<ArtisanCatalogItem>(response.data, 'catalogItem');
  }

  public static async deleteCatalog(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/catalog/${id}`);
    return response.data;
  }

  public static async deleteCatalogItem(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/catalog-item/${id}`);
    return response.data;
  }

  public static async deleteCatalogItemMedia(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/catalog-item-media/${id}`);
    return response.data;
  }

  public static async generateCatalogPdfByArtisan(artisanId: string | number): Promise<CatalogPdfDownload> {
    const response = await apiClient.post(`/add/catalog-pdf-generation/artisan/${artisanId}`, {});
    return unwrapResponseData<CatalogPdfDownload>(response.data, 'catalogPdfGeneration');
  }

  public static async getCatalogPdfGenerationHistoryByArtisan(artisanId: string | number): Promise<CatalogPdfDownload[]> {
    const response = await apiClient.get(`/get/catalog-pdf-generation-list/artisan/${artisanId}`);
    const list = unwrapResponseData<CatalogPdfDownload[]>(response.data, 'catalogPdfGenerationList');
    return Array.isArray(list) ? list : [];
  }
}
