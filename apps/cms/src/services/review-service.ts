import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface IReviewProductPreview {
  id: number;
  name: string;
  slug: string;
  sku: string;
  heroImage?: string;
  productGroup?: string;
  [key: string]: any;
}

export interface IReview {
  id?: number;
  name: string;
  city: string;
  country: string;
  rating: number;
  description: string;
  link?: string;
  activeUrl?: string;
  adminAdded?: boolean;
  productImages?: string;
  product?: IReviewProductPreview;
  productId?: number;
  orderId?: number;
  orderItemId?: number;
  status?: 'PENDING' | 'APPROVED' | 'REMOVED';
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export class ReviewService {
  public static async fetchReviewList(
    status: 'PENDING' | 'APPROVED' | 'REMOVED' = 'PENDING',
    pageNo = 0,
    pageSize = 50
  ): Promise<IReview[]> {
    const url = `/get/super-user/review?pageNumber=${pageNo}&pageSize=${pageSize}&status=${status}`;
    const response = await apiClient.get(url);
    const list = unwrapResponseData<IReview[]>(response.data, 'reviewList');
    return Array.isArray(list) ? list : [];
  }

  public static async addReview(payload: IReview): Promise<any> {
    const response = await apiClient.post('/add/review', payload);
    return response.data;
  }

  public static async updateReview(payload: IReview): Promise<any> {
    const response = await apiClient.patch('/update/super-user/review', payload);
    return response.data;
  }

  public static async uploadReviewImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('imageFile', file);
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.imageUrl || response.data?.url || '';
  }
}
