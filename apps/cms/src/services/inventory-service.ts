import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface Warehouse {
  id: number;
  name: string;
  description: string;
  createdAt?: number;
}

export interface InventoryAdjustmentReason {
  id: number;
  reason: string;
  description: string;
  createdAt?: number;
}

export interface InventoryAdjustmentItem {
  productId: number;
  productImage?: string;
  productName?: string;
  quantityAvailable: number;
  quantityAdjusted: number;
  quantityAtHand: number;
  product?: {
    name: string;
    sku: string;
    heroImage?: string;
    slug?: string;
  };
}

export interface InventoryAdjustmentLite {
  id: number;
  createdAt: number;
  adjustmentDate: number;
  warehouse: string;
  referenceNo: string;
  reason: string;
}

export interface InventoryAdjustmentDetail {
  id: number;
  createdAt: number;
  adjustmentDate: number;
  warehouse: Warehouse;
  referenceNo: string;
  reason: InventoryAdjustmentReason;
  description: string;
  adjustmentItemList: InventoryAdjustmentItem[];
}

export interface AddInventoryItem {
  productId: number;
  quantityAvailable: number;
  quantityAdjusted: number;
  quantityAtHand: number;
}

export interface AddInventoryAdjustmentDetail {
  adjustmentDate: number;
  warehouseId: number;
  referenceNo: string;
  reasonId: number;
  description: string;
  adjustmentItemList: AddInventoryItem[];
}

export interface InventoryRestockRequest {
  id: number;
  version?: number;
  tenant?: {
    id?: number;
    decryptedEmail?: string;
    decryptedFirstName?: string;
    decryptedLastName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  product?: {
    id: number;
    name: string;
    sku: string;
    heroImage?: string;
    slug?: string;
  };
  productGroup?: string;
  requestedQuantity: number;
  status: string;
  createdAt: number;
  notifiedAt?: number;
  madeToOrderProduct?: any;
  sizeOption?: any;
}

export interface UpdateRestockRequestPayload {
  id: number;
  productId: number;
  status: string;
  madeToOrderProductId?: number;
  sizeOptionId?: number;
}

export class InventoryService {
  // WAREHOUSE API
  public static async getWarehouses(): Promise<Warehouse[]> {
    const response = await apiClient.get('/get/warehouse');
    const list = unwrapResponseData<Warehouse[]>(response.data, 'warehouseList');
    return Array.isArray(list) ? list : [];
  }

  public static async getWarehouseById(id: number): Promise<Warehouse> {
    const response = await apiClient.get(`/get/warehouse/${id}`);
    return unwrapResponseData<Warehouse>(response.data, 'warehouse');
  }

  public static async createWarehouse(payload: Partial<Warehouse>): Promise<any> {
    const response = await apiClient.post('/add/warehouse', payload);
    return response.data;
  }

  public static async updateWarehouse(payload: Partial<Warehouse>): Promise<any> {
    const response = await apiClient.patch('/update/warehouse', payload);
    return response.data;
  }

  // INVENTORY REASON API
  public static async getInventoryReasons(): Promise<InventoryAdjustmentReason[]> {
    const response = await apiClient.get('/get/inventory-adjustment-reason');
    const list = unwrapResponseData<InventoryAdjustmentReason[]>(response.data, 'inventoryAdjustmentReasonList');
    return Array.isArray(list) ? list : [];
  }

  public static async getInventoryReasonById(id: number): Promise<InventoryAdjustmentReason> {
    const response = await apiClient.get(`/get/inventory-adjustment-reason/${id}`);
    return unwrapResponseData<InventoryAdjustmentReason>(response.data, 'inventoryAdjustmentReason');
  }

  public static async createInventoryReason(payload: Partial<InventoryAdjustmentReason>): Promise<any> {
    const response = await apiClient.post('/add/inventory-adjustment-reason', payload);
    return response.data;
  }

  public static async updateInventoryReason(payload: Partial<InventoryAdjustmentReason>): Promise<any> {
    const response = await apiClient.patch('/update/inventory-adjustment-reason', payload);
    return response.data;
  }

  // INVENTORY ADJUSTMENT API
  public static async getInventoryAdjustments(offset = 0, limit = 50, sku = ''): Promise<InventoryAdjustmentLite[]> {
    let url = `/get/inventory-adjustment?offset=${offset}&limit=${limit}`;
    if (sku && sku.trim() !== '') {
      url += `&sku=${encodeURIComponent(sku.trim())}`;
    }
    const response = await apiClient.get(url);
    const list = unwrapResponseData<InventoryAdjustmentLite[]>(response.data, 'inventoryAdjustmentList');
    return Array.isArray(list) ? list : [];
  }

  public static async getInventoryAdjustmentById(id: number): Promise<InventoryAdjustmentDetail> {
    const response = await apiClient.get(`/get/inventory-adjustment/${id}`);
    return unwrapResponseData<InventoryAdjustmentDetail>(response.data, 'inventoryAdjustment');
  }

  public static async createInventoryAdjustment(payload: AddInventoryAdjustmentDetail): Promise<any> {
    const response = await apiClient.post('/add/inventory-adjustment', payload);
    return response.data;
  }

  // RESTOCK REQUESTS / NOTIFICATIONS API
  public static async getRestockRequests(): Promise<InventoryRestockRequest[]> {
    const response = await apiClient.get('/get/inventory-restock-request');
    const list = unwrapResponseData<InventoryRestockRequest[]>(response.data, 'inventoryReStockRequestList');
    return Array.isArray(list) ? list : [];
  }

  public static async updateRestockRequestStatus(payload: UpdateRestockRequestPayload): Promise<any> {
    const response = await apiClient.patch('/update/inventory-restock-request/status', payload);
    return response.data;
  }

  public static async deleteRestockRequest(id: number): Promise<any> {
    const response = await apiClient.delete(`/delete/inventory-restock-request/${id}`);
    return response.data;
  }
}

