// @ts-nocheck
export interface BehemothResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
// @ts-nocheck
// @ts-nocheck
