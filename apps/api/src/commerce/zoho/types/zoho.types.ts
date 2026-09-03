export interface ZohoTokenResponse {
  access_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
}

export interface ZohoContactPayload {
  contact_name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  contact_type?: 'customer' | 'vendor';
}

export interface ZohoItemPayload {
  name: string;
  rate: number;
  description?: string;
  sku?: string;
  product_type?: 'goods' | 'service';
}

export interface ZohoWebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: number;
}
