// @ts-nocheck
export interface ReviewInput {
  id?: bigint;
  name?: string;
  city?: string;
  country?: string;
  rating?: number;
  description?: string;
  productId?: number;
  orderId?: number;
  orderItemId?: number;
  productImages?: string;
  status?: string;
  link?: string;
  createdAt?: number;
}

export function parseReviewInput(raw: unknown): ReviewInput {
  const obj = raw as Record<string, unknown>;
  return {
    id: typeof obj.id === 'number' || typeof obj.id === 'bigint' ? BigInt(obj.id) : undefined,
    name: typeof obj.name === 'string' ? obj.name : undefined,
    city: typeof obj.city === 'string' ? obj.city : undefined,
    country: typeof obj.country === 'string' ? obj.country : undefined,
    rating: typeof obj.rating === 'number' ? obj.rating : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    productId: typeof obj.productId === 'number' ? obj.productId : undefined,
    orderId: typeof obj.orderId === 'number' ? obj.orderId : undefined,
    orderItemId: typeof obj.orderItemId === 'number' ? obj.orderItemId : undefined,
    productImages: typeof obj.productImages === 'string' ? obj.productImages : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
    link: typeof obj.link === 'string' ? obj.link : undefined,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : undefined,
  };
}
// @ts-nocheck
// @ts-nocheck
